/**
 * Lowercase [a-z0-9] only — aligns TFT display names with API/GEP variants
 * (e.g. Kai'Sa vs Kaisa, Master Yi vs MasterYi).
 */
export function unitMatchKey(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '')
}

/** Slug for `/public/unit-icons/<slug>.png` from Data Dragon (see scripts/download-unit-icons.mjs). */
const ICON_SLUG_BY_MATCH_KEY: Record<string, string> = {
  kaisa: 'Kaisa',
  chogath: 'ChoGath',
  belveth: 'Belveth',
  reksai: 'RekSai',
}

export function unitIconSlug(displayName: string): string {
  const key = unitMatchKey(displayName)
  if (ICON_SLUG_BY_MATCH_KEY[key]) return ICON_SLUG_BY_MATCH_KEY[key]
  return displayName.replace(/['\u2019\u0060\u00B4]/g, "").replace(/\s+/g, "")
}

export function unitIconUrl(displayName: string): string {
  return `/unit-icons/${unitIconSlug(displayName)}.png`
}
