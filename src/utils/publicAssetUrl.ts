/**
 * Single path segment for URLs under `public/` (unit-icons, item-icons, augment-icons).
 * Raw `%` must not appear unescaped — Vite's static middleware uses `decodeURI` and throws
 * URIError on malformed sequences (e.g. `%` not followed by two hex digits).
 */
export function encodePublicIconFilename(baseName: string): string {
  return encodeURIComponent(baseName).replace(/%2F/gi, "_")
}
