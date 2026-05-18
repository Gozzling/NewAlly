import { beforeEach, describe, expect, it } from 'vitest'
import {
  getRelationship,
  getRelationshipsFromSource,
  registerRelationship,
  resetRelationshipRegistry,
} from '@/lib/canonicalRelationshipRegistry'

describe('canonicalRelationshipRegistry', () => {
  beforeEach(() => {
    resetRelationshipRegistry()
  })

  it('indexes relationships by source and pair', () => {
    registerRelationship({
      sourceId: 'tft17_test',
      targetId: 'TFT17_Trait_X',
      relationship: 'synergy',
    })
    expect(getRelationshipsFromSource('tft17_test')).toHaveLength(1)
    expect(
      getRelationship('tft17_test', 'TFT17_Trait_X', 'synergy')?.relationship,
    ).toBe('synergy')
  })
})
