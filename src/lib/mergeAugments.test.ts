import { describe, expect, it } from 'vitest'
import type { Augment } from '@/data/augments'
import { mergeAugmentSources } from '@/lib/mergeAugments'
import type { TFTStaticAugment } from '@/types/tftStaticData'

const version = { set: 17, patch: '17.1', locale: 'en' }

describe('mergeAugmentSources', () => {
  const staticRow: TFTStaticAugment = {
    apiName: 'TFT17_Augment_TestAugment',
    name: 'Test Augment',
    description: 'Gain @PlayerHealth@ Health.',
    rawDescription: 'Gain @PlayerHealth@ Health.',
    tier: 'gold',
    associatedTraits: [],
    effects: { PlayerHealth: 5 },
    iconPath: null,
    iconUrl: null,
  }

  const bundled: Augment = {
    id: 'aug_legacy',
    apiName: 'TFT17_Augment_TestAugment',
    name: 'Legacy Name',
    tier: 'silver',
    description: 'bundled only',
    effect: 'bundled',
    bestComps: ['Comp A'],
    pickRate: 10,
    winRate: 51,
    avgPlacement: 4,
    synergies: [],
    counters: [],
    tags: ['bundled'],
  }

  const cdn: Augment = {
    id: 'aug_tft17_augment_testaugment',
    apiName: 'TFT17_Augment_TestAugment',
    name: 'CDN Test Augment',
    tier: 'gold',
    description: 'cdn formatted',
    rawDescription: 'Gain @PlayerHealth@ Health.',
    effects: { PlayerHealth: 8 },
    effect: 'cdn',
    bestComps: [],
    pickRate: 20,
    winRate: 55,
    avgPlacement: 3.5,
    synergies: [],
    counters: [],
    tags: ['cdn'],
    iconUrl: 'https://cdn.example/icon.png',
  }

  it('prefers CDN fields over static and bundled', () => {
    const merged = mergeAugmentSources({
      version,
      staticAugments: [staticRow],
      cdnAugments: [cdn],
      bundledAugments: [bundled],
    })
    const hit = merged.byApiName.get('tft17_augment_testaugment')
    expect(hit).toBeDefined()
    expect(hit?.canonicalId).toBe('tft17_test_augment')
    expect(hit?.name).toBe('CDN Test Augment')
    expect(hit?.source).toBe('cdn')
    expect(hit?.version).toEqual(version)
    expect(hit?.type).toBe('augment')
    expect(hit?.metadata?.sourceChain).toEqual(['bundled', 'static', 'cdn'])
    expect(hit?.metadata?.completeness?.hasEffects).toBe(true)
    expect(hit?.metadata?.completeness?.hasFormattedDescription).toBe(true)
    expect(hit?.metadata?.completeness?.hasStats).toBe(true)
  })
})
