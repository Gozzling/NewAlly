import { normalizeAugmentDisplayName } from '@/shared/augmentParse'

/** Collapse whitespace and trim — display-name keys. */
export function normalizeAugmentWhitespace(s: string): string {
  return s.replace(/\s+/g, ' ').trim()
}

/** Lowercase + strip apostrophes for fuzzy name lookup. */
export function normalizeAugmentNameKey(s: string): string {
  return normalizeAugmentWhitespace(s)
    .toLowerCase()
    .replace(/['\u2019\u0060\u00B4]/g, '')
}

/** apiName / GEP id keys — case-insensitive, no spaces. */
export function normalizeAugmentApiKey(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, '')
}

/**
 * Normalize any augment identifier (apiName, GEP id, or display name)
 * into a display label for lookup fallbacks.
 */
export function normalizeAugmentIdentifier(identifier: string): string {
  const trimmed = normalizeAugmentWhitespace(identifier)
  if (!trimmed) return ''
  if (/^TFT/i.test(trimmed) || /augment/i.test(trimmed)) {
    return normalizeAugmentDisplayName(trimmed)
  }
  return trimmed
}
