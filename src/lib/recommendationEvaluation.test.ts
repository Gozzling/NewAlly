import { describe, expect, it } from 'vitest'
import {
  engagementProxyScore,
  precisionAtK,
  successRateByRecommendationType,
} from '@/lib/recommendationEvaluation'
import type { RecommendationFeedbackEvent } from '@/types/recommendationFeedback'

describe('recommendationEvaluation', () => {
  it('computes precision@k', () => {
    const relevant = new Set(['a', 'b'])
    expect(precisionAtK(['a', 'x', 'b'], relevant, 2)).toBe(0.5)
    expect(precisionAtK(['a', 'b'], relevant, 2)).toBe(1)
  })

  it('computes engagement proxy and success rates', () => {
    const feedback: RecommendationFeedbackEvent[] = [
      { type: 'RECOMMENDATION_ACCEPTED', timestampMs: 1, canonicalId: 'x' },
      { type: 'RECOMMENDATION_REJECTED', timestampMs: 2, canonicalId: 'y' },
      { type: 'AUGMENT_HELPFUL', timestampMs: 3, canonicalId: 'z' },
    ]
    expect(engagementProxyScore({ shown: 0, accepted: 1, rejected: 1, helpful: 1, notHelpful: 0 })).toBeCloseTo(2 / 3)
    const rates = successRateByRecommendationType(feedback)
    expect(rates.RECOMMENDATION_ACCEPTED).toBe(1)
    expect(rates.RECOMMENDATION_REJECTED).toBe(0)
  })
})
