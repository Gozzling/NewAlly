/**
 * Canonical Community Dragon asset URL builder for runtime transforms.
 * Build scripts use `scripts/lib/tftAssetPath.mjs` (keep in sync).
 */
export const CD_GAME_BASE = 'https://raw.communitydragon.org/latest/game'

/** Riot `ASSETS/...` path or full URL → CDN `.png` URL. */
export function normalizeCdragonPath(rawPath: string | undefined | null): string | undefined {
  if (!rawPath || typeof rawPath !== 'string') return undefined

  if (/^https?:\/\//i.test(rawPath)) {
    return rawPath.replace(/\.tex$/i, '.png')
  }

  let norm = rawPath.replace(/\\/g, '/')
  const lower = norm.toLowerCase()

  if (lower.includes('/lol-game-data/')) {
    const idx = lower.indexOf('/assets/')
    if (idx === -1) return undefined
    norm = norm.slice(idx + '/assets/'.length)
  } else if (norm.startsWith('ASSETS/')) {
    norm = norm.slice('ASSETS/'.length)
  } else if (norm.startsWith('assets/')) {
    norm = norm.slice('assets/'.length)
  }

  const urlPath = norm
    .split('/')
    .map((s) => s.toLowerCase())
    .join('/')

  return `${CD_GAME_BASE}/assets/${urlPath}`.replace(/\.tex$/i, '.png')
}

/** @deprecated Use {@link normalizeCdragonPath}. */
export function cdGameAssetUrl(assetPath: string | undefined | null): string | undefined {
  return normalizeCdragonPath(assetPath)
}
