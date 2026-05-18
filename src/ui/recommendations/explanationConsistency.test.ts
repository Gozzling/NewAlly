import { beforeEach, describe, expect, it } from 'vitest'
import {
  explanationSimilarityScore,
  isRepetitiveAnchor,
  penalizeIfNearDuplicate,
  recordRationaleOutput,
  resetExplanationConsistency,
  sessionExplanationSimilarity,
} from '@/ui/recommendations/explanationConsistency'

describe('explanationConsistency', () => {
  beforeEach(() => {
    resetExplanationConsistency()
  })

  it('scores high similarity for near-duplicate lines', () => {
    const score = explanationSimilarityScore(
      'Low HP — prioritize stabilization',
      'Low HP — prioritize stabilization augments',
    )
    expect(score).toBeGreaterThan(0.5)
  })

  it('penalizes repeated anchors in session', () => {
    recordRationaleOutput(['Low HP — prioritize stabilization'])
    recordRationaleOutput(['Low HP — prioritize stabilization'])
    expect(isRepetitiveAnchor('Low HP — prioritize stabilization')).toBe(true)
    expect(penalizeIfNearDuplicate('Low HP — prioritize stabilization')).toBeLessThan(0)
  })

  it('tracks session similarity average', () => {
    recordRationaleOutput(['Line A about tempo'])
    recordRationaleOutput(['Line A about tempo damage'])
    expect(sessionExplanationSimilarity()).toBeGreaterThan(0)
  })
})
