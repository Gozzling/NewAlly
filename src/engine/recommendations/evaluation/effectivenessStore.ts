import type {
  EffectivenessSnapshot,
  PerceivedIntelligenceSnapshot,
  RecommendationEvaluationEvent,
  RecommendationEvaluationEventType,
  RecommendationSurface,
} from './types'
import type { RecommendationIntent } from '@/types/recommendationIntent'
import {
  FOLLOW_THROUGH_WINDOW_MS,
  impressionKey,
} from './eventQuery'

const MAX_EVENTS = 500
const events: RecommendationEvaluationEvent[] = []

let sessionId = `sess-${Date.now().toString(36)}`

type ShownImpression = {
  canonicalId: string
  intent?: RecommendationIntent
  surface?: RecommendationSurface
  at: number
  confidence?: number
  sessionId?: string
  expanded: boolean
  used: boolean
  ignored: boolean
  followUpRecorded: boolean
}

const shownImpressions = new Map<string, ShownImpression>()
let lastShownIntent: RecommendationIntent | undefined

function pushEvent(event: RecommendationEvaluationEvent): void {
  events.push(event)
  if (events.length > MAX_EVENTS) events.shift()
}

function recordIntentFollowUp(payload: {
  timestampMs: number
  canonicalId?: string
  intent?: RecommendationIntent
  surface?: RecommendationSurface
  sessionId?: string
  delayed: boolean
  delayMs?: number
  source?: string
  aligned: boolean
}): void {
  pushEvent({
    type: 'intent_follow_up',
    timestampMs: payload.timestampMs,
    canonicalId: payload.canonicalId,
    intent: payload.intent,
    surface: payload.surface,
    sessionId: payload.sessionId,
    meta: {
      aligned: payload.aligned,
      delayed: payload.delayed,
      ...(payload.delayMs != null ? { delayMs: payload.delayMs } : {}),
      ...(payload.source ? { source: payload.source } : {}),
    },
  })
}

function tryDelayedFollowThrough(
  full: RecommendationEvaluationEvent,
  match: (impression: ShownImpression, key: string) => boolean,
): void {
  const now = full.timestampMs
  for (const [key, impression] of shownImpressions) {
    if (impression.followUpRecorded) continue
    if (impression.sessionId && full.sessionId && impression.sessionId !== full.sessionId) continue

    const delayMs = now - impression.at
    if (delayMs <= 0 || delayMs > FOLLOW_THROUGH_WINDOW_MS) continue
    if (!match(impression, key)) continue

    impression.followUpRecorded = true
    recordIntentFollowUp({
      timestampMs: now,
      canonicalId: impression.canonicalId,
      intent: impression.intent,
      surface: impression.surface ?? full.surface,
      sessionId: full.sessionId,
      delayed: true,
      delayMs,
      source: full.type,
      aligned:
        full.type === 'guide_intent_changed'
          ? Boolean(full.intent && impression.intent && full.intent === impression.intent)
          : full.type === 'guide_augment_opened' || full.type === 'recommendation_used',
    })
  }
}

export function getRecommendationEvaluationSessionId(): string {
  return sessionId
}

export function recordRecommendationEvaluation(
  event: Omit<RecommendationEvaluationEvent, 'timestampMs' | 'sessionId'> & { timestampMs?: number },
): void {
  const full: RecommendationEvaluationEvent = {
    ...event,
    timestampMs: event.timestampMs ?? Date.now(),
    sessionId: event.sessionId ?? sessionId,
  }
  pushEvent(full)

  if (full.type === 'recommendation_shown' && full.canonicalId) {
    const key = impressionKey(full.canonicalId, full.sessionId)
    const confidence =
      typeof full.meta?.confidence === 'number' ? full.meta.confidence : undefined
    shownImpressions.set(key, {
      canonicalId: full.canonicalId,
      intent: full.intent,
      surface: full.surface,
      at: full.timestampMs,
      confidence,
      sessionId: full.sessionId,
      expanded: false,
      used: false,
      ignored: false,
      followUpRecorded: false,
    })
    if (full.intent) lastShownIntent = full.intent
  }

  if (full.type === 'explanation_expanded' && full.canonicalId) {
    const imp = shownImpressions.get(impressionKey(full.canonicalId, full.sessionId))
    if (imp) imp.expanded = true
  }

  if (full.type === 'recommendation_used' && full.canonicalId) {
    const key = impressionKey(full.canonicalId, full.sessionId)
    const imp = shownImpressions.get(key)
    if (imp) imp.used = true

    const prior = imp
    if (prior && !prior.followUpRecorded) {
      const delayMs = full.timestampMs - prior.at
      const immediate = delayMs <= 5_000
      prior.followUpRecorded = true
      recordIntentFollowUp({
        timestampMs: full.timestampMs,
        canonicalId: full.canonicalId,
        intent: full.intent,
        surface: full.surface,
        sessionId: full.sessionId,
        delayed: !immediate,
        delayMs,
        source: 'recommendation_used',
        aligned: Boolean(prior.intent && full.intent && prior.intent === full.intent),
      })
    }
  }

  if (full.type === 'recommendation_ignored' && full.canonicalId) {
    const imp = shownImpressions.get(impressionKey(full.canonicalId, full.sessionId))
    if (imp) imp.ignored = true
  }

  if (full.type === 'guide_intent_changed' && full.intent) {
    if (lastShownIntent && lastShownIntent === full.intent) {
      recordIntentFollowUp({
        timestampMs: full.timestampMs,
        intent: full.intent,
        surface: 'guide',
        sessionId: full.sessionId,
        delayed: false,
        source: 'intent_picker',
        aligned: true,
      })
    }
    tryDelayedFollowThrough(full, (imp) => imp.intent === full.intent)
  }

  if (full.type === 'guide_augment_opened' && full.canonicalId) {
    tryDelayedFollowThrough(
      full,
      (imp) => imp.canonicalId.toLowerCase() === full.canonicalId!.toLowerCase(),
    )
  }
}

