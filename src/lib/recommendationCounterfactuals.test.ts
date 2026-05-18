import { describe, expect, it } from 'vitest'
import {
  compareAgainstBaseline,
  estimateRecommendationImpact,
  simulateAlternativeChoices,
} from '@/lib/recommendationCounterfactuals'
import type { EntityRecommendationScore } from '@/engine/recommendations/scoring'
import type { CanonicalAugment } from '@/types/canonicalAugment'

function mockScore(id: string, confidence: number): EntityRecommendationScore {
  const entity: CanonicalAugment = {
    type: 'augment',
    canonicalId: id,
    name: id,
    set: 17,
    patch: '17.1',
    locale: 'en',
    version: { set: 17, patch: '17.1', locale: 'en' },
    tier: 'gold',
    metadata: { completeness: {}, sourceChain: [] },
  }
  return {
    entity,
    score: confidence,
    calibratedConfidence: confidence,
    factors: {
      base: 0.5,
      sampleSize: 50,
      patchStability: 1,
      winRateDelta: 0.5,
      derivedPenalty: 0,
      feedbackAdjustment: 0.05,
    },
  }
}

describe('recommendationCounterfactuals', () => {
  const ranked = [mockScore('a', 0.8), mockScore('b', 0.6), mockScore('c', 0.4)]

  it('estimates impact vs baseline', () => {
    const impact = estimateRecommendationImpact(ranked, { baseline: 'no_feedback' })
    expect(impact[0].delta).toBeCloseTo(0.05, 5)
  })

  it('compares rank shifts', () => {
    const baseline = [...ranked].reverse()
    const cmp = compareAgainstBaseline(ranked, baseline)
    expect(cmp.find((c) => c.entityId === 'a')?.rankAfter).toBe(1)
  })

  it('simulates alternative choices', () => {
    const sim = simulateAlternativeChoices(ranked, 'a', ['b', 'c'])
    expect(sim[0].vsSelectedDelta).toBeLessThan(0)
  })
})
