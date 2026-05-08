/** Filename slug for Data Dragon–sourced item PNGs (matches scripts/download-item-icons.mjs). */
export function itemIconSlug(displayName: string): string {
  return displayName.replace(/['\u2019\u0060\u00B4]/g, "").replace(/\s+/g, "")
}

export function itemIconUrl(displayName: string): string {
  return `/item-icons/${itemIconSlug(displayName)}.png`
}
