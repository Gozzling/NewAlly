import type { EntityRecommendationScore, RelationshipRecommendationScore } from '@/engine/recommendations/scoring/types'
import type { RecommendationIntent } from '@/types/recommendationIntent'

export type CounterfactualBaseline = 'unranked' | 'intent_neutral' | 'no_feedback'

export type ImpactEstimate = {
  entityId: string
  currentScore: number
  baselineScore: number
  delta: number
  rankDelta?: number
}

export type AlternativeSimulation = {
  choiceId: string
  projectedScore: number
  vsSelectedDelta: number
}

/**
 * Estimates how much ranking/score changes vs a baseline configuration.
 */
export function estimateRecommendationImpact(
  ranked: EntityRecommendationScore[],
  options: {
    baseline?: CounterfactualBaseline
    intent?: RecommendationIntent
  } = {},
): ImpactEstimate[] {
  const baseline = options.baseline ?? 'intent_neutral'

  const baselineScores = ranked.map((row) => {
    if (baseline === 'unranked') {
      return row.factors.base * 0.5 + row.factors.winRateDelta * 0.25
    }
    if (baseline === 'no_feedback') {
      return row.calibratedConfidence - row.factors.feedbackAdjustment
    }
    return row.factors.base * 0.4 + row.factors.winRateDelta * 0.3 + row.factors.patchStability * 0.15
  })

  return ranked.map((row, i) => {
    const baselineScore = Math.min(1, Math.max(0, baselineScores[i] ?? 0))
    const currentScore = row.calibratedConfidence
    return {
      entityId: row.entity.canonicalId,
      currentScore,
      baselineScore,
      delta: currentScore - baselineScore,
    }
  })
}

export function compareAgainstBaseline(
  ranked: EntityRecommendationScore[],
  baselineRanked: EntityRecommendationScore[],
): { entityId: string; rankBefore: number; rankAfter: number; scoreDelta: number }[] {
  const before = new Map(baselineRanked.map((r, i) => [r.entity.canonicalId, { rank: i + 1, score: r.calibratedConfidence }]))
  const after = new Map(ranked.map((r, i) => [r.entity.canonicalId, { rank: i + 1, score: r.calibratedConfidence }]))

  const ids = new Set([...before.keys(), ...after.keys()])
  return [...ids].map((entityId) => {
    const b = before.get(entityId)
    const a = after.get(entityId)
    return {
      entityId,
      rankBefore: b?.rank ?? ranked.length + 1,
      rankAfter: a?.rank ?? baselineRanked.length + 1,
      scoreDelta: (a?.score ?? 0) - (b?.score ?? 0),
    }
  })
}

/**
 * Simulates picking alternative entities vs the top recommendation.
 */
export function simulateAlternativeChoices(
  ranked: EntityRecommendationScore[],
  selectedId: string,
  alternatives: string[],
): AlternativeSimulation[] {
  const selected = ranked.find((r) => r.entity.canonicalId === selectedId)
  const selectedScore = selected?.calibratedConfidence ?? 0

  return alternatives.map((choiceId) => {
    const row = ranked.find((r) => r.entity.canonicalId === choiceId)
    const projectedScore = row?.calibratedConfidence ?? 0
    return {
      choiceId,
      projectedScore,
      vsSelectedDelta: projectedScore - selectedScore,
    }
  })
}

export function compareRelationshipAgainstBaseline(
  ranked: RelationshipRecommendationScore[],
  baselineScores: Map<string, number>,
): { edgeKey: string; scoreDelta: number }[] {
  return ranked.map((row) => {
    const key = `${row.relationship.sourceId}→${row.relationship.relationship}→${row.relationship.targetId}`
    const baseline = baselineScores.get(key) ?? row.factors.base
    return {
      edgeKey: key,
      scoreDelta: row.calibratedConfidence - baseline,
    }
  })
}
