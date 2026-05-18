/**
 * Community Dragon raw asset URLs from Riot `ASSETS/...` paths in TFT JSON dumps.
 * @see scripts/lib/tftAssetPath.mjs
 */

import { normalizeCdragonPath } from "./tftAssetPath.mjs"

export const CD_RAW_BASE = "https://raw.communitydragon.org/latest/game/assets"

export function cdAssetUrl(squareIconPath) {
  return normalizeCdragonPath(squareIconPath)
}

/** Paths from cdragon `en_us.json` (often `ASSETS/UX/...` without the lol-game-data prefix). */
export function cdAssetUrlFromGamePath(iconPath) {
  return normalizeCdragonPath(iconPath)
}

/** CD raw hosts `.png` alongside `.tex` at the same path. */
export function cdTexUrlToPng(texOrPngUrl) {
  if (!texOrPngUrl || typeof texOrPngUrl !== "string") return null
  return normalizeCdragonPath(texOrPngUrl)
}

/** TFT17_Aatrox → 17 */
export function tftSetFromCharacterId(characterId) {
  const m = /^TFT(\d+)_/i.exec(characterId || "")
  return m ? parseInt(m[1], 10) : 0
}

/** Prefer Set17 paths; else highest Set\d+ in path */
export function setRankFromIconPath(p) {
  if (!p) return 0
  if (/Set17|TFT_Set17|TFT17_/i.test(p)) return 1000
  let max = 0
  const re = /Set(\d+)/gi
  let m
  while ((m = re.exec(p))) {
    max = Math.max(max, parseInt(m[1], 10))
  }
  return max
}
