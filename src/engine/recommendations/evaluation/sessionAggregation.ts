import type {
  AggregatedPerceptionTrends,
  AnomalyTriageCategory,
  CrossSessionInsightEvolution,
  PerceptionTrendPoint,
  SessionInsightReport,
  SignalStabilityClassification,
  SignalStabilityProfile,
} from './types'
import { interpretabilityLabelForCategory } from './anomalyTriage'

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

function metricSeries(reports: SessionInsightReport[]): { key: string; values: number[] }[] {
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
  return Math.sqrt(variance) / Math.abs(mean)
}

function classifyStability(cv: number): SignalStabilityClassification {
  if (cv <= 0.15) return 'stable'
  if (cv <= 0.35) return 'semi_stable'
  return 'volatile'
}

function stabilityConfidence(sessionCount: number, valueCount: number, cv: number): number {
  const volumeFactor = Math.min(1, sessionCount / 5) * Math.min(1, valueCount / 4)
  const clarityFactor = 1 - Math.min(cv, 1)
  return Math.round(volumeFactor * clarityFactor * 100) / 100
}

function isTrendConverging(values: number[], trend: PerceptionTrendPoint['trend']): boolean {
  if (values.length < 3) return false
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const recent = values.slice(-Math.min(3, values.length))
  const recentMean = recent.reduce((a, b) => a + b, 0) / recent.length
  const distanceToMean = Math.abs(recentMean - mean)
  const early = values.slice(0, Math.min(3, values.length))
  const earlyMean = early.reduce((a, b) => a + b, 0) / early.length
  const earlyDistance = Math.abs(earlyMean - mean)
  if (earlyDistance < 0.001) return distanceToMean < 0.05
  const converging = distanceToMean < earlyDistance * 0.85
  if (trend === 'flat') return converging
  const recentDelta = recent[recent.length - 1] - recent[0]
  const trendAligned =
    (trend === 'rising' && recentDelta >= 0) || (trend === 'falling' && recentDelta <= 0)
  return converging && trendAligned
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

  const trends: PerceptionTrendPoint[] = metricSeries(reports).map(({ key, values }) => {
    const mean = values.reduce((a, b) => a + b, 0) / values.length
    const dir = trendDirection(values)
    return {
      metricKey: key,
      values,
      mean,
      trend: dir,
      volatility: volatility(values),
    }
  })

  return { sessionCount: reports.length, trends }
}

/**
 * Classifies signals as stable / semi-stable / volatile with confidence and convergence.
 */
export function detectStableVsVolatileSignals(
  reports: SessionInsightReport[] = sessionHistory,
): SignalStabilityProfile[] {
  const { trends, sessionCount } = aggregatePerceptionTrends(reports)
  return trends.map((t) => {
    const cv = t.volatility
    return {
      metricKey: t.metricKey,
      classification: classifyStability(cv),
      coefficientOfVariation: cv,
      stabilityConfidence: stabilityConfidence(sessionCount, t.values.length, cv),
      trendConverging: isTrendConverging(t.values, t.trend),
    }
  })
}

function categorySessions(
  reports: SessionInsightReport[],
  pick: (r: SessionInsightReport) => AnomalyTriageCategory[],
): Map<AnomalyTriageCategory, number> {
  const counts = new Map<AnomalyTriageCategory, Set<string>>()
  for (const report of reports) {
    const categories = pick(report)
    for (const cat of categories) {
      if (cat === 'noise') continue
      const sessions = counts.get(cat) ?? new Set<string>()
      sessions.add(report.sessionId)
      counts.set(cat, sessions)
    }
  }
  const out = new Map<AnomalyTriageCategory, number>()
  for (const [cat, sessions] of counts) {
    out.set(cat, sessions.size)
  }
  return out
}

function labelForCategory(category: AnomalyTriageCategory): string {
  return interpretabilityLabelForCategory(category)
}

/**
 * Tracks recurring, emerging, and fading perception issues across sessions.
 * Observational only.
 */
