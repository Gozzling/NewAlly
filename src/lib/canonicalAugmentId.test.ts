import { describe, expect, it } from 'vitest'
import { deriveCanonicalAugmentId } from '@/lib/canonicalAugmentId'

describe('deriveCanonicalAugmentId', () => {
  it('derives set-scoped ids from Riot apiNames', () => {
    expect(deriveCanonicalAugmentId('TFT9_Augment_CyberneticBulk3')).toBe(
      'tft9_cybernetic_bulk_iii',
    )
    expect(deriveCanonicalAugmentId('TFT17_Augment_AnimaSquad_Commander')).toBe(
      'tft17_anima_squad_commander',
    )
  })

  it('is deterministic and lowercase', () => {
    const a = deriveCanonicalAugmentId('TFT17_Augment_BacklineBlueprint')
    const b = deriveCanonicalAugmentId('TFT17_Augment_BacklineBlueprint')
    expect(a).toBe(b)
    expect(a).toBe(a.toLowerCase())
  })
})
