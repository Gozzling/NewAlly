import type {
  AnomalyFlags,
  AnomalyTriageCategory,
  PerceptionGapMetrics,
  RecommendationEvaluationEvent,
  RecommendationSurface,
  TriageInterpretabilityLabel,
  TriagedAnomaly,
  TriagedAnomalySurface,
} from './types'
import { confidenceFromEvent } from './eventQuery'

const INTERPRETABILITY_BY_CATEGORY: Record<AnomalyTriageCategory, TriageInterpretabilityLabel> = {
  ux_issue: 'user experience friction',
  ranking_mismatch: 'recommendation quality gap',
  explanation_issue: 'communication clarity problem',
  intent_misalignment: 'context inference error',
  noise: 'insufficient signal',
}

/** Display order for grouped report sections (overlay first — least error tolerance). */
export const TRIAGED_SURFACE_DISPLAY_ORDER: TriagedAnomalySurface[] = [
  'overlay',
  'augment_guide',
  'coach',
  'team_builder',
  'unknown',
]

export function interpretabilityLabelForCategory(
  category: AnomalyTriageCategory,
): TriageInterpretabilityLabel {
  return INTERPRETABILITY_BY_CATEGORY[category]
}

/** Maps telemetry surface to triage surface union (no new source of truth). */
export function surfaceFromTelemetry(
  surface?: RecommendationSurface,
): TriagedAnomalySurface {
  if (!surface) return 'unknown'
  if (surface === 'guide') return 'augment_guide'
  return surface
}

export function displayLabelForTriagedSurface(surface: TriagedAnomalySurface): string {
  switch (surface) {
    case 'overlay':
      return 'Overlay'
    case 'augment_guide':
      return 'Augment Guide'
    case 'coach':
      return 'Coach'
    case 'team_builder':
      return 'Team Builder'
    case 'unknown':
      return 'Unknown'
  }
}

export function dominantSurfaceFromEvents(
  events: RecommendationEvaluationEvent[],
): TriagedAnomalySurface {
  const counts = new Map<TriagedAnomalySurface, number>()
  for (const event of events) {
    const surface = surfaceFromTelemetry(event.surface)
    if (surface === 'unknown') continue
    counts.set(surface, (counts.get(surface) ?? 0) + 1)
  }
  if (counts.size === 0) return 'unknown'

  let best: TriagedAnomalySurface = 'unknown'
  let max = 0
  for (const [surface, count] of counts) {
    if (count > max) {
      max = count
      best = surface
    }
  }
  return best
}

function withLabel(
  partial: Omit<TriagedAnomaly, 'interpretabilityLabel'>,
): TriagedAnomaly {
  return {
    ...partial,
    interpretabilityLabel: interpretabilityLabelForCategory(partial.category),
  }
}

function triageHighConfidenceIgnored(
  event: RecommendationEvaluationEvent,
  gap: PerceptionGapMetrics,
): TriagedAnomaly {
  const conf = confidenceFromEvent(event)
  const surface = surfaceFromTelemetry(event.surface)
  if (gap.explanationHelpfulnessDelta < -0.1) {
    return withLabel({
      category: 'explanation_issue',
      canonicalId: event.canonicalId,
      confidence: conf,
      surface,
      summary:
        'Strong score ignored after explanation engagement — communication clarity problem may block action',
    })
  }
  if (gap.correctButIgnoredRate > 0.2) {
    return withLabel({
      category: 'ranking_mismatch',
      canonicalId: event.canonicalId,
      confidence: conf,
      surface,
      summary:
        'High-confidence recommendation ignored — recommendation quality gap between score and user choice',
    })
  }
  return withLabel({
    category: 'ux_issue',
    canonicalId: event.canonicalId,
    confidence: conf,
    surface,
    summary:
      'High-confidence pick not acted on — user experience friction (timing, layout, or copy) may block action',
  })
}

function triageLowConfidenceAccepted(event: RecommendationEvaluationEvent): TriagedAnomaly {
  const conf = confidenceFromEvent(event)
  return withLabel({
    category: 'ranking_mismatch',
    canonicalId: event.canonicalId,
    confidence: conf,
    surface: surfaceFromTelemetry(event.surface),
    summary:
      'Low-confidence pick accepted — recommendation quality gap vs displayed confidence',
  })
}

function resolveSessionLevelSurface(
  anomalies: AnomalyFlags,
  sessionEvents?: RecommendationEvaluationEvent[],
): TriagedAnomalySurface {
  const anomalyEvents = [
    ...anomalies.highConfidenceIgnored,
    ...anomalies.lowConfidenceAccepted,
  ]
  const fromAnomalies = dominantSurfaceFromEvents(anomalyEvents)
  if (fromAnomalies !== 'unknown') return fromAnomalies
  if (sessionEvents?.length) return dominantSurfaceFromEvents(sessionEvents)
  return 'unknown'
}

/**
 * Groups raw anomalies into actionable triage categories (observational only).
 */
export function triageAnomalies(
  anomalies: AnomalyFlags,
  gap: PerceptionGapMetrics,
  intentAccuracyProxy: number,
  sessionEvents?: RecommendationEvaluationEvent[],
): TriagedAnomaly[] {
  const out: TriagedAnomaly[] = []
  const sessionSurface = resolveSessionLevelSurface(anomalies, sessionEvents)

  for (const event of anomalies.highConfidenceIgnored) {
    out.push(triageHighConfidenceIgnored(event, gap))
  }

  for (const event of anomalies.lowConfidenceAccepted) {
    out.push(triageLowConfidenceAccepted(event))
  }

  if (intentAccuracyProxy < 0.3 && gap.sampleSize >= 5) {
    out.push(
      withLabel({
        category: 'intent_misalignment',
        surface: sessionSurface,
        summary: 'Intent signal and user actions often diverge — context inference error',
      }),
    )
  }

  if (gap.sampleSize < 5) {
    out.push(
      withLabel({
        category: 'noise',
        surface: sessionSurface,
        summary: 'Too few impressions for reliable anomaly interpretation',
      }),
    )
  }

  return dedupeTriaged(out)
}

function dedupeTriaged(items: TriagedAnomaly[]): TriagedAnomaly[] {
  const seen = new Set<string>()
  const out: TriagedAnomaly[] = []
  for (const item of items) {
    const key = `${item.category}::${item.surface}::${item.canonicalId ?? item.summary}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(item)
  }
  return out
}

export function groupTriagedFindings(
  triaged: TriagedAnomaly[],
): Record<AnomalyTriageCategory, TriagedAnomaly[]> {
  const groups: Record<AnomalyTriageCategory, TriagedAnomaly[]> = {
    ux_issue: [],
    ranking_mismatch: [],
    explanation_issue: [],
    intent_misalignment: [],
    noise: [],
  }
  for (const t of triaged) {
    groups[t.category].push(t)
  }
  return groups
}

export function telemetrySurfacesForTriagedCategory(
  triaged: TriagedAnomaly[],
  category: AnomalyTriageCategory,
): RecommendationSurface[] {
  const surfaces = new Set<RecommendationSurface>()
  for (const item of triaged) {
    if (item.category !== category) continue
    if (item.surface === 'unknown') continue
    if (item.surface === 'augment_guide') {
      surfaces.add('guide')
    } else {
      surfaces.add(item.surface)
    }
  }
  return [...surfaces]
}
