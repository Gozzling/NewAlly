import { describe, expect, it } from 'vitest'
import {
  abilityDamageLine,
  formatUnitAbilityDescription,
  mapCdragonAbilityVariables,
} from './unitAbilityText'

const AATROX_VARS = mapCdragonAbilityVariables([
  { name: 'HealHP', value: [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1] },
  { name: 'HealAP', value: [150, 300, 375, 575, 775, 180, 180] },
  { name: 'DamageAD', value: [200, 80, 120, 180, 300, 600, 600] },
  { name: 'DamagePercentArmor', value: [1, 1.8, 2.7, 4.05, 6.9, 3, 3] },
  { name: 'NOVAModifier', value: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5] },
])

const AATROX_RAW =
  'Heal <scaleHealth>@ModifiedHeal@ (%i:scaleAP%)</scaleHealth>, then deal <physicalDamage>@ModifiedDamage@ (%i:scaleAD%%i:scaleArmor%)</physicalDamage> physical damage to the current target.<br><br><ShowIf.TFT17_DRX_CapstoneActive><scaleLevel>N.O.V.A. Strike: Cleave the battlefield, briefly knocking up all enemies and dealing <physicalDamage>@ModifiedNovaDamage@</physicalDamage> physical damage.</scaleLevel></ShowIf.TFT17_DRX_CapstoneActive>'

describe('formatUnitAbilityDescription', () => {
  it('resolves star-tier damage and heal from CD variables', () => {
    const text = formatUnitAbilityDescription(AATROX_RAW, AATROX_VARS)
    expect(text).toContain('300/375/575')
    expect(text).toContain('80/120/180')
    expect(text).not.toMatch(/\(\s*\)/)
    expect(text).not.toContain('@')
    expect(text).toContain('N.O.V.A. Strike')
  })
})

describe('abilityDamageLine', () => {
  it('prefers primary AD damage scaling', () => {
    expect(abilityDamageLine(AATROX_VARS)).toBe('80/120/180 AD')
  })
})
