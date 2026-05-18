import type { RecommendationIntent } from '@/types/recommendationIntent'

export type RecommendationSurface = 'overlay' | 'guide' | 'coach' | 'team_builder'

/** Surface on triaged anomalies — maps telemetry `guide` → `augment_guide`. */
export type TriagedAnomalySurface =
  | 'overlay'
  | 'augment_guide'
  | 'coach'
  | 'team_builder'
  | 'unknown'

export type RecommendationEvaluationEventType =
  | 'recommendation_shown'
  | 'recommendation_used'
  | 'recommendation_ignored'
  | 'explanation_expanded'
  | 'explanation_collapsed'
  | 'guide_augment_opened'
  | 'guide_intent_changed'
  | 'intent_follow_up'

export type RecommendationEvaluationEvent = {
  type: RecommendationEvaluationEventType
  timestampMs: number
  canonicalId?: string
  intent?: RecommendationIntent
  surface?: RecommendationSurface
  sessionId?: string
  meta?: Record<string, string | number | boolean>
}

export type EffectivenessSnapshot = {
  shown: number
  used: number
  ignored: number
  explanationExpanded: number
  explanationIgnored: number
  intentAccuracyProxy: number
}

export type PerceivedIntelligenceSnapshot = {
  explanationOpenedRate: number
  overlayAcceptRate: number
  guideInteractionDepth: number
  sessionExplanationSimilarity: number
}

export type PerceptionGapMetrics = {
  correctButIgnoredRate: number
  incorrectButClickedRate: number
  explanationHelpfulnessDelta: number
  sampleSize: number
}

export type ExplanationUsefulnessMetrics = {
  explanationInfluenceScore: number
  explanationFatigueIndex: number
  expandedThenAcceptedRate: number
  expandedThenIgnoredRate: number
}

export type AnomalyFlags = {
  highConfidenceIgnored: RecommendationEvaluationEvent[]
  lowConfidenceAccepted: RecommendationEvaluationEvent[]
}

export type SignalKind = 'noise' | 'behavioral' | 'structural_ux' | 'intent_misclassification'

export type ClassifiedSignal = {
  kind: SignalKind
  metricKey: string
  label: string
  value: number
  strength: number
}

export type AnomalyTriageCategory =
  | 'ux_issue'
  | 'ranking_mismatch'
  | 'explanation_issue'
  | 'intent_misalignment'
  | 'noise'

/** Product-facing label for triage category (interpretability). */
export type TriageInterpretabilityLabel =
  | 'user experience friction'
  | 'recommendation quality gap'
  | 'communication clarity problem'
  | 'context inference error'
  | 'insufficient signal'

export type TriagedAnomaly = {
  category: AnomalyTriageCategory
  canonicalId?: string
  summary: string
  /** Human-readable failure mode for product decisions */
  interpretabilityLabel: TriageInterpretabilityLabel
  confidence?: number
  /** Derived from telemetry event surface; `unknown` when absent on source events */
  surface: TriagedAnomalySurface
}

export type PrioritizedFinding = {
  id: string
  title: string
  impactScore: number
  signalKinds: SignalKind[]
  relatedSurfaces: RecommendationSurface[]
  interpretationHint: string
}

export type SurfacePerformanceRow = {
  surface: RecommendationSurface
  shown: number
  used: number
  ignored: number
  acceptRate: number
  explanationOpenRate: number
  intentFollowThroughRate: number
  /** Volume-weighted accept (Wilson-style shrink toward session mean) */
  volumeAdjustedAcceptRate: number
  /** Deviation from session-weighted mean accept */
  acceptRateDeltaFromMean: number
  statisticallyMeaningful: boolean
  intentBiasNote?: string
}

export type SurfaceComparisonInsight = {
  strongestSurface?: RecommendationSurface
  meaningfulDifferences: string[]
}

export type ReportCategory = {
  id: string
  title: string
  hints: string[]
}

export type ReportSectionId = 'system_behavior' | 'user_perception' | 'actionable_insights'

export type ReportSection = {
  id: ReportSectionId
  title: string
  items: string[]
}

export type CondensedInsightGroup = {
  category: AnomalyTriageCategory | 'finding'
  interpretabilityLabel: string
  items: string[]
  count: number
}

export type SessionInsightReport = {
  sessionId: string
  generatedAtMs: number
  effectiveness: EffectivenessSnapshot
  perceived: PerceivedIntelligenceSnapshot
  perceptionGap: PerceptionGapMetrics
  explanationUsefulness: ExplanationUsefulnessMetrics
  surfaceComparison: SurfacePerformanceRow[]
  surfaceInsights: SurfaceComparisonInsight
  anomalies: AnomalyFlags
  triagedAnomalies: TriagedAnomaly[]
  classifiedSignals: ClassifiedSignal[]
  prioritizedFindings: PrioritizedFinding[]
  overconfidentRecommendationIds: string[]
  delayedFollowThroughCount: number
}

export type PerceivedIntelligenceReportOptions = {
  /** Surfaces only top actionable findings; hides low-signal categories */
  decisionSupportMode?: boolean
  /** When false (default), raw metric keys are omitted from section items */
  includeRawMetrics?: boolean
}

export type PerceivedIntelligenceReport = SessionInsightReport & {
  summary: string[]
  categories: ReportCategory[]
  interpretationHints: string[]
  /** Curated narrative sections for product review */
  sections: ReportSection[]
  condensedInsights: CondensedInsightGroup[]
  crossSessionEvolution: CrossSessionInsightEvolution
  signalStability: SignalStabilityProfile[]
}

export type CrossSessionInsightEvolution = {
  sessionCount: number
  recurringAnomalies: string[]
  emergingIssues: string[]
  fadingIssues: string[]
  longTermDriftIndicators: string[]
}

export type PerceptionTrendPoint = {
  metricKey: string
  values: number[]
  mean: number
  trend: 'rising' | 'falling' | 'flat'
  volatility: number
}

export type AggregatedPerceptionTrends = {
  sessionCount: number
  trends: PerceptionTrendPoint[]
}

export type SignalStabilityClassification = 'stable' | 'semi_stable' | 'volatile'

export type SignalStabilityProfile = {
  metricKey: string
  classification: SignalStabilityClassification
  coefficientOfVariation: number
  /** Confidence in stability classification (0–1), rises with more sessions */
  stabilityConfidence: number
  /** True when recent sessions trend toward the historical mean */
  trendConverging: boolean
}
