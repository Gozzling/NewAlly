import { beforeEach, describe, expect, it } from 'vitest'
import {
  feedbackRecencyWeight,
  getEntityFeedbackAdjustment,
  recordRecommendationFeedback,
  resetRecommendationFeedbackStore,
} from '@/lib/recommendationFeedbackStore'
import { FEEDBACK_DECAY_HALF_LIFE_MS } from '@/types/recommendationFeedback'

describe('recommendationFeedbackStore', () => {
  beforeEach(() => {
    resetRecommendationFeedbackStore()
  })

  it('decays old feedback weight', () => {
    const fresh = feedbackRecencyWeight(Date.now())
    const stale = feedbackRecencyWeight(Date.now() - FEEDBACK_DECAY_HALF_LIFE_MS)
    expect(fresh).toBeGreaterThan(stale)
  })

  it('weights implicit feedback lower than explicit', () => {
    const now = Date.now()
    recordRecommendationFeedback({
      type: 'AUGMENT_HELPFUL',
      timestampMs: now,
      canonicalId: 'tft17_a',
      channel: 'explicit',
    })
    const explicitAdj = getEntityFeedbackAdjustment('tft17_a', now)

    resetRecommendationFeedbackStore()
    recordRecommendationFeedback({
      type: 'AUGMENT_HELPFUL',
      timestampMs: now,
      canonicalId: 'tft17_b',
      channel: 'implicit',
    })
    const implicitAdj = getEntityFeedbackAdjustment('tft17_b', now)

    expect(explicitAdj).toBeGreaterThan(implicitAdj)
  })
})
