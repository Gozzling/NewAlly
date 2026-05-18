import { describe, expect, it } from 'vitest'
import {
  buildRecommendationRationale,
  explainEntityRecommendation,
} from '@/engine/recommendations/explainability'
import type { CanonicalAugment } from '@/types/canonicalAugment'
import type { EntityRecommendationScore } from '@/engine/recommendations/scoring'

const augment: CanonicalAugment = {
  type: 'augment',
  canonicalId: 'tft17_test',
  apiName: 'TFT17_Augment_Test',
  name: 'Tempo Strike',
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

const score: EntityRecommendationScore = {
  entity: augment,
  score: 0.72,
  calibratedConfidence: 0.68,
  intent: 'tempo',
  factors: {
    base: 0.7,
    sampleSize: 60,
    patchStability: 1,
    winRateDelta: 0.55,
    derivedPenalty: 0,
    feedbackAdjustment: 0.02,
  },
}

describe('explainability', () => {
  it('explains entity with signal sources and intent alignment', () => {
    const ex = explainEntityRecommendation(augment.canonicalId, score)
    expect(ex.signalSources.length).toBeGreaterThan(0)
    expect(ex.intentAlignment.intent).toBe('tempo')
    expect(ex.summaryLines.length).toBeGreaterThan(0)
  })

  it('builds rationale for ranked set', () => {
    const rationale = buildRecommendationRationale({
      intent: 'tempo',
      patch: '17.1',
      set: 17,
      entities: [score],
    })
    expect(rationale.intent).toBe('tempo')
    expect(rationale.entitySummaries).toHaveLength(1)
    expect(rationale.topReasons.length).toBeGreaterThan(0)
  })
})