export function trackCrossSessionInsightEvolution(
  reports: SessionInsightReport[] = sessionHistory,
): CrossSessionInsightEvolution {
  if (reports.length === 0) {
    return {
      sessionCount: 0,
      recurringAnomalies: [],
      emergingIssues: [],
      fadingIssues: [],
      longTermDriftIndicators: [],
    }
  }

  const mid = Math.floor(reports.length / 2)
  const early = reports.slice(0, mid)
  const recent = reports.slice(mid)

  const allCategories = categorySessions(reports, (r) =>
    r.triagedAnomalies.map((t) => t.category),
  )
  const earlyCategories = new Set(
    early.flatMap((r) => r.triagedAnomalies.map((t) => t.category).filter((c) => c !== 'noise')),
  )
  const recentCategories = new Set(
    recent.flatMap((r) => r.triagedAnomalies.map((t) => t.category).filter((c) => c !== 'noise')),
  )

  const recurringAnomalies: string[] = []
  for (const [cat, sessionHits] of allCategories) {
    if (sessionHits >= 2) {
      recurringAnomalies.push(
        `Recurring ${labelForCategory(cat)} across ${sessionHits} sessions`,
      )
    }
  }

  const emergingIssues: string[] = []
  for (const cat of recentCategories) {
    if (!earlyCategories.has(cat)) {
      emergingIssues.push(`Emerging: ${labelForCategory(cat)}`)
    }
  }

  const fadingIssues: string[] = []
  for (const cat of earlyCategories) {
    if (!recentCategories.has(cat)) {
      fadingIssues.push(`Fading: ${labelForCategory(cat)}`)
    }
  }

  const longTermDriftIndicators = buildDriftIndicators(reports)

  return {
    sessionCount: reports.length,
    recurringAnomalies: recurringAnomalies.slice(0, 5),
    emergingIssues: emergingIssues.slice(0, 5),
    fadingIssues: fadingIssues.slice(0, 5),
    longTermDriftIndicators: longTermDriftIndicators.slice(0, 5),
  }
}

function buildDriftIndicators(reports: SessionInsightReport[]): string[] {
  if (reports.length < 3) return []

  const indicators: string[] = []
  const third = Math.max(1, Math.floor(reports.length / 3))
  const first = reports.slice(0, third)
  const last = reports.slice(-third)

  const acceptFirst =
    first.reduce((a, r) => a + rate(r.effectiveness.used, r.effectiveness.shown), 0) / first.length
  const acceptLast =
    last.reduce((a, r) => a + rate(r.effectiveness.used, r.effectiveness.shown), 0) / last.length
  const acceptDelta = acceptLast - acceptFirst
  if (Math.abs(acceptDelta) >= 0.1) {
    indicators.push(
      acceptDelta > 0
        ? 'Long-term perception drift: acceptance trending up across sessions'
        : 'Long-term perception drift: acceptance trending down across sessions',
    )
  }

  const ignoreFirst =
    first.reduce((a, r) => a + r.perceptionGap.correctButIgnoredRate, 0) / first.length
  const ignoreLast =
    last.reduce((a, r) => a + r.perceptionGap.correctButIgnoredRate, 0) / last.length
  const ignoreDelta = ignoreLast - ignoreFirst
  if (Math.abs(ignoreDelta) >= 0.08) {
    indicators.push(
      ignoreDelta > 0
        ? 'Drift: recommendation quality gap (ignored high-confidence picks) widening'
        : 'Drift: recommendation quality gap narrowing — fewer high-confidence ignores',
    )
  }

  const stability = detectStableVsVolatileSignals(reports)
  const volatileCount = stability.filter((s) => s.classification === 'volatile').length
  if (volatileCount >= 3) {
    indicators.push(
      `${volatileCount} metrics remain volatile — interpret session findings with caution`,
    )
  }

  const converging = stability.filter((s) => s.trendConverging).length
  if (converging >= 2 && reports.length >= 4) {
    indicators.push('Trend convergence: several metrics stabilizing toward session means')
  }

  return indicators
}

/** @internal Test-only */
export function resetSessionAggregation(): void {
  sessionHistory.length = 0
}
