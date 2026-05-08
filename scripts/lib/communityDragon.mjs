/**
 * Community Dragon raw asset URLs from `squareIconPath` fields in Riot TFT JSON dumps.
 * Pattern: strip `/lol-game-data/assets/ASSETS/`, lowercase path segments, prefix raw CD host.
 */

export const CD_RAW_BASE = "https://raw.communitydragon.org/latest/game/assets"

export function cdAssetUrl(squareIconPath) {
  if (!squareIconPath || typeof squareIconPath !== "string") return null
  const idx = squareIconPath.indexOf("/ASSETS/")
  if (idx === -1) return null
  const rest = squareIconPath.slice(idx + "/ASSETS/".length)
  const urlPath = rest
    .split("/")
    .map((s) => s.toLowerCase())
    .join("/")
  return `${CD_RAW_BASE}/${urlPath}`
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
