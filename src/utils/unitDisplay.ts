/**
 * Lowercase [a-z0-9] only — aligns TFT display names with API/GEP variants
 * (e.g. Kai'Sa vs Kaisa, Master Yi vs MasterYi).
 */
import { getFallbackSetData } from '@/services/cdnDataService'
import { encodePublicIconFilename } from '@/utils/publicAssetUrl'

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

/** Resolve to canonical TFT roster name when the string matches a current-set unit. */
export function resolveCanonicalUnitName(displayName: string): string {
  const key = unitMatchKey(displayName)
  const hit = getFallbackSetData().champions.find((u) => unitMatchKey(u.name) === key)
  return hit?.name ?? displayName
}

export function unitIconSlug(displayName: string): string {
  const canonical = resolveCanonicalUnitName(displayName)
  const key = unitMatchKey(canonical)
  if (ICON_SLUG_BY_MATCH_KEY[key]) return ICON_SLUG_BY_MATCH_KEY[key]
  return canonical.replace(/['\u2019\u0060\u00B4]/g, '').replace(/\s+/g, '')
}

export function unitIconUrl(displayName: string): string {
  const fileBase = unitIconSlug(displayName)
  return `/unit-icons/${encodePublicIconFilename(fileBase)}.png`
}

/** Pinned League patch for champion squares when local TFT art is missing (e.g. guide-only names). */
const DDRAGON_CHAMPION_BASE = 'https://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion'

export function ddragonChampionSquareUrl(displayName: string): string {
  const slug = unitIconSlug(displayName)
  return `${DDRAGON_CHAMPION_BASE}/${encodeURIComponent(slug)}.png`
}

/** Prefer CDN/local roster icon; Data Dragon when not in current set. */
export function unitPortraitPrimaryUrl(displayName: string): string {
  const name = resolveCanonicalUnitName(displayName)
  const inRoster = getFallbackSetData().champions.some(
    (u) => unitMatchKey(u.name) === unitMatchKey(name),
  )
  if (inRoster) return unitIconUrl(name)
  return ddragonChampionSquareUrl(displayName)
}
