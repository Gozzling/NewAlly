import type { RecommendationEvaluationEvent, RecommendationSurface } from './types'

export const HIGH_CONFIDENCE_THRESHOLD = 0.65
export const LOW_CONFIDENCE_THRESHOLD = 0.45
export const FOLLOW_THROUGH_WINDOW_MS = 180_000

export function filterEvents(
  events: RecommendationEvaluationEvent[],
  options?: { sessionId?: string; surface?: RecommendationSurface; sinceMs?: number },
): RecommendationEvaluationEvent[] {
  return events.filter((e) => {
    if (options?.sessionId && e.sessionId !== options.sessionId) return false
    if (options?.surface && e.surface !== options.surface) return false
    if (options?.sinceMs != null && e.timestampMs < options.sinceMs) return false
    return true
  })
}

export function confidenceFromEvent(event: RecommendationEvaluationEvent): number | undefined {
  const c = event.meta?.confidence
  return typeof c === 'number' ? c : undefined
}

export function isDelayedFollowUp(event: RecommendationEvaluationEvent): boolean {
  return event.type === 'intent_follow_up' && event.meta?.delayed === true
}

export function impressionKey(canonicalId: string, sessionId?: string): string {
  return `${sessionId ?? 'default'}::${canonicalId.toLowerCase()}`
}
