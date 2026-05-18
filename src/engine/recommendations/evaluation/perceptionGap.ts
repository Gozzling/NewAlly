import type { PerceptionGapMetrics, RecommendationEvaluationEvent } from './types'
import {
  confidenceFromEvent,
  filterEvents,
  HIGH_CONFIDENCE_THRESHOLD,
  LOW_CONFIDENCE_THRESHOLD,
} from './eventQuery'

function rate(numerator: number, denominator: number): number {
  return denominator > 0 ? numerator / denominator : 0
}

/**
 * Proxies for perceived vs actual recommendation quality (observational only).
 * - correct_but_ignored: high-confidence shown, never used
 * - incorrect_but_clicked: low-confidence shown, then used
 */
export function computePerceptionGap(
  events: RecommendationEvaluationEvent[],
  sessionId?: string,
): PerceptionGapMetrics {
  const scoped = filterEvents(events, { sessionId })
  const shown = scoped.filter((e) => e.type === 'recommendation_shown' && e.canonicalId)

  let highIgnored = 0
  let highShown = 0
  let lowClicked = 0
  let lowShown = 0

  const usedIds = new Set(
    scoped.filter((e) => e.type === 'recommendation_used').map((e) => e.canonicalId?.toLowerCase()),
  )
  const ignoredIds = new Set(
    scoped.filter((e) => e.type === 'recommendation_ignored').map((e) => e.canonicalId?.toLowerCase()),
  )
  const expandedIds = new Set(
    scoped.filter((e) => e.type === 'explanation_expanded').map((e) => e.canonicalId?.toLowerCase()),
  )

  for (const s of shown) {
    const id = s.canonicalId!.toLowerCase()
    const conf = confidenceFromEvent(s)
    if (conf == null) continue

    if (conf >= HIGH_CONFIDENCE_THRESHOLD) {
      highShown += 1
      if (!usedIds.has(id)) {
        highIgnored += 1
      }
    }
    if (conf <= LOW_CONFIDENCE_THRESHOLD) {
      lowShown += 1
      if (usedIds.has(id)) lowClicked += 1
    }
  }

  let expandedUsed = 0
  let expandedIgnored = 0
  let expandedTotal = 0
  let noExpandUsed = 0
  let noExpandShown = 0

  for (const s of shown) {
    const id = s.canonicalId!.toLowerCase()
    const expanded = expandedIds.has(id)
    const used = usedIds.has(id)
    const ignored = ignoredIds.has(id)

    if (expanded) {
      expandedTotal += 1
      if (used) expandedUsed += 1
      if (ignored) expandedIgnored += 1
    } else {
      noExpandShown += 1
      if (used) noExpandUsed += 1
    }
  }

  const acceptAfterExpand = rate(expandedUsed, expandedTotal)
  const acceptWithoutExpand = rate(noExpandUsed, noExpandShown)
  const explanationHelpfulnessDelta = acceptAfterExpand - acceptWithoutExpand

  return {
    correctButIgnoredRate: rate(highIgnored, highShown),
    incorrectButClickedRate: rate(lowClicked, lowShown),
    explanationHelpfulnessDelta,
    sampleSize: shown.length,
  }
}
