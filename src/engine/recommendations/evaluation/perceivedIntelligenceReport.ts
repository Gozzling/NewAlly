import type {
  PerceivedIntelligenceReport,
  PerceivedIntelligenceReportOptions,
  PrioritizedFinding,
  ReportCategory,
  ReportSection,
  SessionInsightReport,
  TriagedAnomalySurface,
} from './types'
import {
  displayLabelForTriagedSurface,
  surfaceFromTelemetry,
  TRIAGED_SURFACE_DISPLAY_ORDER,
} from './anomalyTriage'
import { buildSessionInsightReport } from './insights'
import { filterLowSignalMetrics } from './insightPrioritization'
import {
  condenseInsightsByCategory,
  mergeRelatedFindings,
  reduceRedundantAnomalies,
} from './insightCondensation'
import {
  detectStableVsVolatileSignals,
  trackCrossSessionInsightEvolution,
} from './sessionAggregation'
import { dominantSignalKind, signalsByKind } from './signalClassification'

function rate(n: number, d: number): number {
  return d > 0 ? n / d : 0
}

const LOW_SIGNAL_STRENGTH = 0.2

function primarySurfaceForFinding(
  finding: PrioritizedFinding,
  triaged: SessionInsightReport['triagedAnomalies'],
): TriagedAnomalySurface {
  if (finding.id === 'ranking-mismatch-group') {
    const ranked = triaged.filter((t) => t.category === 'ranking_mismatch')
    if (ranked.some((t) => t.surface === 'overlay')) return 'overlay'
    if (ranked[0]) return ranked[0].surface
  }
  if (finding.id === 'explain-issue-group') {
    const explained = triaged.filter((t) => t.category === 'explanation_issue')
    if (explained.some((t) => t.surface === 'overlay')) return 'overlay'
    if (explained[0]) return explained[0].surface
  }
  if (finding.relatedSurfaces.length === 1) {
    return surfaceFromTelemetry(finding.relatedSurfaces[0])
  }
  if (finding.relatedSurfaces.includes('overlay')) return 'overlay'
  if (finding.relatedSurfaces.length > 0) {
    return surfaceFromTelemetry(finding.relatedSurfaces[0])
  }
  return 'unknown'
}

function buildActionableInsightItems(
  report: SessionInsightReport,
  decisionSupportMode: boolean,
  crossSession: ReturnType<typeof trackCrossSessionInsightEvolution>,
): string[] {
  const limit = decisionSupportMode ? 3 : 5
  const findings = report.prioritizedFindings.slice(0, limit)
  const entries = findings.map((finding) => ({
    surface: primarySurfaceForFinding(finding, report.triagedAnomalies),
    line: `${finding.title} — ${finding.interpretationHint}`,
  }))

  const surfacesWithFindings = new Set(entries.map((e) => e.surface))
  const flatLines: string[] = []

  if (surfacesWithFindings.size >= 2) {
    for (const surface of TRIAGED_SURFACE_DISPLAY_ORDER) {
      const surfaceEntries = entries.filter((e) => e.surface === surface)
      if (surfaceEntries.length === 0) continue
      const label = displayLabelForTriagedSurface(surface)
      for (const entry of surfaceEntries) {
        flatLines.push(`${label}: ${entry.line}`)
      }
    }
  } else {
    flatLines.push(...entries.map((e) => e.line))
  }

  for (const item of crossSession.recurringAnomalies.slice(0, 2)) {
    flatLines.push(item)
  }
  for (const item of crossSession.emergingIssues.slice(0, 1)) {
    flatLines.push(item)
  }

  return flatLines
}

