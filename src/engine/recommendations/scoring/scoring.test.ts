import { beforeEach, describe, expect, it } from 'vitest'
import { resetRecommendationFeedbackStore, recordRecommendationFeedback } from '@/lib/recommendationFeedbackStore'
import {
  applyConfidenceCalibration,
  scoreEntityRecommendation,
  scoreRelationshipRecommendation,
} from '@/engine/recommendations/scoring'
import type { CanonicalAugment } from '@/types/canonicalAugment'
import type { CanonicalRelationship } from '@/types/canonicalRelationship'

const augment: CanonicalAugment = {
  type: 'augment',
  canonicalId: 'tft17_test',
  apiName: 'TFT17_Augment_Test',
  name: 'Test Augment',
  set: 17,
  patch: '17.1',
  locale: 'en',
  version: { set: 17, patch: '17.1', locale: 'en' },
  tier: 'gold',
  stats: { pickRate: 12, winRate: 54, avgPlacement: 3.8 },
  metadata: {
    completeness: { hasEffects: true, hasFormattedDescription: true, hasStats: true },
    sourceChain: ['static'],
  },
}

describe('recommendation scoring', () => {
  beforeEach(() => {
    resetRecommendationFeedbackStore()
  })

  it('calibrates confidence with sample size and derived penalty', () => {
    const high = applyConfidenceCalibration({
      rawScore: 0.7,
      sampleSize: 100,
      patchStability: 1,
      derived: false,
    })
    const low = applyConfidenceCalibration({
      rawScore: 0.7,
      sampleSize: 0,
      patchStability: 0.5,
      derived: true,
    })
    expect(high).toBeGreaterThan(low)
  })

  it('scores entities with intent affinity', () => {
    const tempo = scoreEntityRecommendation(augment, { intent: 'tempo', currentPatch: '17.1' })
    const econ = scoreEntityRecommendation(augment, { intent: 'econ', currentPatch: '17.1' })
    expect(tempo.score).toBeGreaterThan(0)
    expect(tempo.factors.sampleSize).toBeGreaterThan(0)
    expect(econ.score).toBeGreaterThan(0)
  })

  it('adjusts relationship score from feedback', () => {
    const rel: CanonicalRelationship = {
      sourceId: 'tft17_a',
      targetId: 'tft17_b',
      relationship: 'synergy',
      derived: true,
      signals: [{ type: 'synergy', confidence: 0.7, patch: '17.1', sampleSize: 50 }],
    }
    const base = scoreRelationshipRecommendation(rel, { currentPatch: '17.1', sourceWinRate: 54 })
    recordRecommendationFeedback({
      type: 'AUGMENT_HELPFUL',
      timestampMs: Date.now(),
      canonicalId: 'tft17_a',
      relationshipKey: 'tft17_a→synergy→tft17_b',
    })
    const boosted = scoreRelationshipRecommendation(rel, { currentPatch: '17.1', sourceWinRate: 54 })
    expect(boosted.score).toBeGreaterThanOrEqual(base.score)
    expect(boosted.factors.derivedPenalty).toBeGreaterThan(0)
  })
})
