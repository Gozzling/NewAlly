import { encodePublicIconFilename } from "@/utils/publicAssetUrl"

/**
 * Augment icons are set-specific; we do not bundle Riot TFT augment art in-repo.
 * Place optional PNGs under `public/augment-icons/<slug>.png` (same slug rules as below).
 */
export function augmentIconSlug(name: string): string {
  return name.replace(/['\u2019\u0060\u00B4]/g, "").replace(/\s+/g, "").replace(/[^a-zA-Z0-9_-]/g, "")
}

export function augmentIconUrl(name: string): string {
  const fileBase = augmentIconSlug(name)
  return `/augment-icons/${encodePublicIconFilename(fileBase)}.png`
}
