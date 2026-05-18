import type {
  AggregatedPerceptionTrends,
  PerceptionTrendPoint,
  SessionInsightReport,
  SignalStabilityProfile,
} from './types'

const MAX_SESSION_HISTORY = 24
const sessionHistory: SessionInsightReport[] = []

function rate(n: number, d: number): number {
  return d > 0 ? n / d : 0
}

export function recordSessionSnapshot(report: SessionInsightReport): void {
  const idx = sessionHistory.findIndex((s) => s.sessionId === report.sessionId)
  if (idx >= 0) sessionHistory.splice(idx, 1)
  sessionHistory.push(report)
  while (sessionHistory.length > MAX_SESSION_HISTORY) sessionHistory.shift()
}

export function listSessionSnapshots(): SessionInsightReport[] {
  return [...sessionHistory]
}

function metricSeries(
  reports: SessionInsightReport[],
  pick: (r: SessionInsightReport) => number,
): { key: string; values: number[] }[] {
  return [
    {
      key: 'acceptRate',
      values: reports.map((r) => rate(r.effectiveness.used, r.effectiveness.shown)),
    },
    {
      key: 'correctButIgnoredRate',
      values: reports.map((r) => r.perceptionGap.correctButIgnoredRate),
    },
    {
      key: 'explanationInfluence',
      values: reports.map((r) => r.explanationUsefulness.explanationInfluenceScore),
    },
    {
      key: 'explanationFatigue',
      values: reports.map((r) => r.explanationUsefulness.explanationFatigueIndex),
    },
    {
      key: 'intentAccuracyProxy',
      values: reports.map((r) => r.effectiveness.intentAccuracyProxy),
    },
    {
      key: 'explanationOpenRate',
      values: reports.map((r) => r.perceived.explanationOpenedRate),
    },
  ]
}

function trendDirection(values: number[]): 'rising' | 'falling' | 'flat' {
  if (values.length < 2) return 'flat'
  const first = values.slice(0, Math.ceil(values.length / 2))
  const second = values.slice(Math.ceil(values.length / 2))
  const m1 = first.reduce((a, b) => a + b, 0) / first.length
  const m2 = second.reduce((a, b) => a + b, 0) / second.length
  const delta = m2 - m1
  if (Math.abs(delta) < 0.05) return 'flat'
  return delta > 0 ? 'rising' : 'falling'
}

function volatility(values: number[]): number {
  if (values.length < 2) return 0
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  if (mean === 0) return 0
  const variance = values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / values.length
  return Math.sqrt(variance) / mean
}

/**
 * Aggregates perception metrics across recorded session snapshots.
 */
export function aggregatePerceptionTrends(
  reports: SessionInsightReport[] = sessionHistory,
): AggregatedPerceptionTrends {
  if (reports.length === 0) {
    return { sessionCount: 0, trends: [] }
  }

  const trends: PerceptionTrendPoint[] = metricSeries(reports, () => 0).map(({ key, values }) => {
    const mean = values.reduce((a, b) => a + b, 0) / values.length
    return {
      metricKey: key,
      values,
      mean,
      trend: trendDirection(values),
      volatility: volatility(values),
    }
  })

  return { sessionCount: reports.length, trends }
}

/**
 * Labels metrics as stable vs volatile across sessions (coefficient of variation).
 */
export function detectStableVsVolatileSignals(
  reports: SessionInsightReport[] = sessionHistory,
): SignalStabilityProfile[] {
  const { trends } = aggregatePerceptionTrends(reports)
  return trends.map((t) => {
    const cv = t.volatility
    return {
      metricKey: t.metricKey,
      classification: cv > 0.35 ? 'volatile' : 'stable',
      coefficientOfVariation: cv,
    }
  })
}

/** @internal Test-only */
export function resetSessionAggregation(): void {
  sessionHistory.length = 0
}
