import type { CanonicalAugment } from '@/types/canonicalAugment'
import type { RelationshipSignalType } from '@/types/relationshipSignal'
import type { RecommendationIntent } from '@/types/recommendationIntent'
import {
  queryAugmentRecommendations,
  queryAugmentRelationshipRecommendations,
} from '@/lib/intentQueryEngine'

export type AugmentGraphHint = {
  canonicalId: string
  name: string
  score: number
  signalTypes: RelationshipSignalType[]
  relatedTargets: string[]
  intent?: RecommendationIntent
}

/**
 * Recommendation-facing graph context — routes through intentQueryEngine
 * (never raw relationship registry).
 */
export function getAugmentGraphHints(options?: {
  set?: number
  patch?: string
  minConfidence?: number
  limit?: number
  intent?: RecommendationIntent
}): AugmentGraphHint[] {
  const minConfidence = options?.minConfidence ?? 0.45
  const limit = options?.limit ?? 20
  const intent = options?.intent ?? 'stabilization'

  const ranked = queryAugmentRecommendations({
    set: options?.set,
    patch: options?.patch,
    intent,
    minConfidence,
    limit: limit * 2,
  })

  const hints: AugmentGraphHint[] = []

  for (const row of ranked) {
    const aug = row.entity as CanonicalAugment
    const rels = queryAugmentRelationshipRecommendations(aug.canonicalId, {
      set: options?.set,
      patch: options?.patch,
      intent,
      minConfidence,
      sourceWinRate: aug.stats?.winRate,
    })

    hints.push({
      canonicalId: aug.canonicalId,
      name: aug.name,
      score: row.score,
      signalTypes: [...new Set(rels.flatMap((r) => r.relationship.signals?.map((s) => s.type) ?? []))],
      relatedTargets: rels.map((r) => r.relationship.targetId),
      intent,
    })
  }

  return hints.sort((a, b) => b.score - a.score).slice(0, limit)
}

/** Synergy / counter edges for a picked augment — intent-aware, scored. */
export function getAugmentRelationshipContext(
  canonicalId: string,
  options?: {
    set?: number
    patch?: string
    minConfidence?: number
    intent?: RecommendationIntent
    sourceWinRate?: number
  },
) {
  return queryAugmentRelationshipRecommendations(canonicalId, {
    set: options?.set,
    patch: options?.patch,
    minConfidence: options?.minConfidence ?? 0.4,
    intent: options?.intent ?? 'stabilization',
    sourceWinRate: options?.sourceWinRate,
  })
}
