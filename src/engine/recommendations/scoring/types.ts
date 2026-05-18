import type { CanonicalEntity } from '@/types/canonicalEntity'
import type { CanonicalRelationship } from '@/types/canonicalRelationship'
import type { RecommendationIntent } from '@/types/recommendationIntent'

export type RecommendationScoreFactors = {
  base: number
  sampleSize: number
  patchStability: number
  winRateDelta: number
  derivedPenalty: number
  feedbackAdjustment: number
}

export type EntityRecommendationScore = {
  entity: CanonicalEntity
  score: number
  calibratedConfidence: number
  factors: RecommendationScoreFactors
  intent?: RecommendationIntent
}

export type RelationshipRecommendationScore = {
  relationship: CanonicalRelationship
  score: number
  calibratedConfidence: number
  factors: RecommendationScoreFactors
  intent?: RecommendationIntent
}

export type ScoreContext = {
  intent?: RecommendationIntent
  patch?: string
  set?: number
  /** Baseline win rate for delta (default 50) */
  baselineWinRate?: number
  /** Current patch for stability comparison */
  currentPatch?: string
  /** Optional source entity win rate for relationship scoring */
  sourceWinRate?: number
  /** Minimum calibrated confidence to include in ranked results */
  minConfidence?: number
}
