import type {
  RecommendationSurface,
  SessionInsightReport,
  SurfaceComparisonInsight,
  SurfacePerformanceRow,
} from './types'
import type { RecommendationEvaluationEvent } from './types'
import { triageAnomalies } from './anomalyTriage'
import { computeExplanationUsefulness } from './explanationUsefulness'
import { detectOverconfidentRecommendations, detectRecommendationAnomalies } from './anomalyDetection'
import { computePerceptionGap } from './perceptionGap'
import {
  countDelayedFollowThrough,
  getEffectivenessSnapshot,
  getPerceivedIntelligenceSnapshot,
  getRecommendationEvaluationSessionId,
  listRecommendationEvaluationEvents,
} from './effectivenessStore'
import { filterEvents } from './eventQuery'
import { prioritizeSessionFindings } from './insightPrioritization'
import { recordSessionSnapshot } from './sessionAggregation'
import { classifySessionSignals } from './signalClassification'

const SURFACES: RecommendationSurface[] = ['overlay', 'guide', 'coach', 'team_builder']
const VOLUME_PRIOR = 8
const MIN_MEANINGFUL_SHOWN = 6
const MEANINGFUL_DELTA = 0.12

const SURFACE_INTENT_BIAS: Record<RecommendationSurface, string> = {
  overlay: 'In-game HUD — fast decisions; lower accept vs guide is often expected.',
  guide: 'Deliberate augment browsing — higher explanation depth is typical.',
  coach: 'Coach tips may inform without a direct accept event.',
  team_builder: 'Planning context — impressions may not imply immediate picks.',
}

function rate(n: number, d: number): number {
  return d > 0 ? n / d : 0
}

function volumeAdjustedRate(used: number, shown: number, sessionMean: number): number {
  const w = shown / (shown + VOLUME_PRIOR)
  return w * rate(used, shown) + (1 - w) * sessionMean
}

function buildSurfaceComparisonInsight(rows: SurfacePerformanceRow[]): SurfaceComparisonInsight {
  const meaningful = rows.filter((r) => r.statisticallyMeaningful)
  const differences: string[] = []

  if (meaningful.length >= 2) {
    const sorted = [...meaningful].sort(
      (a, b) => b.volumeAdjustedAcceptRate - a.volumeAdjustedAcceptRate,
    )
    const best = sorted[0]
    const worst = sorted[sorted.length - 1]
    if (best && worst && best.surface !== worst.surface) {
      const delta = best.volumeAdjustedAcceptRate - worst.volumeAdjustedAcceptRate
      if (delta >= MEANINGFUL_DELTA) {
        differences.push(
          `${best.surface} outperforms ${worst.surface} on volume-adjusted accept (${Math.round(delta * 100)}pp)`,
        )
      }
    }
  }

  for (const row of meaningful) {
    if (row.acceptRateDeltaFromMean >= MEANINGFUL_DELTA) {
      differences.push(`${row.surface} accept is above session average after volume adjustment`)
    } else if (row.acceptRateDeltaFromMean <= -MEANINGFUL_DELTA) {
      differences.push(`${row.surface} accept trails session average after volume adjustment`)
    }
  }

  const strongest = [...rows]
    .filter((r) => r.shown >= MIN_MEANINGFUL_SHOWN)
    .sort((a, b) => b.volumeAdjustedAcceptRate - a.volumeAdjustedAcceptRate)[0]

  return {
    strongestSurface: strongest?.surface,
    meaningfulDifferences: [...new Set(differences)].slice(0, 5),
  }
}

export function compareSurfacePerformance(
  events: RecommendationEvaluationEvent[],
  sessionId?: string,
): SurfacePerformanceRow[] {
  const raw = SURFACES.map((surface) => {
    const scoped = filterEvents(events, { sessionId, surface })
    const shown = scoped.filter((e) => e.type === 'recommendation_shown').length
    const used = scoped.filter((e) => e.type === 'recommendation_used').length
    const ignored = scoped.filter((e) => e.type === 'recommendation_ignored').length
    const expanded = scoped.filter((e) => e.type === 'explanation_expanded').length
    const followUps = scoped.filter(
      (e) => e.type === 'intent_follow_up' && e.meta?.aligned === true,
    ).length

    return {
      surface,
      shown,
      used,
      ignored,
      acceptRate: rate(used, shown),
      explanationOpenRate: rate(expanded, shown),
      intentFollowThroughRate: rate(followUps, shown),
    }
  }).filter((row) => row.shown > 0)

  const totalShown = raw.reduce((a, r) => a + r.shown, 0)
  const totalUsed = raw.reduce((a, r) => a + r.used, 0)
  const sessionMean = rate(totalUsed, totalShown)

  return raw.map((row) => {
    const volumeAdjustedAcceptRate = volumeAdjustedRate(row.used, row.shown, sessionMean)
    const acceptRateDeltaFromMean = volumeAdjustedAcceptRate - sessionMean
    const statisticallyMeaningful =
      row.shown >= MIN_MEANINGFUL_SHOWN && Math.abs(acceptRateDeltaFromMean) >= MEANINGFUL_DELTA

    return {
      ...row,
      volumeAdjustedAcceptRate,
      acceptRateDeltaFromMean,
      statisticallyMeaningful,
      intentBiasNote: SURFACE_INTENT_BIAS[row.surface],
    }
  })
}

export function buildSessionInsightReport(
  sessionId?: string,
  sessionSimilarity = 0,
): SessionInsightReport {
  const sid = sessionId ?? getRecommendationEvaluationSessionId()
  const events = listRecommendationEvaluationEvents()
  const effectiveness = getEffectivenessSnapshot(sid)
  const perceived = getPerceivedIntelligenceSnapshot(sessionSimilarity, sid)
  const perceptionGap = computePerceptionGap(events, sid)
  const explanationUsefulness = computeExplanationUsefulness(events, sid)
  const surfaceComparison = compareSurfacePerformance(events, sid)
  const surfaceInsights = buildSurfaceComparisonInsight(surfaceComparison)
  const anomalies = detectRecommendationAnomalies(events, sid)
  const overconfidentRecommendationIds = detectOverconfidentRecommendations(events, sid)
  const delayedFollowThroughCount = countDelayedFollowThrough(sid)
  const triagedAnomalies = triageAnomalies(anomalies, perceptionGap, effectiveness.intentAccuracyProxy)

  const draft: SessionInsightReport = {
    sessionId: sid,
    generatedAtMs: Date.now(),
    effectiveness,
    perceived,
    perceptionGap,
    explanationUsefulness,
    surfaceComparison,
    surfaceInsights,
    anomalies,
    triagedAnomalies,
    classifiedSignals: [],
    prioritizedFindings: [],
    overconfidentRecommendationIds,
    delayedFollowThroughCount,
  }

  const classifiedSignals = classifySessionSignals(draft)
  const prioritizedFindings = prioritizeSessionFindings(
    draft,
    classifiedSignals,
    triagedAnomalies,
    surfaceInsights,
  )

  const report: SessionInsightReport = {
    ...draft,
    classifiedSignals,
    prioritizedFindings,
  }

  recordSessionSnapshot(report)
  return report
}

export { detectOverconfidentRecommendations } from './anomalyDetection'
