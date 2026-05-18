import { useMemo, useRef } from 'react'
import {
  queryByIntentWithRationale,
  type EntityRecommendationWithExplanation,
  type RecommendationRationale,
} from '@/lib/intentQueryEngine'
import {
  formatRecommendationList,
  hasUsableRationale,
  type FormattedEntityRecommendation,
  type GameExplanationContext,
} from '@/ui/recommendations/formatExplanation'
import { useAppStore } from '@/store/useAppStore'
import {
  RECOMMENDATION_INTENTS,
  type BlendedIntent,
  type RecommendationIntent,
} from '@/types/recommendationIntent'

export type { BlendedIntent } from '@/types/recommendationIntent'
import type { TftGameState } from '@/types/tft'

export type UseIntentAugmentRecommendationsOptions = {
  limit?: number
  minConfidence?: number
  enabled?: boolean
  compressionMode?: boolean
  gameState?: TftGameState | null
  /** When set, uses blended primary intent from overlay inference */
  blendedIntent?: BlendedIntent | null
}

export type IntentAugmentRecommendationsResult = {
  entities: EntityRecommendationWithExplanation[]
  formatted: FormattedEntityRecommendation[]
  rationale: RecommendationRationale | null
  hasExplanation: boolean
  blendedIntent: BlendedIntent | null
}

type IntentScores = Record<RecommendationIntent, number>

const STICKY_MS = 14_000
const SWITCH_MARGIN = 0.18
const BLEND_SECONDARY_MIN = 0.22

const overlayIntentMemory = {
  lastPrimary: null as RecommendationIntent | null,
  lastBlend: null as BlendedIntent | null,
  lastChangeMs: 0,
}

export function computeIntentScores(gs: TftGameState): IntentScores {
  const local = gs.roster.find((p) => p.isLocalPlayer)
  const hp = local?.health ?? 100
  const gold = gs.gold ?? 0
  const round = gs.round_type?.toLowerCase() ?? ''

  const scores: IntentScores = {
    tempo: 0.25,
    econ: 0,
    reroll: 0,
    stabilization: 0,
    transition: 0.08,
  }

  if (hp > 0 && hp < 38) {
    scores.stabilization = 1 - hp / 100
  } else if (hp > 0 && hp < 52) {
    scores.stabilization = 0.35
  }

  if (gold >= 50) scores.econ = Math.min(1, 0.55 + (gold - 50) / 50)
  else if (gold >= 35) scores.econ = 0.35

  if (gold > 0 && gold < 14) scores.reroll = (14 - gold) / 14

  if (round.includes('carousel') || round.includes('armory') || round.includes('augment')) {
    scores.transition = 0.85
  }

  if (hp >= 50 && gold >= 12 && gold < 42) scores.tempo = 0.65

  return scores
}

function normalizeWeights(scores: IntentScores): Partial<Record<RecommendationIntent, number>> {
  const sum = RECOMMENDATION_INTENTS.reduce((acc, k) => acc + scores[k], 0)
  if (sum <= 0) return { tempo: 1 }
  const weights: Partial<Record<RecommendationIntent, number>> = {}
  for (const intent of RECOMMENDATION_INTENTS) {
    const w = scores[intent] / sum
    if (w >= 0.08) weights[intent] = Math.round(w * 100) / 100
  }
  return weights
}

function blendLabel(weights: Partial<Record<RecommendationIntent, number>>): string {
  const ranked = RECOMMENDATION_INTENTS.map((intent) => ({
    intent,
    w: weights[intent] ?? 0,
  }))
    .filter((r) => r.w > 0)
    .sort((a, b) => b.w - a.w)

  if (ranked.length === 0) return 'tempo'
  if (ranked.length === 1) return ranked[0]!.intent

  const [a, b] = ranked
  if (b!.w >= BLEND_SECONDARY_MIN && a!.w < 0.72) {
    return `${a!.intent} + ${b!.intent}`
  }
  return a!.intent
}

