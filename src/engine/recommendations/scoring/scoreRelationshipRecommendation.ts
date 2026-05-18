import { clamp01 } from '@/engine/recommendations/confidence'
import { adjustRelationshipConfidence } from '@/lib/recommendationFeedbackStore'
import { scoreRelationship } from '@/lib/relationshipScoring'
import type { CanonicalRelationship } from '@/types/canonicalRelationship'
import { INTENT_SIGNAL_AFFINITY } from '@/types/recommendationIntent'
import { applyConfidenceCalibration } from './applyConfidenceCalibration'
import type { RelationshipRecommendationScore, ScoreContext } from './types'

function aggregateSampleSize(rel: CanonicalRelationship): number {
  const sizes = rel.signals?.map((s) => s.sampleSize ?? 0) ?? []
  if (sizes.length === 0) return 0
  return Math.max(...sizes)
}

function patchStability(rel: CanonicalRelationship, ctx: ScoreContext): number {
  if (!ctx.currentPatch) return 0.85
  const signals = rel.signals ?? []
  if (signals.length === 0) return 0.7
  const matching = signals.filter((s) => !s.patch || s.patch === ctx.currentPatch).length
  return matching / signals.length
}

function winRateDeltaFromSource(_rel: CanonicalRelationship, ctx: ScoreContext): number {
  if (ctx.sourceWinRate == null) return 0
  const baseline = ctx.baselineWinRate ?? 50
  return clamp01((ctx.sourceWinRate - baseline) / 50)
}

function intentSignalAffinity(rel: CanonicalRelationship, ctx: ScoreContext): number {
  if (!ctx.intent) return 0.5
  const preferred = new Set(INTENT_SIGNAL_AFFINITY[ctx.intent])
  const types = rel.signals?.map((s) => s.type) ?? []
  if (types.length === 0) return 0.4
  const hits = types.filter((t) => preferred.has(t)).length
  return clamp01(hits / types.length)
}

export function scoreRelationshipRecommendation(
  rel: CanonicalRelationship,
  ctx: ScoreContext = {},
): RelationshipRecommendationScore {
  const base = scoreRelationship(rel)
  const sample = aggregateSampleSize(rel)
  const patchStable = patchStability(rel, ctx)
  const wrDelta = winRateDeltaFromSource(rel, ctx)
  const derivedPenalty = rel.derived ? 0.12 : 0
  const intentBoost = intentSignalAffinity(rel, ctx)

  const withFeedback = adjustRelationshipConfidence(
    rel.sourceId,
    rel.targetId,
    rel.relationship,
    base * 0.5 + intentBoost * 0.3 + wrDelta * 0.2,
  )

  const feedbackAdjustment = withFeedback - base

  const raw = clamp01(withFeedback - derivedPenalty)

  const primarySignal = rel.signals?.[0]?.type
  const calibratedConfidence = applyConfidenceCalibration({
    rawScore: raw,
    sampleSize: sample,
    patchStability: patchStable,
    derived: rel.derived,
    entityPatch: rel.signals?.find((s) => s.patch)?.patch,
    currentPatch: ctx.currentPatch,
    signalType: primarySignal,
    hasStats: sample > 0,
  })

  return {
    relationship: rel,
    score: calibratedConfidence,
    calibratedConfidence,
    intent: ctx.intent,
    factors: {
      base,
      sampleSize: sample,
      patchStability: patchStable,
      winRateDelta: wrDelta,
      derivedPenalty,
      feedbackAdjustment,
    },
  }
}
