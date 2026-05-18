const ROMAN_TIER: Record<string, string> = {
  '1': 'i',
  '2': 'ii',
  '3': 'iii',
}

/** PascalCase / snake fragment → lowercase snake segments */
function toSnakeSegments(value: string): string {
  return value
    .replace(/_combo$/i, '')
    .replace(/_/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.toLowerCase())
}

function suffixRomanTier(segments: string[]): string[] {
  if (segments.length === 0) return segments
  const last = segments[segments.length - 1]
  const digit = /^(.+?)([123])$/.exec(last)
  if (digit && ROMAN_TIER[digit[2]]) {
    const base = digit[1].replace(/_+$/, '')
    const out = segments.slice(0, -1)
    if (base) out.push(base)
    out.push(ROMAN_TIER[digit[2]])
    return out
  }
  const roman = /^(.*?)(i{1,3}|iv|v|vi{0,3})$/i.exec(last)
  if (roman && roman[2] && roman[1]) {
    const out = segments.slice(0, -1)
    if (roman[1]) out.push(roman[1])
    out.push(roman[2].toLowerCase())
    return out
  }
  return segments
}

function coreToSlug(core: string): string {
  const segments = suffixRomanTier(toSnakeSegments(core))
  return segments.join('_').replace(/_+/g, '_')
}

/**
 * Deterministic stable id from Riot apiName (e.g. TFT17_Augment_CyberneticBulk3 → tft17_cybernetic_bulk_iii).
 */
export function deriveCanonicalAugmentId(apiName: string, setFallback = 17): string {
  const trimmed = apiName.trim()
  if (!trimmed) return `tft${setFallback}_unknown`

  let set = setFallback
  let core = trimmed

  const setAugment = /^TFT(\d+)_Augment_(.+)$/i.exec(trimmed)
  if (setAugment) {
    set = Number(setAugment[1]) || setFallback
    core = setAugment[2]
  } else if (/^TFT_Augment_(.+)$/i.test(trimmed)) {
    core = trimmed.replace(/^TFT_Augment_/i, '')
  } else if (/^aug_/i.test(trimmed)) {
    return trimmed
      .replace(/^aug_/, `tft${set}_`)
      .toLowerCase()
      .replace(/[^a-z0-9_]+/g, '_')
      .replace(/_+/g, '_')
  } else if (!/^TFT/i.test(trimmed)) {
    const slug = trimmed
      .toLowerCase()
      .replace(/['\u2019\u0060\u00B4]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
    return `tft${set}_${slug || 'unknown'}`
  }

  const slug = coreToSlug(core)
  return `tft${set}_${slug || 'unknown'}`
}
