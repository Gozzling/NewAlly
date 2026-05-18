import { describe, expect, it } from 'vitest'
import { enrichChampionIcons, resolveUnitIconUrl } from './resolveUnitIcon'

describe('resolveUnitIconUrl', () => {
  it('uses seed icon when runtime row omitted iconUrl', () => {
    const url = resolveUnitIconUrl({
      id: 'u_aatrox',
      name: 'Aatrox',
      cost: 1,
      traits: [],
      ability: { name: 'A', description: '', damage: '' },
      stats: { hp: 0, ad: 0, ap: 0, armor: 0, mr: 0, atkSpeed: 0, range: 1 },
      bestItems: [],
      bestComps: [],
      tier: 'B',
    })
    expect(url).toMatch(/tft17_aatrox.*\.png$/i)
    expect(url).not.toMatch(/\.tex$/i)
  })

  it('enriches champions missing iconUrl', () => {
    const [enriched] = enrichChampionIcons([
      {
        id: 'u_jinx',
        name: 'Jinx',
        cost: 1,
        traits: [],
        ability: { name: 'A', description: '', damage: '' },
        stats: { hp: 0, ad: 0, ap: 0, armor: 0, mr: 0, atkSpeed: 0, range: 1 },
        bestItems: [],
        bestComps: [],
        tier: 'B',
      },
    ])
    expect(enriched.iconUrl).toMatch(/\.png$/i)
  })
})
