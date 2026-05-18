import { describe, it, expect } from 'vitest'
import { transformAugments, transformSetAugmentsFromCdn } from '@/services/cdnDataService'
import { formatTftText } from '@/utils/formatTftText'

describe('transformSetAugmentsFromCdn', () => {
  function row(
    apiName: string,
    icon: string,
    name = 'Test Augment',
    tier?: string,
  ): { apiName: string; name: string; icon: string; desc: string; tier?: string } {
    return { apiName, name, icon, desc: 'Does something.', ...(tier ? { tier } : {}) }
  }

  it('maps every api in setBlock.augments when item row exists (no local set filter)', () => {
    const items = new Map([
      [
        'TFT10_Augment_CrashTestDummies',
        row(
          'TFT10_Augment_CrashTestDummies',
          'ASSETS/Maps/TFT/Icons/Augments/Hexcore/CrashTestDummies_II.TFT_Set10.tex',
        ),
      ],
      [
        'TFT17_Augment_AnimaSquad_Commander',
        row(
          'TFT17_Augment_AnimaSquad_Commander',
          'ASSETS/Maps/TFT/Icons/Augments/Hexcore/AnimaCommander_II.TFT_Set17.tex',
          'Anima Commander',
        ),
      ],
    ])

    const out = transformSetAugmentsFromCdn(
      {
        augments: ['TFT10_Augment_CrashTestDummies', 'TFT17_Augment_AnimaSquad_Commander'],
      },
      items,
    )

    expect(out.map((a) => a.apiName).sort()).toEqual(
      ['TFT10_Augment_CrashTestDummies', 'TFT17_Augment_AnimaSquad_Commander'].sort(),
    )
  })

  it('uses CDN tier field when present, otherwise infers from icon path', () => {
    const items = new Map([
      [
        'TFT17_Augment_NasusCarry',
        row(
          'TFT17_Augment_NasusCarry',
          'ASSETS/Maps/TFT/Icons/Augments/Hexcore/Bonk_I.TFT_Set17.tex',
          'Bonk!',
        ),
      ],
      [
        'TFT17_Augment_AnimaSquad_Commander',
        row(
          'TFT17_Augment_AnimaSquad_Commander',
          'ASSETS/Maps/TFT/Icons/Augments/Hexcore/AnimaCommander_II.TFT_Set17.tex',
          'Anima Commander',
          'gold',
        ),
      ],
      [
        'TFT_Augment_EndlessConflagration',
        row(
          'TFT_Augment_EndlessConflagration',
          'ASSETS/Maps/TFT/Icons/Augments/Hexcore/EndlessConflagration_III.TFT_Set17.tex',
          'Endless Conflagration',
          'prismatic',
        ),
      ],
    ])

    const out = transformSetAugmentsFromCdn(
      {
        augments: [
          'TFT17_Augment_NasusCarry',
          'TFT17_Augment_AnimaSquad_Commander',
          'TFT_Augment_EndlessConflagration',
        ],
      },
      items,
    )

    const byApi = Object.fromEntries(out.map((a) => [a.apiName, a.tier]))
    expect(byApi['TFT17_Augment_NasusCarry']).toBe('silver')
    expect(byApi['TFT17_Augment_AnimaSquad_Commander']).toBe('gold')
    expect(byApi['TFT_Augment_EndlessConflagration']).toBe('prismatic')
  })

  it('skips apis with no matching item row', () => {
    const out = transformSetAugmentsFromCdn({ augments: ['TFT17_Augment_Missing'] }, new Map())
    expect(out).toHaveLength(0)
  })
})

describe('transformAugments', () => {
  it('delegates to transformSetAugmentsFromCdn', () => {
    const items = new Map([
      [
        'TFT17_Augment_Test',
        {
          apiName: 'TFT17_Augment_Test',
          name: 'Test',
          icon: 'ASSETS/Maps/TFT/Icons/Augments/Hexcore/Test_II.TFT_Set17.tex',
          desc: 'Test',
        },
      ],
    ])
    const out = transformAugments(['TFT17_Augment_Test'], items)
    expect(out).toHaveLength(1)
    expect(out[0].apiName).toBe('TFT17_Augment_Test')
  })
})

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
