import { unitIconSlug } from "@/utils/unitDisplay"
import { encodePublicIconFilename } from "@/utils/publicAssetUrl"

const CD_BASE = "https://raw.communitydragon.org/latest/game"

/**
 * Turn a Riot client path (`ASSETS/Maps/.../*.tex`) into a raw Community Dragon **PNG** URL.
 */
export function cdGameAssetUrl(assetPath: string | undefined | null): string | undefined {
  if (!assetPath || typeof assetPath !== "string") return undefined
  const idx = assetPath.indexOf("/ASSETS/")
  if (idx === -1) return undefined
  const rest = assetPath.slice(idx + "/ASSETS/".length)
  const urlPath = rest
    .split("/")
    .map((s) => s.toLowerCase())
    .join("/")
  return `${CD_BASE}/assets/${urlPath}`.replace(/\.tex$/i, ".png")
}

/** TFT trait art (slug may not match Riot internal filenames for every trait). */
export function traitIconUrl(traitName: string): string {
  const slug = traitName.toLowerCase().replace(/[^a-z0-9]/g, "")
  return `${CD_BASE}/assets/ux/traiticons/trait_icon_${slug}.tft_set17.png`
}

export function augmentIconUrl(augmentName: string): string {
  const slug = augmentName
    .toLowerCase()
    .replace(/['\u2019]/g, "")
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9]/g, "")
  return `${CD_BASE}/assets/maps/particles/tft/tftaugments/${slug}.png`
}

export function itemIconUrl(itemName: string, iconSlug?: string): string {
  const base = iconSlug ?? itemName
  const slug = base.toLowerCase().replace(/[^a-z0-9]/g, "")
  return `${CD_BASE}/assets/maps/particles/tft/item_icons/${slug}.png`
}

/** Local roster squares (`public/unit-icons`, `.png` slugs via {@link unitIconSlug}). */
export function unitIconUrl(unitName: string): string {
  return `/unit-icons/${encodePublicIconFilename(unitIconSlug(unitName))}.png`
}

export function unitSplashUrl(unitName: string): string {
  const slug = unitName.toLowerCase().replace(/[^a-z0-9]/g, "")
  return `${CD_BASE}/assets/ux/tft/championsplashes/${slug}.tft_set17.png`
}
