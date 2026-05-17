import { describe, expect, it } from 'vitest'
import { cdTexUrlToPng, gameIconDisplayUrl } from './cdIconDisplay'

describe('cdIconDisplay', () => {
  it('converts CD tex URLs to png', () => {
    expect(
      cdTexUrlToPng(
        'https://raw.communitydragon.org/latest/game/assets/maps/tft/icons/augments/hexcore/foo.tex',
      ),
    ).toBe(
      'https://raw.communitydragon.org/latest/game/assets/maps/tft/icons/augments/hexcore/foo.png',
    )
  })

  it('prefers CD url over local fallback', () => {
    expect(gameIconDisplayUrl('https://example.com/a.tex', '/local.png')).toBe(
      'https://example.com/a.png',
    )
  })

  it('falls back to local png when CD url missing', () => {
    expect(gameIconDisplayUrl(null, '/local.png')).toBe('/local.png')
  })
})