export function trackRecommendationShown(payload: {
  canonicalId: string
  intent?: RecommendationIntent
  surface?: RecommendationSurface
  confidence?: number
}): void {
  recordRecommendationEvaluation({
    type: 'recommendation_shown',
    ...payload,
    meta: payload.confidence != null ? { confidence: payload.confidence } : undefined,
  })
}

export function trackRecommendationUsed(payload: {
  canonicalId: string
  intent?: RecommendationIntent
  surface?: RecommendationSurface
}): void {
  recordRecommendationEvaluation({ type: 'recommendation_used', ...payload })
}

export function trackRecommendationIgnored(payload: {
  canonicalId: string
  intent?: RecommendationIntent
  surface?: RecommendationSurface
}): void {
  recordRecommendationEvaluation({ type: 'recommendation_ignored', ...payload })
}

export function trackExplanationExpanded(payload: {
  canonicalId?: string
  intent?: RecommendationIntent
  surface?: RecommendationSurface
}): void {
  recordRecommendationEvaluation({ type: 'explanation_expanded', ...payload })
}

export function trackExplanationCollapsed(payload: {
  canonicalId?: string
  surface?: RecommendationSurface
}): void {
  recordRecommendationEvaluation({ type: 'explanation_collapsed', ...payload })
}

export function listShownImpressions(): ShownImpression[] {
  return [...shownImpressions.values()]
}

function countType(
  type: RecommendationEvaluationEventType,
  options?: { surface?: RecommendationSurface; sessionId?: string },
): number {
  return events.filter((e) => {
    if (e.type !== type) return false
    if (options?.surface && e.surface !== options.surface) return false
    if (options?.sessionId && e.sessionId !== options.sessionId) return false
    return true
  }).length
}

export function computeIntentAccuracyProxy(sessionFilter?: string): number {
  const shown = countType('recommendation_shown', { sessionId: sessionFilter })
  if (shown === 0) return 0
  const aligned = events.filter(
    (e) =>
      e.type === 'intent_follow_up' &&
      e.meta?.aligned === true &&
      (!sessionFilter || e.sessionId === sessionFilter),
  ).length
  const used = countType('recommendation_used', { sessionId: sessionFilter })
  return Math.min(1, (used * 0.6 + aligned * 0.4) / shown)
}

export function getEffectivenessSnapshot(sessionFilter?: string): EffectivenessSnapshot {
  const expanded = countType('explanation_expanded', { sessionId: sessionFilter })
  const collapsed = countType('explanation_collapsed', { sessionId: sessionFilter })
  return {
    shown: countType('recommendation_shown', { sessionId: sessionFilter }),
    used: countType('recommendation_used', { sessionId: sessionFilter }),
    ignored: countType('recommendation_ignored', { sessionId: sessionFilter }),
    explanationExpanded: expanded,
    explanationIgnored: Math.max(0, expanded - collapsed),
    intentAccuracyProxy: computeIntentAccuracyProxy(sessionFilter),
  }
}

export function getPerceivedIntelligenceSnapshot(
  sessionSimilarity = 0,
  sessionFilter?: string,
): PerceivedIntelligenceSnapshot {
  const filter = { sessionId: sessionFilter }
  const shown = countType('recommendation_shown', filter)
  const overlayShown = events.filter(
    (e) =>
      e.type === 'recommendation_shown' &&
      e.surface === 'overlay' &&
      (!sessionFilter || e.sessionId === sessionFilter),
  ).length
  const overlayUsed = events.filter(
    (e) =>
      e.type === 'recommendation_used' &&
      e.surface === 'overlay' &&
      (!sessionFilter || e.sessionId === sessionFilter),
  ).length
  const expanded = countType('explanation_expanded', filter)
  const guideOpens = countType('guide_augment_opened', filter)
  const guideIntentChanges = countType('guide_intent_changed', filter)

  return {
    explanationOpenedRate: shown > 0 ? expanded / shown : 0,
    overlayAcceptRate: overlayShown > 0 ? overlayUsed / overlayShown : 0,
    guideInteractionDepth: guideOpens + guideIntentChanges * 0.5,
    sessionExplanationSimilarity: sessionSimilarity,
  }
}

export function countDelayedFollowThrough(sessionFilter?: string): number {
  return events.filter(
    (e) =>
      e.type === 'intent_follow_up' &&
      e.meta?.delayed === true &&
      (!sessionFilter || e.sessionId === sessionFilter),
  ).length
}

export function listRecommendationEvaluationEvents(): RecommendationEvaluationEvent[] {
  return [...events]
}

/** @internal Test-only */
export function resetRecommendationEvaluation(): void {
  events.length = 0
  shownImpressions.clear()
  lastShownIntent = undefined
  sessionId = `sess-${Date.now().toString(36)}`
}
