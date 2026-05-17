/** Community Dragon serves `.png` at the same path as in-game `.tex` assets. */
export function cdTexUrlToPng(texOrPngUrl: string | null | undefined): string | null {
  if (!texOrPngUrl) return null
  if (/\.png$/i.test(texOrPngUrl)) return texOrPngUrl
  if (/\.tex$/i.test(texOrPngUrl)) return texOrPngUrl.replace(/\.tex$/i, '.png')
  return texOrPngUrl
}

/** Prefer CD asset URL from static JSON; fall back to bundled `public/*-icons` PNG. */
export function gameIconDisplayUrl(
  cdIconUrl: string | null | undefined,
  localPngUrl: string,
): string {
  return cdTexUrlToPng(cdIconUrl) ?? localPngUrl
}
