import type { RecommendationIntent } from '@/types/recommendationIntent'
import type { EntityRecommendationScore, RelationshipRecommendationScore } from '@/engine/recommendations/scoring/types'
import { explainEntityRecommendation } from './explainEntityRecommendation'
import { explainRelationshipRecommendation } from './explainRelationshipRecommendation'
import type { RecommendationRationale } from './types'

export type RationaleInput = {
  intent: RecommendationIntent
  patch?: string
  set?: number
  entities: EntityRecommendationScore[]
  relationships?: RelationshipRecommendationScore[]
  maxSummaries?: number
}

/**
 * Builds a product-facing rationale bundle for UI surfaces (coach, overlay, augment guide).
 */
export function buildRecommendationRationale(input: RationaleInput): RecommendationRationale {
  const max = input.maxSummaries ?? 5
  const entitySummaries = input.entities
    .slice(0, max)
    .map((row) => explainEntityRecommendation(row.entity.canonicalId, row))

  const relationshipSummaries = (input.relationships ?? [])
    .slice(0, max)
    .map((row) =>
      explainRelationshipRecommendation(
        {
          sourceId: row.relationship.sourceId,
          targetId: row.relationship.targetId,
          relationship: row.relationship.relationship,
        },
        row,
      ),
    )

  const topReasons: string[] = []
  if (entitySummaries[0]) {
    topReasons.push(...entitySummaries[0].summaryLines.slice(0, 2))
  }
  if (relationshipSummaries[0]) {
    topReasons.push(relationshipSummaries[0].summaryLines[0])
  }
  topReasons.push(`Ranked for ${input.intent} intent`)

  return {
    intent: input.intent,
    patch: input.patch,
    set: input.set,
    topReasons: [...new Set(topReasons)].slice(0, 6),
    entitySummaries,
    relationshipSummaries,
    generatedAtMs: Date.now(),
  }
}
