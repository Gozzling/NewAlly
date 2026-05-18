import type { ExplanationUsefulnessMetrics, RecommendationEvaluationEvent } from './types'
import { filterEvents } from './eventQuery'

function rate(n: number, d: number): number {
  return d > 0 ? n / d : 0
}

/**
 * Measures whether explanations correlate with acceptance and whether engagement drops over time.
 */
export function computeExplanationUsefulness(
  events: RecommendationEvaluationEvent[],
  sessionId?: string,
): ExplanationUsefulnessMetrics {
  const scoped = filterEvents(events, { sessionId })
  const shown = scoped.filter((e) => e.type === 'recommendation_shown' && e.canonicalId)

  const usedSet = new Set(
    scoped.filter((e) => e.type === 'recommendation_used').map((e) => e.canonicalId?.toLowerCase()),
  )
  const ignoredSet = new Set(
    scoped.filter((e) => e.type === 'recommendation_ignored').map((e) => e.canonicalId?.toLowerCase()),
  )
  const expandedSet = new Set(
    scoped.filter((e) => e.type === 'explanation_expanded').map((e) => e.canonicalId?.toLowerCase()),
  )

  let expandedAccepted = 0
  let expandedIgnored = 0
  let expandedCount = 0
  let notExpandedAccepted = 0
  let notExpandedCount = 0

  for (const s of shown) {
    const id = s.canonicalId!.toLowerCase()
    const expanded = expandedSet.has(id)
    if (expanded) {
      expandedCount += 1
      if (usedSet.has(id)) expandedAccepted += 1
      if (ignoredSet.has(id)) expandedIgnored += 1
    } else {
      notExpandedCount += 1
      if (usedSet.has(id)) notExpandedAccepted += 1
    }
  }

  const expandedThenAcceptedRate = rate(expandedAccepted, expandedCount)
  const expandedThenIgnoredRate = rate(expandedIgnored, expandedCount)
  const baselineAccept = rate(notExpandedAccepted, notExpandedCount)

  const explanationInfluenceScore = Math.max(
    0,
    Math.min(1, expandedThenAcceptedRate - baselineAccept + 0.5),
  )

  const expansions = scoped
    .filter((e) => e.type === 'explanation_expanded')
    .sort((a, b) => a.timestampMs - b.timestampMs)

  let fatigueIndex = 0
  if (expansions.length >= 4) {
    const mid = Math.floor(expansions.length / 2)
    const firstHalf = expansions.slice(0, mid).length
    const secondHalf = expansions.slice(mid).length
    const shownFirst = shown.filter((s) => s.timestampMs <= expansions[mid]!.timestampMs).length
    const shownSecond = shown.length - shownFirst
    const rateFirst = rate(firstHalf, Math.max(1, shownFirst))
    const rateSecond = rate(secondHalf, Math.max(1, shownSecond))
    fatigueIndex = Math.max(0, rateFirst - rateSecond)
  }

  return {
    explanationInfluenceScore,
    explanationFatigueIndex: fatigueIndex,
    expandedThenAcceptedRate,
    expandedThenIgnoredRate,
  }
}
