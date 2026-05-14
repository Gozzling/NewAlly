import { CURRENT_TFT_SET_NUMBER } from "@/meta/tftCurrentSet"
import { unitIconSlug } from "@/utils/unitDisplay"
import { encodePublicIconFilename } from "@/utils/publicAssetUrl"

const CD_BASE = "https://raw.communitydragon.org/latest/game"

/**
 * Turn a Riot client path (`ASSETS/Maps/.../*.tex`) into a raw Community Dragon **PNG** URL.
 */
export function cdGameAssetUrl(assetPath: string | undefined | null): string | undefined {
  if (!assetPath || typeof assetPath !== "string") return undefined
  const norm = assetPath.replace(/\\/g, "/")
  const lower = norm.toLowerCase()
  const idx = lower.indexOf("/assets/")
  if (idx === -1) return undefined
  const rest = norm.slice(idx + "/assets/".length)
  const urlPath = rest
    .split("/")
    .map((s) => s.toLowerCase())
    .join("/")
  return `${CD_BASE}/assets/${urlPath}`.replace(/\.tex$/i, ".png")
}

/** TFT trait art on CD: `trait_icon_<set>_<slug>.tft_set<set>.png` (e.g. trait_icon_17_rogue.tft_set17.png). */
export function traitIconUrl(traitName: string): string {
  const slug = traitName.toLowerCase().replace(/[^a-z0-9]/g, "")
  const set = CURRENT_TFT_SET_NUMBER
  return `${CD_BASE}/assets/ux/traiticons/trait_icon_${set}_${slug}.tft_set${set}.png`
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
  const set = CURRENT_TFT_SET_NUMBER
  return `${CD_BASE}/assets/ux/tft/championsplashes/${slug}.tft_set${set}.png`
}
