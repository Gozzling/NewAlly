export type {

  AllyRecommendation,

  CompPreferenceEntry,

  HistoryPerformanceEntry,

  NormalizedGameSignals,

  PlayerMatchHistorySummary,

  RecommendationEngineInput,

  RecommendationEvidence,

  RiskLevel,

  UrgencyLevel,

} from "@ally/shared-types";

export { clamp01, combineEvidenceWeighted } from "./confidence";

export {

  buildRecommendationInput,

  recommendationsFromGameState,

  runRecommendationEngine,

  sortRecommendations,

} from "./engine";

export {

  summarizePersonalMatches,

  buildPlayerHistorySummary,

  emptyPlayerMatchHistorySummary,

} from "./historySummary";

export { toNormalizedSignals } from "./signals";

export { shopRecommendations } from "./strategies/shop";

export { itemRecommendations } from "./strategies/items";

export { compRecommendations } from "./strategies/comp";

export { economyRecommendations } from "./strategies/economy";

export { buildGameStateFromBoard } from "./teamBuilderGameState";

export {

  getAugmentGraphHints,

  getAugmentRelationshipContext,

} from "./canonicalGraphContext";

export type {

  EntityRecommendationScore,

  RelationshipRecommendationScore,

  RecommendationScoreFactors,

  ScoreContext,

} from "./scoring";

export {

  queryByIntent,

  queryByIntentWithRationale,

  rankEntitiesForIntent,

  rankEntitiesForIntentWithExplanation,

  resolveBestTransitionPaths,

  queryAugmentRecommendations,

  queryAugmentRelationshipRecommendations,

} from "@/lib/intentQueryEngine";

export type {

  IntentQueryOptions,

  TransitionPath,

  EntityRecommendationWithExplanation,

  RelationshipRecommendationWithExplanation,

  IntentQueryWithRationale,

} from "@/lib/intentQueryEngine";

export {

  explainEntityRecommendation,

  explainRelationshipRecommendation,

  buildRecommendationRationale,

} from "./explainability";

export type {

  RecommendationExplanation,

  RecommendationRationale,

} from "./explainability";

export {

  applyStabilityControls,

  confidenceDecayForPatch,

  smoothFeedbackDelta,

} from "./stability";

export {

  recordIntentQuery,

  getDriftMonitorState,

  detectScoreVarianceDrift,

  detectFeedbackImbalance,

} from "./monitoring";

export {

  recordRecommendationFeedback,

  adjustRelationshipConfidence,

  feedbackRecencyWeight,

  feedbackVolumeByChannel,

} from "@/lib/recommendationFeedbackStore";

export {

  precisionAtK,

  engagementProxyScore,

  successRateByRecommendationType,

} from "@/lib/recommendationEvaluation";

export {

  estimateRecommendationImpact,

  compareAgainstBaseline,

  simulateAlternativeChoices,

} from "@/lib/recommendationCounterfactuals";
export {
  getEffectivenessSnapshot,
  getPerceivedIntelligenceSnapshot,
  getPerceivedIntelligenceReport,
  buildSessionInsightReport,
  compareSurfacePerformance,
  computePerceptionGap,
  computeExplanationUsefulness,
  detectRecommendationAnomalies,
  detectOverconfidentRecommendations,
  trackRecommendationShown,
  trackRecommendationUsed,
  trackRecommendationIgnored,
  trackExplanationExpanded,
  classifySessionSignals,
  triageAnomalies,
  prioritizeSessionFindings,
  aggregatePerceptionTrends,
  detectStableVsVolatileSignals,
} from "./evaluation";
export type {
  RecommendationSurface,
  EffectivenessSnapshot,
  PerceivedIntelligenceSnapshot,
  PerceivedIntelligenceReport,
  SessionInsightReport,
  PerceptionGapMetrics,
  ExplanationUsefulnessMetrics,
  AnomalyFlags,
  SurfacePerformanceRow,
  ClassifiedSignal,
  SignalKind,
  TriagedAnomaly,
  PrioritizedFinding,
  AggregatedPerceptionTrends,
} from "./evaluation";