export function computeBlendedIntent(gs: TftGameState, nowMs = Date.now()): BlendedIntent {
  const scores = computeIntentScores(gs)
  const weights = normalizeWeights(scores)
  const ranked = RECOMMENDATION_INTENTS.map((intent) => ({ intent, score: scores[intent] })).sort(
    (a, b) => b.score - a.score,
  )
  let primary = ranked[0]!.intent

  const prev = overlayIntentMemory.lastPrimary
  const best = ranked[0]!
  const second = ranked[1]!
  const margin = best.score > 0 ? (best.score - second.score) / best.score : 0

  if (prev && nowMs - overlayIntentMemory.lastChangeMs < STICKY_MS) {
    const prevScore = scores[prev]
    const challengerLead = best.score > 0 ? (best.score - prevScore) / best.score : 0
    if (challengerLead < SWITCH_MARGIN && margin < SWITCH_MARGIN + 0.08) {
      primary = prev
    }
  } else if (margin < 0.12 && prev) {
    primary = prev
  }

  if (overlayIntentMemory.lastPrimary !== primary) {
    overlayIntentMemory.lastPrimary = primary
    overlayIntentMemory.lastChangeMs = nowMs
  }

  const blend: BlendedIntent = {
    primary,
    weights,
    label: blendLabel(weights),
  }
  overlayIntentMemory.lastBlend = blend
  return blend
}

/**
 * @deprecated Prefer computeBlendedIntent — returns primary only for backward compatibility.
 */
export function inferRecommendationIntentFromGameState(
  gs: TftGameState,
  nowMs = Date.now(),
): RecommendationIntent {
  return computeBlendedIntent(gs, nowMs).primary
}

export function gameContextFromState(
  gs: TftGameState | null | undefined,
  blended?: BlendedIntent | null,
): GameExplanationContext | undefined {
  if (!gs) return undefined
  const local = gs.roster.find((p) => p.isLocalPlayer)
  return {
    hp: local?.health,
    gold: gs.gold ?? undefined,
    stage: gs.stage ?? undefined,
    roundType: gs.round_type ?? undefined,
    blendedLabel: blended?.label,
  }
}

export function useStabilizedOverlayIntent(gameState: TftGameState): BlendedIntent {
  const stableRef = useRef<{ blend: BlendedIntent; sig: string } | null>(null)

  return useMemo(() => {
    const local = gameState.roster.find((p) => p.isLocalPlayer)
    const sig = [
      local?.health ?? '',
      gameState.gold ?? '',
      gameState.round_type ?? '',
      gameState.stage ?? '',
    ].join('|')

    const next = computeBlendedIntent(gameState)
    if (!stableRef.current || stableRef.current.sig !== sig) {
      stableRef.current = { blend: next, sig }
      return next
    }

    const refreshed = computeBlendedIntent(gameState)
    stableRef.current.blend = refreshed
    return refreshed
  }, [gameState])
}

export function useIntentAugmentRecommendations(
  intent: RecommendationIntent,
  options: UseIntentAugmentRecommendationsOptions = {},
): IntentAugmentRecommendationsResult {
  const gameDataVersion = useAppStore((s) => s.gameData.lastUpdated)
  const limit = options.limit ?? 5
  const minConfidence = options.minConfidence ?? 0.35
  const enabled = options.enabled !== false
  const compressionMode = options.compressionMode ?? false
  const blended = options.blendedIntent ?? null
  const queryIntent = blended?.primary ?? intent
  const gameContext = gameContextFromState(options.gameState ?? null, blended)

  const contextKey = options.gameState
    ? `${gameContext?.hp ?? ''}:${gameContext?.gold ?? ''}:${gameContext?.stage ?? ''}:${blended?.label ?? ''}`
    : ''

  return useMemo(() => {
    const empty: IntentAugmentRecommendationsResult = {
      entities: [],
      formatted: [],
      rationale: null,
      hasExplanation: false,
      blendedIntent: blended,
    }

    if (!enabled) return empty

    try {
      const result = queryByIntentWithRationale({
        intent: queryIntent,
        type: 'augment',
        limit,
        minConfidence,
      })

      const rationaleOk = hasUsableRationale(result.rationale)
      const formatted = formatRecommendationList(result.entities, result.rationale, {
        intent: queryIntent,
        listLimit: limit,
        compressionMode,
        gameContext,
        blendedIntent: blended ?? undefined,
      })

      return {
        entities: result.entities,
        formatted,
        rationale: rationaleOk ? result.rationale : null,
        hasExplanation: formatted.some((f) => f.hasExplanation),
        blendedIntent: blended,
      }
    } catch {
      return { ...empty, blendedIntent: blended }
    }
  }, [queryIntent, intent, limit, minConfidence, enabled, gameDataVersion, compressionMode, contextKey, blended])
}

/** @internal Test-only */
export function resetOverlayIntentMemory(): void {
  overlayIntentMemory.lastPrimary = null
  overlayIntentMemory.lastBlend = null
  overlayIntentMemory.lastChangeMs = 0
}
