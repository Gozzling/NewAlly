import { describe, expect, it } from 'vitest'
import type { Augment } from '@/data/augments'
import {
  enrichFormattedAugmentsFromStore,
  rankStoreAugmentsForIntent,
} from '@/lib/gameDataAugmentRecommendations'

function sampleAugment(overrides: Partial<Augment> = {}): Augment {
  return {
    id: 'aug_tft17_test',
    apiName: 'TFT17_Augment_Test',
    name: 'Test Augment',
    tier: 'gold',
    description: 'Gain gold and interest each round.',
    effect: 'Gain gold',
    bestComps: [],
    pickRate: 0,
    winRate: 0,
    avgPlacement: 0,
    synergies: [],
    counters: [],
    tags: ['cdn'],
    iconUrl: 'https://cdn.example/icon.png',
    ...overrides,
  }
}

describe('gameDataAugmentRecommendations', () => {
  it('ranks store augments by intent keywords', () => {
    const augments = [
      sampleAugment({ name: 'Gold Interest', description: 'gold interest economy' }),
      sampleAugment({
        id: 'aug_heal',
        apiName: 'TFT17_Augment_Heal',
        name: 'Big Heal',
        description: 'heal shield armor durability',
      }),
    ]
    const econ = rankStoreAugmentsForIntent(augments, 'econ', 2)
    expect(econ[0]?.name).toBe('Gold Interest')
    expect(econ[0]?.iconUrl).toContain('cdn.example')
    expect(econ[0]?.hasExplanation).toBe(true)

    const stabilize = rankStoreAugmentsForIntent(augments, 'stabilization', 1)
    expect(stabilize[0]?.name).toBe('Big Heal')
  })

  it('enriches formatted picks with CDN icon and description', () => {
    const store = [sampleAugment()]
    const formatted = enrichFormattedAugmentsFromStore(
      [
        {
          canonicalId: 'tft17_test_augment',
          name: 'Test Augment',
          confidence: 0.5,
          summaryLines: [],
          topReasons: [],
          hasExplanation: false,
          displayRole: 'primary',
        },
      ],
      store,
    )
    expect(formatted[0]?.iconUrl).toContain('cdn.example')
    expect(formatted[0]?.description).toContain('gold')
    expect(formatted[0]?.summaryLines.length).toBeGreaterThan(0)
  })
})
