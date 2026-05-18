import type { RecommendationIntent } from '@/types/recommendationIntent'

export type ScoreSnapshot = {
  timestampMs: number
  intent: RecommendationIntent
  patch?: string
  meanScore: number
  variance: number
  count: number
}

export type IntentDistributionSnapshot = {
  timestampMs: number
  counts: Partial<Record<RecommendationIntent, number>>
}

export type FeedbackImbalanceSnapshot = {
  timestampMs: number
  positive: number
  negative: number
  ratio: number
}

export type PatchDriftSnapshot = {
  timestampMs: number
  patch?: string
  meanPatchDecay: number
  mismatchRate: number
}

export type DriftMonitorState = {
  scoreHistory: ScoreSnapshot[]
  intentDistribution: IntentDistributionSnapshot[]
  feedbackImbalance: FeedbackImbalanceSnapshot[]
  patchDrift: PatchDriftSnapshot[]
}
