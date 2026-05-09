/** Filename slug for Data Dragon–sourced item PNGs (matches scripts/download-item-icons.mjs). */
export function itemIconSlug(displayName: string): string {
  return displayName.replace(/['\u2019\u0060\u00B4]/g, "").replace(/\s+/g, "")
}

/** Optional slug override (e.g. category placeholders). */
export function itemIconUrl(displayName: string, iconSlug?: string): string {
  const base = iconSlug ?? displayName
  return `/item-icons/${itemIconSlug(base)}.png`
}
