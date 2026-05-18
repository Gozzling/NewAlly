import type { RecommendationIntent } from '@/types/recommendationIntent'

export type RecommendationSurface = 'overlay' | 'guide' | 'coach' | 'team_builder'

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

export type TriagedAnomaly = {
  category: AnomalyTriageCategory
  canonicalId?: string
  summary: string
  confidence?: number
  surface?: RecommendationSurface
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

export type PerceivedIntelligenceReport = SessionInsightReport & {
  summary: string[]
  categories: ReportCategory[]
  interpretationHints: string[]
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

export type SignalStabilityProfile = {
  metricKey: string
  classification: 'stable' | 'volatile'
  coefficientOfVariation: number
}
