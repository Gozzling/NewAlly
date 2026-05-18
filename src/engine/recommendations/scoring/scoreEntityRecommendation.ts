import { clamp01 } from '@/engine/recommendations/confidence'
import { getEntityFeedbackAdjustment } from '@/lib/recommendationFeedbackStore'
import type { CanonicalAugment } from '@/types/canonicalAugment'
import type { CanonicalEntity } from '@/types/canonicalEntity'
import { INTENT_ENTITY_HINTS } from '@/types/recommendationIntent'
import { applyConfidenceCalibration } from './applyConfidenceCalibration'
import type { EntityRecommendationScore, ScoreContext } from './types'

function patchStability(entity: CanonicalEntity, ctx: ScoreContext): number {
  if (!ctx.currentPatch || !entity.patch) return 0.85
  return entity.patch === ctx.currentPatch ? 1 : 0.55
}

function winRateDelta(entity: CanonicalEntity, ctx: ScoreContext): number {
  const aug = entity as CanonicalAugment
  const wr = aug.stats?.winRate
  if (wr == null) return 0
  const baseline = ctx.baselineWinRate ?? 50
  return clamp01((wr - baseline) / 50)
}

function sampleSizeFactor(entity: CanonicalEntity): number {
  const aug = entity as CanonicalAugment
  const pick = aug.stats?.pickRate
  if (pick == null || pick <= 0) return 0
  return Math.min(500, pick * 5)
}

function intentAffinity(entity: CanonicalEntity, ctx: ScoreContext): number {
  if (!ctx.intent) return 0.5
  const hints = INTENT_ENTITY_HINTS[ctx.intent]
  const blob = `${entity.name} ${(entity as CanonicalAugment).tags?.join(' ') ?? ''} ${(entity as CanonicalAugment).formattedDescription ?? ''}`.toLowerCase()
  const hits = hints.filter((h) => blob.includes(h)).length
  return clamp01(0.35 + hits / Math.max(hints.length, 1) * 0.65)
}

function metadataBase(entity: CanonicalEntity): number {
  const completeness = entity.metadata?.completeness ?? {}
  const keys = Object.values(completeness).filter(Boolean).length
  return clamp01(0.4 + keys * 0.15)
}

export function scoreEntityRecommendation(
  entity: CanonicalEntity,
  ctx: ScoreContext = {},
): EntityRecommendationScore {
  const base = metadataBase(entity)
  const sample = sampleSizeFactor(entity)
  const patchStable = patchStability(entity, ctx)
  const wrDelta = winRateDelta(entity, ctx)
  const feedbackAdjustment = getEntityFeedbackAdjustment(entity.canonicalId)
  const intentBoost = intentAffinity(entity, ctx)

  const raw =
    base * 0.25 +
    intentBoost * 0.3 +
    wrDelta * 0.25 +
    patchStable * 0.1 +
    clamp01(sample / 200) * 0.1 +
    feedbackAdjustment

  const aug = entity as CanonicalAugment
  const calibratedConfidence = applyConfidenceCalibration({
    rawScore: raw,
    sampleSize: sample,
    patchStability: patchStable,
    derived: false,
    entityPatch: entity.patch,
    currentPatch: ctx.currentPatch,
    hasStats: aug.stats?.winRate != null || aug.stats?.pickRate != null,
  })

  return {
    entity,
    score: calibratedConfidence,
    calibratedConfidence,
    intent: ctx.intent,
    factors: {
      base,
      sampleSize: sample,
      patchStability: patchStable,
      winRateDelta: wrDelta,
      derivedPenalty: 0,
      feedbackAdjustment,
    },
  }
}
