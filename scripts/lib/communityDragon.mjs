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
  return cdAssetPathToUrl(rest)
}

/** Paths from cdragon `en_us.json` (often `ASSETS/UX/...` without the lol-game-data prefix). */
export function cdAssetUrlFromGamePath(iconPath) {
  if (!iconPath || typeof iconPath !== "string") return null
  if (iconPath.includes("/lol-game-data/")) return cdAssetUrl(iconPath)
  let rest = iconPath.replace(/^\/+/, "")
  if (rest.startsWith("ASSETS/")) rest = rest.slice("ASSETS/".length)
  return cdAssetPathToUrl(rest)
}

function cdAssetPathToUrl(rest) {
  const urlPath = rest
    .split("/")
    .map((s) => s.toLowerCase())
    .join("/")
  return `${CD_RAW_BASE}/${urlPath}`
}

/** CD raw hosts `.png` alongside `.tex` at the same path. */
export function cdTexUrlToPng(texOrPngUrl) {
  if (!texOrPngUrl || typeof texOrPngUrl !== "string") return null
  if (/\.png$/i.test(texOrPngUrl)) return texOrPngUrl
  if (/\.tex$/i.test(texOrPngUrl)) return texOrPngUrl.replace(/\.tex$/i, ".png")
  return texOrPngUrl
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
