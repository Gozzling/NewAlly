import type { EntityRecommendationScore, RelationshipRecommendationScore } from '@/engine/recommendations/scoring/types'
import type { RecommendationIntent } from '@/types/recommendationIntent'
import { summarizeFeedbackCounts } from '@/lib/recommendationEvaluation'
import { listRecommendationFeedback } from '@/lib/recommendationFeedbackStore'
import { confidenceDecayForPatch } from '@/engine/recommendations/stability'
import type {
  DriftMonitorState,
  FeedbackImbalanceSnapshot,
  IntentDistributionSnapshot,
  PatchDriftSnapshot,
  ScoreSnapshot,
} from './types'

const MAX_HISTORY = 120

const state: DriftMonitorState = {
  scoreHistory: [],
  intentDistribution: [],
  feedbackImbalance: [],
  patchDrift: [],
}

function pushBounded<T>(arr: T[], item: T): void {
  arr.push(item)
  if (arr.length > MAX_HISTORY) arr.shift()
}

function variance(values: number[]): number {
  if (values.length < 2) return 0
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  return values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / values.length
}

export function recordScoreSnapshot(
  intent: RecommendationIntent,
  scores: number[],
  patch?: string,
): ScoreSnapshot {
  const snapshot: ScoreSnapshot = {
    timestampMs: Date.now(),
    intent,
    patch,
    meanScore: scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
    variance: variance(scores),
    count: scores.length,
  }
  pushBounded(state.scoreHistory, snapshot)
  return snapshot
}

export function recordIntentQuery(
  intent: RecommendationIntent,
  entityScores: EntityRecommendationScore[],
  relationshipScores: RelationshipRecommendationScore[] = [],
  patch?: string,
): void {
  const allScores = [
    ...entityScores.map((e) => e.calibratedConfidence),
    ...relationshipScores.map((r) => r.calibratedConfidence),
  ]
  recordScoreSnapshot(intent, allScores, patch)

  const counts: IntentDistributionSnapshot['counts'] = { [intent]: entityScores.length }
  pushBounded(state.intentDistribution, { timestampMs: Date.now(), counts })

  const feedback = listRecommendationFeedback()
  const c = summarizeFeedbackCounts(feedback)
  const positive = c.accepted + c.helpful
  const negative = c.rejected + c.notHelpful
  const total = positive + negative
  const snapshot: FeedbackImbalanceSnapshot = {
    timestampMs: Date.now(),
    positive,
    negative,
    ratio: total > 0 ? positive / total : 0.5,
  }
  pushBounded(state.feedbackImbalance, snapshot)

  let decaySum = 0
  let mismatch = 0
  let n = 0
  for (const row of entityScores) {
    const p = row.entity.patch
    const decay = confidenceDecayForPatch(p, patch)
    decaySum += decay
    if (p && patch && p !== patch) mismatch += 1
    n += 1
  }
  const patchSnap: PatchDriftSnapshot = {
    timestampMs: Date.now(),
    patch,
    meanPatchDecay: n > 0 ? decaySum / n : 1,
    mismatchRate: n > 0 ? mismatch / n : 0,
  }
  pushBounded(state.patchDrift, patchSnap)
}

export function getDriftMonitorState(): Readonly<DriftMonitorState> {
  return state
}

export function detectScoreVarianceDrift(intent: RecommendationIntent, threshold = 0.08): boolean {
  const recent = state.scoreHistory.filter((s) => s.intent === intent).slice(-10)
  if (recent.length < 3) return false
  const avgVar = recent.reduce((a, s) => a + s.variance, 0) / recent.length
  return avgVar > threshold
}

export function detectFeedbackImbalance(threshold = 0.85): boolean {
  const last = state.feedbackImbalance[state.feedbackImbalance.length - 1]
  if (!last) return false
  return last.ratio >= threshold || last.ratio <= 1 - threshold
}

/** @internal Test-only */
export function resetDriftMonitor(): void {
  state.scoreHistory.length = 0
  state.intentDistribution.length = 0
  state.feedbackImbalance.length = 0
  state.patchDrift.length = 0
}
