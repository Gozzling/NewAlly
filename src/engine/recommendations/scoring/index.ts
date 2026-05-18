/** @internal Use intentQueryEngine for product-facing queries; scoring is engine-internal. */
export { applyConfidenceCalibration } from './applyConfidenceCalibration'
export type { CalibrationInput } from './applyConfidenceCalibration'
export { scoreEntityRecommendation } from './scoreEntityRecommendation'
export { scoreRelationshipRecommendation } from './scoreRelationshipRecommendation'
export type {
  EntityRecommendationScore,
  RelationshipRecommendationScore,
  RecommendationScoreFactors,
  ScoreContext,
} from './types'
