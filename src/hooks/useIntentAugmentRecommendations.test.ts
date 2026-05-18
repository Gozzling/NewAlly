import { beforeEach, describe, expect, it } from 'vitest'
import {
  computeBlendedIntent,
  inferRecommendationIntentFromGameState,
  resetOverlayIntentMemory,
} from '@/hooks/useIntentAugmentRecommendations'
import type { TftGameState } from '@/types/tft'

function gs(partial: Partial<TftGameState> & { hp?: number; gold?: number }): TftGameState {
  return {
    isInGame: true,
    gold: partial.gold ?? 20,
    stage: '4-1',
    round_type: partial.round_type ?? 'combat',
    roster: [{ name: 'Player', isLocalPlayer: true, health: partial.hp ?? 80 }],
    shop: [],
    board: [],
    bench: [],
    items: [],
    augments: [],
    ...partial,
  } as TftGameState
}

describe('inferRecommendationIntentFromGameState', () => {
  beforeEach(() => {
    resetOverlayIntentMemory()
  })

  it('prefers stabilization at low HP', () => {
    expect(inferRecommendationIntentFromGameState(gs({ hp: 25, gold: 30 }))).toBe('stabilization')
  })

  it('sticks to prior intent when scores are ambiguous', () => {
    const t0 = 1_000_000
    const first = inferRecommendationIntentFromGameState(gs({ hp: 25, gold: 30 }), t0)
    const second = inferRecommendationIntentFromGameState(gs({ hp: 26, gold: 31 }), t0 + 2000)
    expect(first).toBe('stabilization')
    expect(second).toBe(first)
  })

  it('exposes weighted blend label when two intents compete', () => {
    const blend = computeBlendedIntent(gs({ hp: 45, gold: 52 }))
    expect(blend.weights.stabilization).toBeDefined()
    expect(blend.weights.econ).toBeDefined()
    expect(blend.label).toMatch(/\+|stabilization|econ/)
  })

  it('switches after sticky window when signal is strong', () => {
    const t0 = 1_000_000
    inferRecommendationIntentFromGameState(gs({ hp: 80, gold: 20 }), t0)
    const later = inferRecommendationIntentFromGameState(gs({ hp: 25, gold: 30 }), t0 + 20_000)
    expect(later).toBe('stabilization')
  })
})
