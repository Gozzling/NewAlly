import { beforeEach, describe, expect, it } from 'vitest'
import {
  buildSessionInsightReport,
  compareSurfacePerformance,
  detectOverconfidentRecommendations,
  getPerceivedIntelligenceReport,
  interpretabilityLabelForCategory,
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
    expect(report.triagedAnomalies.every((t) => Boolean(t.surface))).toBe(true)
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
    trackRecommendationShown({ canonicalId: 'z', confidence: 0.75, surface: 'overlay' })
    const report = getPerceivedIntelligenceReport()
    expect(report.summary.length).toBeGreaterThan(0)
    expect(report.categories.length).toBeGreaterThan(0)
    expect(report.interpretationHints).toBeDefined()
    expect(report.sessionId).toBeTruthy()
    expect(report.sections).toHaveLength(3)
  })

  it('interpretability labels map triage categories', () => {
    expect(interpretabilityLabelForCategory('ux_issue')).toBe('user experience friction')
    expect(interpretabilityLabelForCategory('ranking_mismatch')).toBe(
      'recommendation quality gap',
    )
    expect(interpretabilityLabelForCategory('explanation_issue')).toBe(
      'communication clarity problem',
    )
    expect(interpretabilityLabelForCategory('intent_misalignment')).toBe(
      'context inference error',
    )
  })

  it('detectOverconfidentRecommendations returns ids', () => {
    trackRecommendationShown({ canonicalId: 'over', confidence: 0.88, surface: 'overlay' })
    trackRecommendationIgnored({ canonicalId: 'over', surface: 'overlay' })
    const ids = detectOverconfidentRecommendations(listRecommendationEvaluationEvents())
    expect(ids).toContain('over')
  })
})
