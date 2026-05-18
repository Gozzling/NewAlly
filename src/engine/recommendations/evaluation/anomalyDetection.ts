import type { AnomalyFlags, RecommendationEvaluationEvent } from './types'
import {
  confidenceFromEvent,
  filterEvents,
  HIGH_CONFIDENCE_THRESHOLD,
  LOW_CONFIDENCE_THRESHOLD,
} from './eventQuery'

/**
 * Non-invasive anomaly flags for tuning review (observational only).
 */
export function detectRecommendationAnomalies(
  events: RecommendationEvaluationEvent[],
  sessionId?: string,
): AnomalyFlags {
  const scoped = filterEvents(events, { sessionId })
  const shown = scoped.filter((e) => e.type === 'recommendation_shown' && e.canonicalId)

  const usedIds = new Set(
    scoped.filter((e) => e.type === 'recommendation_used').map((e) => e.canonicalId?.toLowerCase()),
  )
  const ignoredEvents = scoped.filter((e) => e.type === 'recommendation_ignored')

  const highConfidenceIgnored: RecommendationEvaluationEvent[] = []
  const lowConfidenceAccepted: RecommendationEvaluationEvent[] = []

  for (const s of shown) {
    const conf = confidenceFromEvent(s)
    const id = s.canonicalId!.toLowerCase()
    if (conf == null) continue

    if (conf >= HIGH_CONFIDENCE_THRESHOLD && !usedIds.has(id)) {
      const ignored = ignoredEvents.find((e) => e.canonicalId?.toLowerCase() === id)
      highConfidenceIgnored.push(ignored ?? s)
    }

    if (conf <= LOW_CONFIDENCE_THRESHOLD && usedIds.has(id)) {
      const used = scoped.find(
        (e) => e.type === 'recommendation_used' && e.canonicalId?.toLowerCase() === id,
      )
      if (used) lowConfidenceAccepted.push(used)
    }
  }

  return {
    highConfidenceIgnored: highConfidenceIgnored.slice(0, 20),
    lowConfidenceAccepted: lowConfidenceAccepted.slice(0, 20),
  }
}

export function detectOverconfidentRecommendations(
  events: RecommendationEvaluationEvent[],
  sessionId?: string,
): string[] {
  const { highConfidenceIgnored } = detectRecommendationAnomalies(events, sessionId)
  return [
    ...new Set(
      highConfidenceIgnored
        .map((e) => e.canonicalId)
        .filter((id): id is string => Boolean(id)),
    ),
  ]
}
