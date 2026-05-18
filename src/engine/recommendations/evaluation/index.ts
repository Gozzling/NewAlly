/**
 * Observational recommendation evaluation — does NOT affect scoring or canonical queries.
 */
export type {
  RecommendationSurface,
  RecommendationEvaluationEventType,
  RecommendationEvaluationEvent,
  EffectivenessSnapshot,
  PerceivedIntelligenceSnapshot,
  PerceptionGapMetrics,
  ExplanationUsefulnessMetrics,
  AnomalyFlags,
  SignalKind,
  ClassifiedSignal,
  AnomalyTriageCategory,
  TriagedAnomaly,
  PrioritizedFinding,
  SurfacePerformanceRow,
  SurfaceComparisonInsight,
  ReportCategory,
  SessionInsightReport,
  PerceivedIntelligenceReport,
  PerceptionTrendPoint,
  AggregatedPerceptionTrends,
  SignalStabilityProfile,
} from './types'
export {
  HIGH_CONFIDENCE_THRESHOLD,
  LOW_CONFIDENCE_THRESHOLD,
  FOLLOW_THROUGH_WINDOW_MS,
} from './eventQuery'
export {
  getRecommendationEvaluationSessionId,
  recordRecommendationEvaluation,
  trackRecommendationShown,
  trackRecommendationUsed,
  trackRecommendationIgnored,
  trackExplanationExpanded,
  trackExplanationCollapsed,
  computeIntentAccuracyProxy,
  getEffectivenessSnapshot,
  getPerceivedIntelligenceSnapshot,
  countDelayedFollowThrough,
  listRecommendationEvaluationEvents,
  listShownImpressions,
  resetRecommendationEvaluation,
} from './effectivenessStore'
export { computePerceptionGap } from './perceptionGap'
export { computeExplanationUsefulness } from './explanationUsefulness'
export {
  detectRecommendationAnomalies,
  detectOverconfidentRecommendations,
} from './anomalyDetection'
export {
  buildSessionInsightReport,
  compareSurfacePerformance,
} from './insights'
export { getPerceivedIntelligenceReport } from './perceivedIntelligenceReport'
export {
  classifySessionSignals,
  signalsByKind,
  dominantSignalKind,
} from './signalClassification'
export { triageAnomalies, groupTriagedFindings } from './anomalyTriage'
export { prioritizeSessionFindings, filterLowSignalMetrics } from './insightPrioritization'
export {
  aggregatePerceptionTrends,
  detectStableVsVolatileSignals,
  recordSessionSnapshot,
  listSessionSnapshots,
  resetSessionAggregation,
} from './sessionAggregation'
