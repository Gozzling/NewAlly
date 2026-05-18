import { beforeEach, describe, expect, it } from 'vitest'
import {
  detectScoreVarianceDrift,
  getDriftMonitorState,
  recordIntentQuery,
  resetDriftMonitor,
} from '@/engine/recommendations/monitoring'
import type { EntityRecommendationScore } from '@/engine/recommendations/scoring'
import type { CanonicalAugment } from '@/types/canonicalAugment'

function row(confidence: number): EntityRecommendationScore {
  const entity: CanonicalAugment = {
    type: 'augment',
    canonicalId: `tft17_${confidence}`,
    name: 'Test',
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
      feedbackAdjustment: 0,
    },
  }
}

describe('driftMonitor', () => {
  beforeEach(() => {
    resetDriftMonitor()
  })

  it('records score snapshots and detects variance drift', () => {
    for (let i = 0; i < 5; i++) {
      recordIntentQuery('tempo', [row(0.2 + i * 0.15), row(0.9 - i * 0.1)], [], '17.1')
    }
    const state = getDriftMonitorState()
    expect(state.scoreHistory.length).toBeGreaterThan(0)
    expect(detectScoreVarianceDrift('tempo', 0.001)).toBe(true)
  })
})
