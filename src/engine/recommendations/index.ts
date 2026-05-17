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
