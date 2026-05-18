export type {
  SignalSourceKind,
  ExplanationSignalSource,
  ConfidenceBreakdown,
  HistoricalStatsSummary,
  IntentAlignmentSummary,
  RecommendationExplanation,
  RecommendationRationale,
} from './types'
export { explainEntityRecommendation } from './explainEntityRecommendation'
export { explainRelationshipRecommendation } from './explainRelationshipRecommendation'
export type { RelationshipEdgeRef } from './explainRelationshipRecommendation'
export { buildRecommendationRationale } from './buildRecommendationRationale'
export type { RationaleInput } from './buildRecommendationRationale'
