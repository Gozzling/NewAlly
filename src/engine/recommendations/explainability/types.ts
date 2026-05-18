import type { RecommendationIntent } from '@/types/recommendationIntent'
import type { RelationshipSignalType } from '@/types/relationshipSignal'
/** Mirrors RecommendationScoreFactors without importing scoring (avoids cycles). */
export type ExplanationScoreFactors = {
  base: number
  sampleSize: number
  patchStability: number
  winRateDelta: number
  derivedPenalty: number
  feedbackAdjustment: number
}

export type SignalSourceKind =
  | 'static_meta'
  | 'match_history'
  | 'relationship_graph'
  | 'user_feedback'
  | 'derived_inference'

export type ExplanationSignalSource = {
  kind: SignalSourceKind
  weight: number
  note: string
}

export type ConfidenceBreakdown = {
  rawScore: number
  calibratedConfidence: number
  factors: ExplanationScoreFactors
  stability?: {
    patchDecay: number
    sampleScale: number
    dataGuardReasons: string[]
  }
}

export type HistoricalStatsSummary = {
  winRate?: number
  pickRate?: number
  avgPlacement?: number
  sampleSize?: number
  baselineWinRate?: number
}

export type IntentAlignmentSummary = {
  intent?: RecommendationIntent
  affinityScore: number
  matchedHints?: string[]
  preferredSignalTypes?: RelationshipSignalType[]
}

export type RecommendationExplanation = {
  entityId?: string
  edge?: { sourceId: string; targetId: string; relationship: string }
  signalSources: ExplanationSignalSource[]
  confidence: ConfidenceBreakdown
  historicalStats: HistoricalStatsSummary
  intentAlignment: IntentAlignmentSummary
  summaryLines: string[]
}

export type RecommendationRationale = {
  intent: RecommendationIntent
  patch?: string
  set?: number
  topReasons: string[]
  entitySummaries: RecommendationExplanation[]
  relationshipSummaries: RecommendationExplanation[]
  generatedAtMs: number
}
