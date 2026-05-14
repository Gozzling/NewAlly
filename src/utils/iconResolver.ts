import {
  traitIconFallbackUrls,
  augmentIconUrl as cdnAugmentIconUrl,
  itemIconUrl as cdnItemIconUrl,
  itemIconFallbackUrls,
} from "./cdnIcons"
import { unitIconUrl as localUnitIconUrl, ddragonChampionSquareUrl } from "./unitDisplay"
import { augmentIconUrl as localAugmentIconUrl } from "./augmentDisplay"
import { itemIconUrl as localItemIconUrl } from "./itemDisplay"
import tftAugmentCdnUrls from "@/data/tftAugmentCdnUrls.json"

export type IconKind = "unit" | "trait" | "augment" | "item"

const AUGMENT_CDN_BY_NAME = tftAugmentCdnUrls as Record<string, string | null>

function dedupeUrls(urls: readonly string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const u of urls) {
    const t = typeof u === "string" ? u.trim() : ""
    if (!t || seen.has(t)) continue
    seen.add(t)
    out.push(t)
  }
  return out
}

export function unitPortraitUrls(name: string, providedUrl?: string | null): string[] {
  const list: string[] = []
  if (providedUrl) list.push(providedUrl)
  list.push(localUnitIconUrl(name))
  list.push(ddragonChampionSquareUrl(name))
  return dedupeUrls(list)
}

export function augmentPortraitUrls(name: string, providedUrl?: string | null): string[] {
  const list: string[] = []
  if (providedUrl) list.push(providedUrl)
  const curated = AUGMENT_CDN_BY_NAME[name]
  if (typeof curated === "string" && curated.length > 0) list.push(curated)
  list.push(localAugmentIconUrl(name))
  list.push(cdnAugmentIconUrl(name))
  return dedupeUrls(list)
}

export function itemPortraitUrls(name: string, providedUrl?: string | null, iconSlug?: string): string[] {
  const list: string[] = []
  if (providedUrl) list.push(providedUrl)
  list.push(localItemIconUrl(name, iconSlug))
  list.push(cdnItemIconUrl(name, iconSlug))
  list.push(...itemIconFallbackUrls(name, iconSlug))
  return dedupeUrls(list)
}

export function traitPortraitUrls(name: string, providedUrl?: string | null): string[] {
  const list: string[] = []
  if (providedUrl) list.push(providedUrl)
  list.push(...traitIconFallbackUrls(name))
  return dedupeUrls(list)
}
