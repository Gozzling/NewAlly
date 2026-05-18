import { beforeEach, describe, expect, it } from 'vitest'
import {
  countDelayedFollowThrough,
  getEffectivenessSnapshot,
  getPerceivedIntelligenceSnapshot,
  resetRecommendationEvaluation,
  trackExplanationExpanded,
  trackRecommendationShown,
  trackRecommendationUsed,
} from '@/engine/recommendations/evaluation'
import { recordRecommendationEvaluation } from '@/engine/recommendations/evaluation/effectivenessStore'

describe('effectivenessStore', () => {
  beforeEach(() => {
    resetRecommendationEvaluation()
  })

  it('tracks shown → used funnel', () => {
    trackRecommendationShown({ canonicalId: 'tft17_a', intent: 'tempo', surface: 'overlay' })
    trackRecommendationUsed({ canonicalId: 'tft17_a', intent: 'tempo', surface: 'overlay' })
    const snap = getEffectivenessSnapshot()
    expect(snap.shown).toBe(1)
    expect(snap.used).toBe(1)
    expect(snap.intentAccuracyProxy).toBeGreaterThan(0)
  })

  it('computes perceived intelligence metrics', () => {
    trackRecommendationShown({ canonicalId: 'a', surface: 'overlay' })
    trackExplanationExpanded({ canonicalId: 'a', surface: 'overlay' })
    const perceived = getPerceivedIntelligenceSnapshot(0.2)
    expect(perceived.explanationOpenedRate).toBeGreaterThan(0)
    expect(perceived.sessionExplanationSimilarity).toBe(0.2)
  })

  it('records delayed follow-through within session window', () => {
    const t0 = 1_000_000
    recordRecommendationEvaluation({
      type: 'recommendation_shown',
      canonicalId: 'delayed_a',
      surface: 'guide',
      timestampMs: t0,
    })
    recordRecommendationEvaluation({
      type: 'guide_augment_opened',
      canonicalId: 'delayed_a',
      surface: 'guide',
      timestampMs: t0 + 60_000,
    })
    expect(countDelayedFollowThrough()).toBeGreaterThanOrEqual(1)
  })
})
