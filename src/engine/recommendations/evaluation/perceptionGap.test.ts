import { beforeEach, describe, expect, it } from 'vitest'
import {
  computePerceptionGap,
  listRecommendationEvaluationEvents,
  resetRecommendationEvaluation,
  trackExplanationExpanded,
  trackRecommendationShown,
  trackRecommendationUsed,
} from '@/engine/recommendations/evaluation'

describe('perceptionGap', () => {
  beforeEach(() => {
    resetRecommendationEvaluation()
  })

  it('detects high-confidence ignored proxy', () => {
    const gap = computePerceptionGap([
      {
        type: 'recommendation_shown',
        timestampMs: 1,
        canonicalId: 'a',
        meta: { confidence: 0.82 },
      },
      {
        type: 'recommendation_ignored',
        timestampMs: 2,
        canonicalId: 'a',
      },
    ])
    expect(gap.correctButIgnoredRate).toBe(1)
  })

  it('detects low-confidence clicked proxy', () => {
    const gap = computePerceptionGap([
      {
        type: 'recommendation_shown',
        timestampMs: 1,
        canonicalId: 'b',
        meta: { confidence: 0.35 },
      },
      {
        type: 'recommendation_used',
        timestampMs: 2,
        canonicalId: 'b',
      },
    ])
    expect(gap.incorrectButClickedRate).toBe(1)
  })

  it('computes explanation helpfulness delta from live events', () => {
    trackRecommendationShown({ canonicalId: 'x', confidence: 0.7 })
    trackExplanationExpanded({ canonicalId: 'x' })
    trackRecommendationUsed({ canonicalId: 'x' })

    trackRecommendationShown({ canonicalId: 'y', confidence: 0.7 })
    trackRecommendationUsed({ canonicalId: 'y' })

    const gap = computePerceptionGap(listRecommendationEvaluationEvents())
    expect(gap.sampleSize).toBe(2)
    expect(gap.explanationHelpfulnessDelta).toBeGreaterThanOrEqual(0)
  })
})
