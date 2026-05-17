import { describe, expect, it, afterEach } from 'vitest'
import { createTFTDataCatalog, resetTFTDataCatalogCache } from './tftStaticData'

describe('createTFTDataCatalog', () => {
  afterEach(() => {
    resetTFTDataCatalogCache()
  })

  it('loads set 17 bundles with lookup helpers', () => {
    const data = createTFTDataCatalog()

    expect(data.meta.setNumber).toBe(17)
    expect(data.units.length).toBeGreaterThan(0)
    expect(data.traits.length).toBeGreaterThan(0)
    expect(data.items.length).toBeGreaterThan(0)
    expect(data.augments.length).toBeGreaterThan(0)

    const aatrox = data.getUnitByApiName('TFT17_Aatrox')
    expect(aatrox?.name).toBe('Aatrox')

    const anima = data.getTraitByApiName('TFT17_AnimaSquad')
    expect(anima?.name).toBe('Anima')

    const bf = data.getItemByIdOrApiName('TFT_Item_BFSword')
    expect(bf?.category).toBe('component')

    const ie = data.getItemByIdOrApiName('TFT_Item_InfinityEdge')
    expect(ie?.name).toBe('Infinity Edge')

    const bfByName = data.getItemByIdOrApiName('B.F. Sword')
    expect(bfByName?.apiName).toBe('TFT_Item_BFSword')

    const boon = data.getGodBoonByApiName('TFT17_Augment_AhriGodAugment')
    expect(boon?.name).toBe("Ahri's Boon")
    expect(data.getAugmentByApiName('TFT17_Augment_AhriGodAugment')).toBeUndefined()
  })

  it('returns undefined for unknown keys', () => {
    const data = createTFTDataCatalog()
    expect(data.getUnitByApiName('TFT99_NotReal')).toBeUndefined()
    expect(data.getItemByIdOrApiName('not-an-item')).toBeUndefined()
  })
})
