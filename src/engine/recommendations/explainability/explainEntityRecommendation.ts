import type { CanonicalAugment } from '@/types/canonicalAugment'
import type { CanonicalEntity } from '@/types/canonicalEntity'
import { INTENT_ENTITY_HINTS } from '@/types/recommendationIntent'
import type { EntityRecommendationScore } from '@/engine/recommendations/scoring/types'
import type { RecommendationExplanation, ExplanationSignalSource } from './types'

function buildSignalSources(score: EntityRecommendationScore): ExplanationSignalSource[] {
  const sources: ExplanationSignalSource[] = [
    {
      kind: 'static_meta',
      weight: 0.45,
      note: 'Catalog metadata and augment completeness',
    },
  ]

  const aug = score.entity as CanonicalAugment
  if (aug.stats?.winRate != null || aug.stats?.pickRate != null) {
    sources.push({
      kind: 'match_history',
      weight: 0.35,
      note: 'Aggregated pick/win rates from meta samples',
    })
  }

  if (Math.abs(score.factors.feedbackAdjustment) > 0.01) {
    sources.push({
      kind: 'user_feedback',
      weight: 0.15,
      note: `Feedback adjustment ${score.factors.feedbackAdjustment >= 0 ? '+' : ''}${score.factors.feedbackAdjustment.toFixed(3)}`,
    })
  }

  return sources
}

function intentMatchedHints(entity: CanonicalEntity, intent?: string): string[] {
  if (!intent || !(intent in INTENT_ENTITY_HINTS)) return []
  const hints = INTENT_ENTITY_HINTS[intent as keyof typeof INTENT_ENTITY_HINTS]
  const aug = entity as CanonicalAugment
  const blob = `${entity.name} ${aug.tags?.join(' ') ?? ''} ${aug.formattedDescription ?? ''}`.toLowerCase()
  return hints.filter((h) => blob.includes(h))
}

export function explainEntityRecommendation(
  entityId: string,
  score: EntityRecommendationScore,
): RecommendationExplanation {
  const entity =
    score.entity.canonicalId.toLowerCase() === entityId.toLowerCase()
      ? score.entity
      : score.entity

  const aug = entity as CanonicalAugment
  const matchedHints = intentMatchedHints(entity, score.intent)
  const affinity =
    matchedHints.length > 0
      ? Math.min(1, 0.35 + (matchedHints.length / Math.max(INTENT_ENTITY_HINTS[score.intent ?? 'tempo']?.length ?? 1, 1)) * 0.65)
      : 0.35

  const summaryLines: string[] = [
    `Calibrated confidence ${(score.calibratedConfidence * 100).toFixed(0)}%`,
  ]

  if (aug.stats?.winRate != null) {
    summaryLines.push(`Win rate ${aug.stats.winRate.toFixed(1)}% vs baseline`)
  }
  if (score.intent && matchedHints.length > 0) {
    summaryLines.push(`Aligns with ${score.intent} intent (${matchedHints.slice(0, 3).join(', ')})`)
  }
  if (score.factors.patchStability < 0.9) {
    summaryLines.push('Patch drift reduced confidence')
  }
  if (score.factors.sampleSize < 25) {
    summaryLines.push('Limited sample depth — capped confidence')
  }

  return {
    entityId: entity.canonicalId,
    signalSources: buildSignalSources(score),
    confidence: {
      rawScore: score.score,
      calibratedConfidence: score.calibratedConfidence,
      factors: { ...score.factors },
    },
    historicalStats: {
      winRate: aug.stats?.winRate,
      pickRate: aug.stats?.pickRate,
      avgPlacement: aug.stats?.avgPlacement,
      sampleSize: score.factors.sampleSize,
    },
    intentAlignment: {
      intent: score.intent,
      affinityScore: affinity,
      matchedHints,
    },
    summaryLines,
  }
}
