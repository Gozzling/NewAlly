import type {
  AnomalyFlags,
  AnomalyTriageCategory,
  PerceptionGapMetrics,
  RecommendationEvaluationEvent,
  TriagedAnomaly,
} from './types'
import { confidenceFromEvent } from './eventQuery'

function triageHighConfidenceIgnored(
  event: RecommendationEvaluationEvent,
  gap: PerceptionGapMetrics,
): TriagedAnomaly {
  const conf = confidenceFromEvent(event)
  if (gap.explanationHelpfulnessDelta < -0.1) {
    return {
      category: 'explanation_issue',
      canonicalId: event.canonicalId,
      confidence: conf,
      surface: event.surface,
      summary: 'Strong score ignored after explanation engagement — rationale may not match decision needs',
    }
  }
  if (gap.correctButIgnoredRate > 0.2) {
    return {
      category: 'ranking_mismatch',
      canonicalId: event.canonicalId,
      confidence: conf,
      surface: event.surface,
      summary: 'High-confidence recommendation ignored — ranking/copy may oversell fit',
    }
  }
  return {
    category: 'ux_issue',
    canonicalId: event.canonicalId,
    confidence: conf,
    surface: event.surface,
    summary: 'High-confidence pick not acted on — surface friction or timing may block action',
  }
}

function triageLowConfidenceAccepted(event: RecommendationEvaluationEvent): TriagedAnomaly {
  const conf = confidenceFromEvent(event)
  return {
    category: 'ranking_mismatch',
    canonicalId: event.canonicalId,
    confidence: conf,
    surface: event.surface,
    summary: 'Low-confidence pick accepted — users may be exploring rather than trusting scores',
  }
}

/**
 * Groups raw anomalies into actionable triage categories (observational only).
 */
export function triageAnomalies(
  anomalies: AnomalyFlags,
  gap: PerceptionGapMetrics,
  intentAccuracyProxy: number,
): TriagedAnomaly[] {
  const out: TriagedAnomaly[] = []

  for (const event of anomalies.highConfidenceIgnored) {
    out.push(triageHighConfidenceIgnored(event, gap))
  }

  for (const event of anomalies.lowConfidenceAccepted) {
    out.push(triageLowConfidenceAccepted(event))
  }

  if (intentAccuracyProxy < 0.3 && gap.sampleSize >= 5) {
    out.push({
      category: 'intent_misalignment',
      summary: 'Intent signal and user actions often diverge this session',
    })
  }

  if (gap.sampleSize < 5) {
    out.push({
      category: 'noise',
      summary: 'Too few impressions for reliable anomaly interpretation',
    })
  }

  return dedupeTriaged(out)
}

function dedupeTriaged(items: TriagedAnomaly[]): TriagedAnomaly[] {
  const seen = new Set<string>()
  const out: TriagedAnomaly[] = []
  for (const item of items) {
    const key = `${item.category}::${item.canonicalId ?? item.summary}`
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
