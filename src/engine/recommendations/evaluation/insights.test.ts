import { beforeEach, describe, expect, it } from 'vitest'
import {
  buildSessionInsightReport,
  compareSurfacePerformance,
  detectOverconfidentRecommendations,
  getPerceivedIntelligenceReport,
  listRecommendationEvaluationEvents,
  resetRecommendationEvaluation,
  trackRecommendationIgnored,
  trackRecommendationShown,
  trackRecommendationUsed,
} from '@/engine/recommendations/evaluation'

describe('insights', () => {
  beforeEach(() => {
    resetRecommendationEvaluation()
  })

  it('buildSessionInsightReport aggregates metrics', () => {
    trackRecommendationShown({ canonicalId: 'a', confidence: 0.9, surface: 'overlay' })
    trackRecommendationIgnored({ canonicalId: 'a', surface: 'overlay' })
    trackRecommendationShown({ canonicalId: 'b', confidence: 0.4, surface: 'guide' })
    trackRecommendationUsed({ canonicalId: 'b', surface: 'guide' })

    const report = buildSessionInsightReport()
    expect(report.effectiveness.shown).toBe(2)
    expect(report.perceptionGap.sampleSize).toBe(2)
    expect(report.anomalies.highConfidenceIgnored.length).toBeGreaterThan(0)
    expect(report.classifiedSignals.length).toBeGreaterThan(0)
    expect(report.triagedAnomalies.length).toBeGreaterThan(0)
  })

  it('compareSurfacePerformance splits by surface', () => {
    trackRecommendationShown({ canonicalId: 'a', surface: 'overlay' })
    trackRecommendationUsed({ canonicalId: 'a', surface: 'overlay' })
    trackRecommendationShown({ canonicalId: 'b', surface: 'guide' })

    const rows = compareSurfacePerformance(listRecommendationEvaluationEvents())
    expect(rows.find((r) => r.surface === 'overlay')?.acceptRate).toBe(1)
    expect(rows.find((r) => r.surface === 'guide')?.acceptRate).toBe(0)
    expect(rows.find((r) => r.surface === 'overlay')?.volumeAdjustedAcceptRate).toBeDefined()
  })

  it('getPerceivedIntelligenceReport includes summary lines', () => {
    trackRecommendationShown({ canonicalId: 'z', confidence: 0.75, surface: 'coach' })
    const report = getPerceivedIntelligenceReport()
    expect(report.summary.length).toBeGreaterThan(0)
    expect(report.categories.length).toBeGreaterThan(0)
    expect(report.interpretationHints).toBeDefined()
    expect(report.sessionId).toBeTruthy()
  })

  it('detectOverconfidentRecommendations returns ids', () => {
    trackRecommendationShown({ canonicalId: 'over', confidence: 0.88 })
    trackRecommendationIgnored({ canonicalId: 'over' })
    const ids = detectOverconfidentRecommendations(listRecommendationEvaluationEvents())
    expect(ids).toContain('over')
  })
})
