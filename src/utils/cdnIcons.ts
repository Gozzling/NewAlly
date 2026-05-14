import { unitIconSlug } from "@/utils/unitDisplay"
import { encodePublicIconFilename } from "@/utils/publicAssetUrl"
import { CURRENT_TFT_SET_NUMBER } from "@/meta/tftCurrentSet"

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

const traitSlug = (traitName: string) => traitName.toLowerCase().replace(/[^a-z0-9]/g, "")

/**
 * Community Dragon trait filenames vary (`trait_icon_17_foo.tft_set17.png`, `trait_icon_foo.png`, …).
 * Try several patterns when {@link Synergy.iconUrl} from game data is missing.
 */
export function traitIconFallbackUrls(traitName: string): string[] {
  const slug = traitSlug(traitName)
  if (!slug) return []
  const n = CURRENT_TFT_SET_NUMBER
  return [
    `${CD_BASE}/assets/ux/traiticons/trait_icon_${n}_${slug}.tft_set${n}.png`,
    `${CD_BASE}/assets/ux/traiticons/trait_icon_${slug}.tft_set${n}.png`,
    `${CD_BASE}/assets/ux/traiticons/trait_icon_${n}_${slug}.png`,
    `${CD_BASE}/assets/ux/traiticons/trait_icon_${slug}.png`,
  ]
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

/** Extra CD paths — display-name slugs rarely match a single on-disk name for TFT items. */
export function itemIconFallbackUrls(itemName: string, iconSlug?: string): string[] {
  const base = iconSlug ?? itemName
  const slug = base.toLowerCase().replace(/[^a-z0-9]/g, "")
  if (!slug) return []
  const set = CURRENT_TFT_SET_NUMBER
  return [
    `${CD_BASE}/assets/maps/particles/tft/item_icons/standard/tft_item_${slug}.png`,
    `${CD_BASE}/assets/maps/particles/tft/item_icons/standard/${slug}.png`,
    `${CD_BASE}/assets/maps/tft/icons/items/tft_item_${slug}.png`,
    `${CD_BASE}/assets/maps/tft/icons/items/tft${set}_${slug}.png`,
    `${CD_BASE}/assets/maps/tft/icons/items/${slug}.png`,
  ]
}

/** Local roster squares (`public/unit-icons`, `.png` slugs via {@link unitIconSlug}). */
export function unitIconUrl(unitName: string): string {
  return `/unit-icons/${encodePublicIconFilename(unitIconSlug(unitName))}.png`
}

export function unitSplashUrl(unitName: string): string {
  const slug = unitName.toLowerCase().replace(/[^a-z0-9]/g, "")
  const n = CURRENT_TFT_SET_NUMBER
  return `${CD_BASE}/assets/ux/tft/championsplashes/${slug}.tft_set${n}.png`
}
