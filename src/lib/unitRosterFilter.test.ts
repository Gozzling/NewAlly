import { describe, expect, it } from 'vitest'
import { isPlayableRosterUnit } from './unitRosterFilter'

describe('isPlayableRosterUnit', () => {
  it('excludes cosmic PVE minions', () => {
    expect(isPlayableRosterUnit('TFT17_PVE_Minion', 'Cosmic Squid')).toBe(false)
    expect(isPlayableRosterUnit('TFT17_PVE_Gromp', 'Cosmic Gromp')).toBe(false)
  })

  it('keeps cosmic elder dragon', () => {
    expect(isPlayableRosterUnit('TFT17_PVE_ElderDragon', 'Cosmic Elder Dragon')).toBe(true)
  })

  it('excludes timebreaker core prop unit', () => {
    expect(isPlayableRosterUnit('TFT17_TimebreakerCore', 'TimebreakerCore')).toBe(false)
    expect(isPlayableRosterUnit('TFT17_TimebreakerCore', 'Timebreaker Core')).toBe(false)
  })

  it('keeps normal roster units', () => {
    expect(isPlayableRosterUnit('TFT17_Aatrox', 'Aatrox')).toBe(true)
  })
})
