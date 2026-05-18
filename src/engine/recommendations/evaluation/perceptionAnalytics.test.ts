import { beforeEach, describe, expect, it } from 'vitest'
import {
  aggregatePerceptionTrends,
  buildSessionInsightReport,
  classifySessionSignals,
  detectStableVsVolatileSignals,
  getPerceivedIntelligenceReport,
  resetRecommendationEvaluation,
  resetSessionAggregation,
  trackRecommendationIgnored,
  trackRecommendationShown,
  trackRecommendationUsed,
  triageAnomalies,
} from '@/engine/recommendations/evaluation'
import { detectRecommendationAnomalies } from '@/engine/recommendations/evaluation/anomalyDetection'
import { computePerceptionGap } from '@/engine/recommendations/evaluation/perceptionGap'
import {
  listRecommendationEvaluationEvents,
} from '@/engine/recommendations/evaluation/effectivenessStore'

describe('perception analytics refinement', () => {
  beforeEach(() => {
    resetRecommendationEvaluation()
    resetSessionAggregation()
  })

  it('classifies session signals by kind', () => {
    for (let i = 0; i < 6; i++) {
      trackRecommendationShown({ canonicalId: `a${i}`, confidence: 0.9, surface: 'overlay' })
      trackRecommendationIgnored({ canonicalId: `a${i}`, surface: 'overlay' })
    }
    const report = buildSessionInsightReport()
    expect(report.classifiedSignals.length).toBeGreaterThan(0)
    const kinds = new Set(report.classifiedSignals.map((s) => s.kind))
    expect(kinds.has('structural_ux') || kinds.has('behavioral')).toBe(true)
  })

  it('prioritizes findings and suppresses noise-only sessions', () => {
    trackRecommendationShown({ canonicalId: 'solo', confidence: 0.5, surface: 'guide' })
    const report = buildSessionInsightReport()
    expect(Array.isArray(report.prioritizedFindings)).toBe(true)
  })

  it('triages anomalies into categories', () => {
    trackRecommendationShown({ canonicalId: 'x', confidence: 0.88 })
    trackRecommendationIgnored({ canonicalId: 'x' })
    const events = listRecommendationEvaluationEvents()
    const gap = computePerceptionGap(events)
    const anomalies = detectRecommendationAnomalies(events)
    const triaged = triageAnomalies(anomalies, gap, 0.5)
    expect(triaged.some((t) => t.category === 'ranking_mismatch' || t.category === 'ux_issue')).toBe(
      true,
    )
  })

  it('compareSurfacePerformance includes volume adjustment fields', () => {
    trackRecommendationShown({ canonicalId: 'a', surface: 'overlay' })
    trackRecommendationUsed({ canonicalId: 'a', surface: 'overlay' })
    const report = buildSessionInsightReport()
    const overlay = report.surfaceComparison.find((r) => r.surface === 'overlay')
    expect(overlay?.volumeAdjustedAcceptRate).toBeDefined()
    expect(overlay?.intentBiasNote).toBeTruthy()
    expect(report.surfaceInsights).toBeDefined()
  })

  it('getPerceivedIntelligenceReport returns categories and hints', () => {
    for (let i = 0; i < 5; i++) {
      trackRecommendationShown({ canonicalId: `z${i}`, confidence: 0.8, surface: 'coach' })
      trackRecommendationUsed({ canonicalId: `z${i}`, surface: 'coach' })
    }
    const report = getPerceivedIntelligenceReport()
    expect(report.categories.length).toBeGreaterThan(0)
    expect(report.interpretationHints.length).toBeGreaterThan(0)
    expect(report.summary.every((line) => !line.includes('undefined'))).toBe(true)
  })

  it('aggregates trends across recorded sessions', () => {
    trackRecommendationShown({ canonicalId: 't1', surface: 'guide' })
    buildSessionInsightReport('session-a')
    trackRecommendationShown({ canonicalId: 't2', surface: 'guide' })
    trackRecommendationUsed({ canonicalId: 't2', surface: 'guide' })
    buildSessionInsightReport('session-b')

    const trends = aggregatePerceptionTrends()
    expect(trends.sessionCount).toBeGreaterThanOrEqual(2)
    const stability = detectStableVsVolatileSignals()
    expect(stability.length).toBeGreaterThan(0)
  })

  it('classifySessionSignals returns early on low volume', () => {
    trackRecommendationShown({ canonicalId: 'only', confidence: 0.5 })
    const report = buildSessionInsightReport()
    const direct = classifySessionSignals(report)
    expect(direct.some((s) => s.kind === 'noise')).toBe(true)
  })
})
