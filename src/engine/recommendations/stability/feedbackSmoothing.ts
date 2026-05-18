/**
 * Dampens feedback-driven score swings to prevent feedback-loop instability.
 */

const MAX_SINGLE_EVENT_IMPACT = 0.03
const SMOOTHING_K = 4

export function smoothFeedbackDelta(rawDelta: number, eventCount: number): number {
  if (eventCount <= 0 || rawDelta === 0) return 0

  const capped = Math.max(-0.2, Math.min(0.2, rawDelta))
  const damped = capped * (SMOOTHING_K / (SMOOTHING_K + eventCount))
  const perEventCap = MAX_SINGLE_EVENT_IMPACT * Math.min(eventCount, 8)
  return Math.max(-perEventCap, Math.min(perEventCap, damped))
}

/** Exponential moving average blend for sequential feedback updates. */
export function emaFeedbackAdjustment(
  previous: number,
  incoming: number,
  alpha = 0.25,
): number {
  return previous * (1 - alpha) + incoming * alpha
}
