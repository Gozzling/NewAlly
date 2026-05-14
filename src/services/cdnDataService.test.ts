import { describe, it, expect } from 'vitest'
import { formatTftText } from './cdnDataService'

describe('formatTftText', () => {
  it('should handle basic tokens', () => {
    const text = 'Deal @Damage@ magic damage.'
    const effects = { Damage: 100 }
    expect(formatTftText(text, effects)).toBe('Deal 100 magic damage.')
  })

  it('should handle multipliers with *100', () => {
    const text = 'AS: @AS*100@%'
    const effects = { AS: 0.5 }
    expect(formatTftText(text, effects)).toBe('AS: 50%')
  })

  it('should handle complex CDragon tokens with TFTUnitProperty.: prefix', () => {
    const text = 'The Groove: @TFTUnitProperty.:TFT17_SpaceGroove_AS*100@'
    const effects = { TFT17_SpaceGroove_AS: 0.5 }
    expect(formatTftText(text, effects)).toBe('The Groove: 50')
  })

  it('should handle numeric suffixes like DamageStore100', () => {
    const text = 'Store @DamageStore100@% of damage dealt.'
    const effects = { DamageStore: 0.2 }
    expect(formatTftText(text, effects)).toBe('Store 20% of damage dealt.')
  })

  it('should handle multiple tokens and strip unresolvable ones', () => {
    const text = 'Store @DamageStore100@%... reduced by @HexFalloff100@% for each hex... @Unknown@'
    const effects = { DamageStore: 0.2, HexFalloff: 0.05 }
    expect(formatTftText(text, effects)).toBe('Store 20%... reduced by 5% for each hex...')
  })

  it('should handle @Key*100@ and multipliers', () => {
    const text = 'Regen: @TFTUnitProperty.:TFT17_SpaceGroove_HealthRegen*100@'
    const effects = { TFT17_SpaceGroove_HealthRegen: 0.02 }
    expect(formatTftText(text, effects)).toBe('Regen: 2')
  })
})