function buildCategories(
  report: SessionInsightReport,
  decisionSupportMode: boolean,
): ReportCategory[] {
  const filtered = filterLowSignalMetrics(report.classifiedSignals)
  const byKind = signalsByKind(filtered)
  const categories: ReportCategory[] = []

  if (!decisionSupportMode && byKind.structural_ux.length > 0) {
    categories.push({
      id: 'trust-ux',
      title: 'Trust & presentation',
      hints: byKind.structural_ux.slice(0, 3).map((s) => s.label),
    })
  }

  if (!decisionSupportMode && byKind.behavioral.length > 0) {
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

  const triageHints = report.triagedAnomalies
    .filter((t) => t.category !== 'noise')
    .slice(0, decisionSupportMode ? 2 : 3)
    .map((t) => `[${t.interpretabilityLabel}] ${t.summary}`)

  if (triageHints.length > 0) {
    categories.push({
      id: 'anomalies',
      title: 'Notable mismatches',
      hints: triageHints,
    })
  }

  if (!decisionSupportMode && report.surfaceInsights.meaningfulDifferences.length > 0) {
    categories.push({
      id: 'surfaces',
      title: 'Cross-surface comparison',
      hints: report.surfaceInsights.meaningfulDifferences,
    })
  }

  return categories
}

function buildInterpretationHints(
  report: SessionInsightReport,
  decisionSupportMode: boolean,
): string[] {
  const hints = report.prioritizedFindings.map((f) => f.interpretationHint)
  const dominant = dominantSignalKind(report.classifiedSignals)
  if (dominant === 'noise') {
    hints.push('Session volume is low — treat rankings as directional, not definitive.')
  }
  if (
    !decisionSupportMode &&
    report.perceptionGap.sampleSize >= 5 &&
    report.perceptionGap.correctButIgnoredRate > 0.2
  ) {
    hints.push(
      'High-confidence ignores often reflect user experience friction — not necessarily wrong augment scores.',
    )
  }
  if (hints.length === 0 && report.effectiveness.shown > 0) {
    hints.push(
      'Acceptance and explanation patterns look typical — use cross-surface comparison before changing scores.',
    )
  }
  const limit = decisionSupportMode ? 3 : 6
  return [...new Set(hints)].slice(0, limit)
}

function buildSummary(
  report: SessionInsightReport,
  decisionSupportMode: boolean,
): string[] {
  const { effectiveness: e } = report

  if (e.shown === 0) {
    return ['No recommendation impressions recorded this session.']
  }

  const lines: string[] = []
  const findings = report.prioritizedFindings
  const limit = decisionSupportMode ? 3 : 6

  const topFinding = findings[0]
  if (topFinding) {
    lines.push(topFinding.title)
  } else {
    lines.push(
      `${e.shown} impressions with ${Math.round(rate(e.used, e.shown) * 100)}% session accept`,
    )
  }

  for (const finding of findings.slice(1, limit)) {
    lines.push(finding.title)
  }

  if (!decisionSupportMode && report.surfaceInsights.strongestSurface) {
    const row = report.surfaceComparison.find(
      (r) => r.surface === report.surfaceInsights.strongestSurface,
    )
    if (row?.statisticallyMeaningful) {
      lines.push(`Strongest meaningful surface: ${row.surface}`)
    }
  }

  if (report.triagedAnomalies.some((t) => t.category === 'intent_misalignment')) {
    lines.push('Context inference error: intent signals and user actions diverged.')
  }

  return lines.slice(0, limit)
}

function buildReportSections(
  report: SessionInsightReport,
  options: PerceivedIntelligenceReportOptions,
): ReportSection[] {
  const { decisionSupportMode = false, includeRawMetrics = false } = options
  const condensed = condenseInsightsByCategory(
    report.triagedAnomalies,
    report.prioritizedFindings,
  )
  const crossSession = trackCrossSessionInsightEvolution()
  const stability = detectStableVsVolatileSignals()

  const systemBehavior: string[] = []
  const userPerception: string[] = []
  const actionable: string[] = []

  if (!decisionSupportMode) {
    const dominant = dominantSignalKind(report.classifiedSignals)
    if (dominant !== 'noise') {
      systemBehavior.push(`Dominant signal type this session: ${dominant.replace('_', ' ')}`)
    }
    for (const row of report.surfaceInsights.meaningfulDifferences.slice(0, 3)) {
      systemBehavior.push(row)
    }
  }

  for (const group of condensed) {
    if (group.category === 'noise') continue
    const line =
      group.count > 1
        ? `${group.interpretabilityLabel} (${group.count}): ${group.items[0]}`
        : `${group.interpretabilityLabel}: ${group.items[0]}`
    if (
      group.category === 'ranking_mismatch' ||
      group.category === 'explanation_issue' ||
      group.category === 'finding'
    ) {
      systemBehavior.push(line)
    } else {
      userPerception.push(line)
    }
  }

  if (report.explanationUsefulness.explanationFatigueIndex > 0.15) {
    userPerception.push('Users show explanation fatigue later in the session')
  }
  if (report.perceived.explanationOpenedRate > 0.3) {
    userPerception.push('Explanation panels are opened frequently — users seek more context')
  }

  actionable.push(...buildActionableInsightItems(report, decisionSupportMode, crossSession))

  const volatileStable = stability.filter((s) => s.classification === 'volatile')
  if (!decisionSupportMode && volatileStable.length > 0) {
    systemBehavior.push(
      `${volatileStable.length} metric(s) volatile across sessions — prioritize recurring patterns`,
    )
  }

  if (includeRawMetrics) {
    for (const s of report.classifiedSignals.filter((sig) => sig.strength > LOW_SIGNAL_STRENGTH)) {
      systemBehavior.push(`${sig.metricKey}: ${Math.round(sig.value * 100) / 100}`)
    }
  }

  return [
    { id: 'system_behavior', title: 'System Behavior', items: systemBehavior.slice(0, 6) },
    { id: 'user_perception', title: 'User Perception', items: userPerception.slice(0, 6) },
    {
      id: 'actionable_insights',
      title: 'Actionable Insights',
      items: actionable.slice(0, decisionSupportMode ? 3 : 8),
    },
  ]
}

function applyDecisionSupport(report: SessionInsightReport): SessionInsightReport {
  const mergedFindings = mergeRelatedFindings(report.prioritizedFindings)
  const reducedTriaged = reduceRedundantAnomalies(report.triagedAnomalies)
  const topFindings = mergedFindings
    .filter((f) => f.impactScore >= 0.4)
    .slice(0, 3)

  const filteredSignals = report.classifiedSignals.filter(
    (s) => s.kind !== 'noise' && s.strength >= LOW_SIGNAL_STRENGTH,
  )

  return {
    ...report,
    triagedAnomalies: reducedTriaged.filter((t) => t.category !== 'noise'),
    prioritizedFindings: topFindings.length > 0 ? topFindings : mergedFindings.slice(0, 3),
    classifiedSignals: filteredSignals,
  }
}

/**
 * Exportable perceived intelligence report for dev panels, tuning cycles, or debug overlays.
 * Default mode uses curated summaries — not raw metric dumps.
 * Strictly observational — does not affect scoring, intent inference, or canonical layers.
 */
export function getPerceivedIntelligenceReport(
  sessionId?: string,
  sessionSimilarity = 0,
  options: PerceivedIntelligenceReportOptions = {},
): PerceivedIntelligenceReport {
  const { decisionSupportMode = false, includeRawMetrics = false } = options
  let base = buildSessionInsightReport(sessionId, sessionSimilarity)

  base = {
    ...base,
    triagedAnomalies: reduceRedundantAnomalies(base.triagedAnomalies),
    prioritizedFindings: mergeRelatedFindings(base.prioritizedFindings),
  }

  if (decisionSupportMode) {
    base = applyDecisionSupport(base)
  }

  const condensedInsights = condenseInsightsByCategory(
    base.triagedAnomalies,
    base.prioritizedFindings,
  )
  const crossSessionEvolution = trackCrossSessionInsightEvolution()
  const signalStability = detectStableVsVolatileSignals()

  const reportOptions = { decisionSupportMode, includeRawMetrics }

  return {
    ...base,
    summary: buildSummary(base, decisionSupportMode),
    categories: buildCategories(base, decisionSupportMode),
    interpretationHints: buildInterpretationHints(base, decisionSupportMode),
    sections: buildReportSections(base, reportOptions),
    condensedInsights,
    crossSessionEvolution,
    signalStability,
  }
}
