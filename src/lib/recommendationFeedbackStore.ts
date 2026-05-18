import { smoothFeedbackDelta } from '@/engine/recommendations/stability'
import type {
  FeedbackChannel,
  RecommendationFeedbackEvent,
  RecommendationFeedbackEventType,
} from '@/types/recommendationFeedback'
import { FEEDBACK_DECAY_HALF_LIFE_MS } from '@/types/recommendationFeedback'

const POSITIVE: RecommendationFeedbackEventType[] = [
  'RECOMMENDATION_ACCEPTED',
  'AUGMENT_HELPFUL',
]

const NEGATIVE: RecommendationFeedbackEventType[] = [
  'RECOMMENDATION_REJECTED',
  'AUGMENT_NOT_HELPFUL',
]

const EXPLICIT_WEIGHT = 1
const IMPLICIT_WEIGHT = 0.45

const events: RecommendationFeedbackEvent[] = []

function entityKey(canonicalId: string): string {
  return canonicalId.toLowerCase()
}

function relationshipKey(sourceId: string, targetId: string, relationship: string): string {
  return `${sourceId}→${relationship}→${targetId}`
}

function channelWeight(channel: FeedbackChannel | undefined): number {
  return channel === 'implicit' ? IMPLICIT_WEIGHT : EXPLICIT_WEIGHT
}

/** Exponential decay — older feedback contributes less (half-life ~14 days). */
export function feedbackRecencyWeight(timestampMs: number, nowMs = Date.now()): number {
  const ageMs = Math.max(0, nowMs - timestampMs)
  return Math.pow(0.5, ageMs / FEEDBACK_DECAY_HALF_LIFE_MS)
}

function deltaForType(type: RecommendationFeedbackEventType, weight: number): number {
  if (POSITIVE.includes(type)) return 0.04 * weight
  if (NEGATIVE.includes(type)) return -0.06 * weight
  return 0
}

function aggregateWeightedDelta(
  filtered: RecommendationFeedbackEvent[],
  nowMs: number,
): { delta: number; count: number } {
  let delta = 0
  let count = 0
  for (const e of filtered) {
    const w = channelWeight(e.channel) * feedbackRecencyWeight(e.timestampMs, nowMs)
    delta += deltaForType(e.type, w)
    count += 1
  }
  return { delta, count }
}

export function recordRecommendationFeedback(event: RecommendationFeedbackEvent): void {
  events.push({
    ...event,
    channel: event.channel ?? 'explicit',
  })
}

export function listRecommendationFeedback(): RecommendationFeedbackEvent[] {
  return [...events]
}

/** Net feedback adjustment in roughly ±0.15 range for a canonical entity. */
export function getEntityFeedbackAdjustment(canonicalId: string, nowMs = Date.now()): number {
  const key = entityKey(canonicalId)
  const relevant = events.filter((e) => entityKey(e.canonicalId) === key)
  const { delta, count } = aggregateWeightedDelta(relevant, nowMs)
  const smoothed = smoothFeedbackDelta(delta, count)
  return Math.max(-0.15, Math.min(0.15, smoothed))
}

/** Feedback-weighted confidence adjustment for a relationship edge. */
export function getRelationshipFeedbackAdjustment(
  sourceId: string,
  targetId: string,
  relationship: string,
  nowMs = Date.now(),
): number {
  const edgeKey = relationshipKey(sourceId, targetId, relationship)
  let delta = getEntityFeedbackAdjustment(sourceId, nowMs)

  const edgeEvents = events.filter((e) => {
    if (e.relationshipKey && e.relationshipKey === edgeKey) return true
    if (e.canonicalId && entityKey(e.canonicalId) === entityKey(sourceId) && e.relationshipKey) {
      return e.relationshipKey === edgeKey
    }
    return false
  })

  const edgeAgg = aggregateWeightedDelta(edgeEvents, nowMs)
  delta += edgeAgg.delta * 1.25
  const totalCount = edgeAgg.count + edgeEvents.length
  const smoothed = smoothFeedbackDelta(delta, Math.max(1, totalCount))
  return Math.max(-0.2, Math.min(0.2, smoothed))
}

/** Apply feedback history to a base relationship confidence. */
export function adjustRelationshipConfidence(
  sourceId: string,
  targetId: string,
  relationship: string,
  baseConfidence: number,
  nowMs = Date.now(),
): number {
  const adjusted =
    baseConfidence + getRelationshipFeedbackAdjustment(sourceId, targetId, relationship, nowMs)
  return Math.min(1, Math.max(0, adjusted))
}

/** Split feedback volume by channel for monitoring / evaluation. */
export function feedbackVolumeByChannel(nowMs = Date.now()): {
  explicit: number
  implicit: number
} {
  let explicit = 0
  let implicit = 0
  for (const e of events) {
    const w = feedbackRecencyWeight(e.timestampMs, nowMs)
    if ((e.channel ?? 'explicit') === 'implicit') implicit += w
    else explicit += w
  }
  return { explicit, implicit }
}

/** @internal Test-only */
export function resetRecommendationFeedbackStore(): void {
  events.length = 0
}
