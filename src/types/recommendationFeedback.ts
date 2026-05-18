export const RECOMMENDATION_FEEDBACK_EVENTS = [
  'RECOMMENDATION_ACCEPTED',
  'RECOMMENDATION_REJECTED',
  'AUGMENT_HELPFUL',
  'AUGMENT_NOT_HELPFUL',
] as const

export type RecommendationFeedbackEventType = (typeof RECOMMENDATION_FEEDBACK_EVENTS)[number]

/** Explicit = user tapped accept/reject; implicit = dwell, pick, dismiss proxies */
export type FeedbackChannel = 'explicit' | 'implicit'

export type RecommendationFeedbackEvent = {
  type: RecommendationFeedbackEventType
  timestampMs: number
  /** Entity or recommendation target */
  canonicalId: string
  recommendationId?: string
  relationshipKey?: string
  patch?: string
  set?: number
  context?: string
  channel?: FeedbackChannel
}

export const FEEDBACK_DECAY_HALF_LIFE_MS = 14 * 24 * 60 * 60 * 1000
