import { describe, expect, it } from 'vitest'
import {
  applyStabilityControls,
  confidenceDecayForPatch,
  sampleSizeConfidenceScale,
  smoothFeedbackDelta,
} from '@/engine/recommendations/stability'

describe('stability controls', () => {
  it('decays confidence across patch distance', () => {
    expect(confidenceDecayForPatch('17.1', '17.1')).toBe(1)
    expect(confidenceDecayForPatch('17.0', '17.2')).toBeLessThan(1)
  })

  it('scales sample size below threshold', () => {
    expect(sampleSizeConfidenceScale(5, 'core')).toBeLessThan(1)
    expect(sampleSizeConfidenceScale(100, 'core')).toBe(1)
  })

  it('smooths large feedback deltas', () => {
    const raw = 0.2
    expect(smoothFeedbackDelta(raw, 1)).toBeLessThan(raw)
    expect(smoothFeedbackDelta(raw, 100)).toBeLessThan(smoothFeedbackDelta(raw, 1))
  })

  it('caps score when minimum data guards fail', () => {
    const result = applyStabilityControls({
      rawScore: 0.9,
      sampleSize: 0,
      hasStats: false,
    })
    expect(result.calibratedScore).toBeLessThanOrEqual(0.55)
    expect(result.dataGuard.reasons).toContain('insufficient_sample')
  })
})
