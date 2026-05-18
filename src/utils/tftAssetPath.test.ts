import { describe, expect, it } from 'vitest'
import { normalizeCdragonPath } from './tftAssetPath'

describe('normalizeCdragonPath', () => {
  it('converts ASSETS tile paths to lowercase CDN png', () => {
    const url = normalizeCdragonPath(
      'ASSETS/Characters/TFT17_Aatrox/HUD/TFT17_Aatrox_Square.TFT_Set17.tex',
    )
    expect(url).toBe(
      'https://raw.communitydragon.org/latest/game/assets/characters/tft17_aatrox/hud/tft17_aatrox_square.tft_set17.png',
    )
  })

  it('converts augment hexcore paths', () => {
    const url = normalizeCdragonPath(
      'ASSETS/Maps/TFT/Icons/Augments/Hexcore/Bonk_I.TFT_Set17.tex',
    )
    expect(url).toMatch(/\.png$/i)
    expect(url).not.toMatch(/\.tex$/i)
  })

  it('normalizes existing tex http urls', () => {
    expect(
      normalizeCdragonPath(
        'https://raw.communitydragon.org/latest/game/assets/foo/bar.tft_set17.tex',
      ),
    ).toBe('https://raw.communitydragon.org/latest/game/assets/foo/bar.tft_set17.png')
  })
})
