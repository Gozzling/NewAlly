import type {
  PerceivedIntelligenceReport,
  ReportCategory,
  SessionInsightReport,
} from './types'
import { buildSessionInsightReport } from './insights'
import { filterLowSignalMetrics } from './insightPrioritization'
import { dominantSignalKind, signalsByKind } from './signalClassification'

function rate(n: number, d: number): number {
  return d > 0 ? n / d : 0
}

function buildCategories(report: SessionInsightReport): ReportCategory[] {
  const filtered = filterLowSignalMetrics(report.classifiedSignals)
  const byKind = signalsByKind(filtered)
  const categories: ReportCategory[] = []

  if (byKind.structural_ux.length > 0) {
    categories.push({
      id: 'trust-ux',
      title: 'Trust & presentation',
      hints: byKind.structural_ux.slice(0, 3).map((s) => s.label),
    })
  }

  if (byKind.behavioral.length > 0) {
    categories.push({
      id: 'engagement',
      title: 'Engagement patterns',
      hints: byKind.behavioral.slice(0, 3).map((s) => s.label),
    })
  }

  if (byKind.intent_misclassification.length > 0) {
    categories.push({
      id: 'intent',
      title: 'Intent alignment',
      hints: byKind.intent_misclassification.map((s) => s.label),
    })
  }

  if (report.triagedAnomalies.length > 0) {
    const triageHints = report.triagedAnomalies
      .filter((t) => t.category !== 'noise')
      .slice(0, 3)
      .map((t) => t.summary)
    if (triageHints.length > 0) {
      categories.push({
        id: 'anomalies',
        title: 'Notable mismatches',
        hints: triageHints,
      })
    }
  }

  if (report.surfaceInsights.meaningfulDifferences.length > 0) {
    categories.push({
      id: 'surfaces',
      title: 'Cross-surface comparison',
      hints: report.surfaceInsights.meaningfulDifferences,
    })
  }

  return categories
}

function buildInterpretationHints(report: SessionInsightReport): string[] {
  const hints = report.prioritizedFindings.map((f) => f.interpretationHint)
  const dominant = dominantSignalKind(report.classifiedSignals)
  if (dominant === 'noise') {
    hints.push('Session volume is low — treat rankings as directional, not definitive.')
  }
  if (report.perceptionGap.sampleSize >= 5 && report.perceptionGap.correctButIgnoredRate > 0.2) {
    hints.push(
      'High-confidence ignores often reflect timing or copy — not necessarily wrong augment scores.',
    )
  }
  if (hints.length === 0 && report.effectiveness.shown > 0) {
    hints.push(
      'Acceptance and explanation patterns look typical — use cross-surface comparison before changing scores.',
    )
  }
  return [...new Set(hints)].slice(0, 6)
}

function buildSummary(report: SessionInsightReport): string[] {
  const { effectiveness: e } = report

  if (e.shown === 0) {
    return ['No recommendation impressions recorded this session.']
  }

  const lines: string[] = []

  const topFinding = report.prioritizedFindings[0]
  if (topFinding) {
    lines.push(topFinding.title)
  } else {
    lines.push(
      `${e.shown} impressions with ${Math.round(rate(e.used, e.shown) * 100)}% session accept`,
    )
  }

  for (const finding of report.prioritizedFindings.slice(1, 4)) {
    lines.push(finding.title)
  }

  if (report.surfaceInsights.strongestSurface) {
    const row = report.surfaceComparison.find(
      (r) => r.surface === report.surfaceInsights.strongestSurface,
    )
    if (row?.statisticallyMeaningful) {
      lines.push(
        `Strongest meaningful surface: ${row.surface} (volume-adjusted accept ${Math.round(row.volumeAdjustedAcceptRate * 100)}%)`,
      )
    }
  }

  if (report.triagedAnomalies.some((t) => t.category === 'intent_misalignment')) {
    lines.push('Intent signals and user actions diverged — overlay intent blend may need review.')
  }

  return lines.slice(0, 6)
}

/**
 * Exportable perceived intelligence report for dev panels, tuning cycles, or debug overlays.
 * Default mode uses curated summaries — not raw metric dumps.
 * Strictly observational — does not affect scoring or recommendations.
 */
export function getPerceivedIntelligenceReport(
  sessionId?: string,
  sessionSimilarity = 0,
): PerceivedIntelligenceReport {
  const base = buildSessionInsightReport(sessionId, sessionSimilarity)
  return {
    ...base,
    summary: buildSummary(base),
    categories: buildCategories(base),
    interpretationHints: buildInterpretationHints(base),
  }
}
