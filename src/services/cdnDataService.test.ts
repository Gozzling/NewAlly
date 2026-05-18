import { describe, it, expect } from 'vitest'
import { formatTftText } from '@/utils/formatTftText'

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

  it('should unwrap TFTKeyword and strip rules blocks', () => {
    const text =
      'Gain <TFTKeyword>Precision</TFTKeyword>.<br><br><rules>Recommended Roles: Marksman</rules><br>Deal damage.'
    expect(formatTftText(text, {})).toBe('Gain Precision.\n\nDeal damage.')
  })

  it('should resolve {{TFT_Keyword_*}} to a short label when not in effects', () => {
    const text = 'Bonus.<br><br>{{TFT_Keyword_Precision}}'
    expect(formatTftText(text, {})).toBe('Bonus.\n\nPrecision')
  })

  it('should humanize {{TFT17_*}} state keys (e.g. The Groove)', () => {
    const text = 'Enters {{TFT17_SpaceGroove_TheGroove}} for @GrooveDuration@ seconds.'
    const effects = { GrooveDuration: 2.5 }
    expect(formatTftText(text, effects)).toBe('Enters The Groove for 3 seconds.')
  })

  it('should strip set-only only-item loc keys', () => {
    const text = 'Power.<br><br>{{TFT13_ChemBaronOnlyItem}}'
    expect(formatTftText(text, {})).toBe('Power.')
  })

  it('should unwrap magicDamage and remove empty scale parens', () => {
    const text =
      'Snip for <magicDamage>@ModifiedDamage@ (%i:scaleAP%)</magicDamage> magic damage.'
    const effects = { ModifiedDamage: 200 }
    expect(formatTftText(text, effects)).toBe('Snip for 200 magic damage.')
  })

  it('should round non-percent effect numbers to whole (half-up)', () => {
    expect(formatTftText('Wait @Sec@s.', { Sec: 2.4 })).toBe('Wait 2s.')
    expect(formatTftText('Wait @Sec@s.', { Sec: 2.5 })).toBe('Wait 3s.')
    expect(formatTftText('Bonus @N@.', { N: 10.6 })).toBe('Bonus 11.')
  })
})
