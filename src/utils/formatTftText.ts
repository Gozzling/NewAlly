function flattenEffectMap(effects: unknown): Record<string, number | string> {
  const out: Record<string, number | string> = {}
  if (!effects || typeof effects !== 'object' || Array.isArray(effects)) return out
  for (const [k, v] of Object.entries(effects as Record<string, unknown>)) {
    if (typeof v === 'number' || typeof v === 'string') out[k] = v
    else if (typeof v === 'boolean') out[k] = v ? '1' : '0'
  }
  return out
}

/** Nearest whole number for UI (fractional part ≥ 0.5 rounds up). */
export function roundTftWhole(n: number): number {
  if (!Number.isFinite(n)) return n
  return Math.round(n)
}

function formatEffectDisplayValue(key: string, v: number | string): string {
  if (typeof v === 'string') return v
  const k = key.toLowerCase()
  if (
    (k.includes('percent') || k.includes('pct') || k.endsWith('ratio') || k.includes('increase')) &&
    v > 0 &&
    v <= 1
  ) {
    return `${roundTftWhole(v * 100)}%`
  }
  return String(roundTftWhole(v))
}

function titleCaseWords(s: string): string {
  return s
    .split(/\s+/)
    .map((w) => (w.length === 0 ? '' : w[0].toUpperCase() + w.slice(1).toLowerCase()))
    .filter(Boolean)
    .join(' ')
}

function humanizeLocFragment(raw: string): string {
  const spaced = raw.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2')
  return titleCaseWords(spaced.trim())
}

function humanizeDoubleBraceKey(key: string): string {
  const k = key.trim()
  if (!k) return ''
  if (/onlyitem$/i.test(k) || /_only_/i.test(k)) return ''
  if (/^TFT_Keyword_/i.test(k)) return humanizeLocFragment(k.replace(/^TFT_Keyword_/i, ''))
  const stripped = k.replace(/^TFT\d+_/i, '')
  const parts = stripped.split('_').filter(Boolean)
  const last = parts[parts.length - 1] || stripped
  return humanizeLocFragment(last)
}

const TFT_UNWRAP_TAGS = [
  'TFTKeyword',
  'TFTRadiantItemBonus',
  'spellPassive',
  'spellActive',
  'magicDamage',
  'physicalDamage',
  'trueDamage',
  'scaleShimmer',
  'scaleHealth',
  'scaleShield',
  'scaleArmor',
  'scaleMR',
  'scaleMana',
  'scaleAttackSpeed',
  'scaleAP',
  'scaleAD',
  'size',
  'status',
  'spellName',
  'spellSubName',
] as const

function stripTftRulesBlocks(s: string): string {
  return s.replace(/<rules\b[^>]*>[\s\S]*?<\/rules>/gi, '')
}

function unwrapKnownPairedTags(input: string): string {
  let s = input
  for (let i = 0; i < 14; i++) {
    const prev = s
    for (const tag of TFT_UNWRAP_TAGS) {
      const re = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`, 'gi')
      s = s.replace(re, '$1')
    }
    if (s === prev) break
  }
  return s
}

function normalizeRowTags(s: string): string {
  return s.replace(/<\/row>/gi, '\n').replace(/<row\b[^>]*>/gi, '\n')
}

function resolveDoubleBraces(s: string, map: Record<string, number | string>): string {
  return s.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, inner: string) => {
    const key = inner.trim()
    if (Object.prototype.hasOwnProperty.call(map, key)) {
      return formatEffectDisplayValue(key, map[key])
    }
    for (const [mk, mv] of Object.entries(map)) {
      if (mk.toLowerCase() === key.toLowerCase()) return formatEffectDisplayValue(mk, mv)
    }
    return humanizeDoubleBraceKey(key)
  })
}

function finalizeTftWhitespace(s: string): string {
  const lines = s.replace(/\r\n?/g, '\n').split('\n')
  const out: string[] = []
  for (const line of lines) {
    const t = line.replace(/[ \t]+/g, ' ').replace(/\s+,/g, ',').trim()
    if (t.length > 0) out.push(t)
  }
  return out.join('\n\n').trim()
}

/** Strip HTML / Riot rich text, resolve `@Key@` and `{{loc}}`, preserve readable paragraphs. */
export function formatTftText(raw: string | undefined | null, effects: unknown): string {
  let s = String(raw || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/&nbsp;/gi, ' ')
  s = stripTftRulesBlocks(s)
  s = unwrapKnownPairedTags(s)
  s = normalizeRowTags(s)
  s = s.replace(/<[^>]+>/g, ' ')
  s = s.replace(/%i:[A-Za-z0-9_]+%/gi, '')
  s = s.replace(/\*\*/g, '')
  const map = flattenEffectMap(effects)
  s = resolveDoubleBraces(s, map)
  s = s.replace(/@([A-Za-z0-9_*.:]+)@/g, (_, token: string) => {
    let key = token
    let multiplier = 1

    if (key.includes('*')) {
      const parts = key.split('*')
      key = parts[0]
      multiplier = parseFloat(parts[1]) || 1
    }

    if (key.includes(':')) {
      key = key.split(':').pop() || key
    }

    if (!Object.prototype.hasOwnProperty.call(map, key)) {
      const m = key.match(/(\d+)$/)
      if (m) {
        const suffix = m[1]
        if (suffix === '100' || suffix === '10') {
          const stem = key.slice(0, -suffix.length)
          if (Object.prototype.hasOwnProperty.call(map, stem)) {
            key = stem
            multiplier = parseFloat(suffix)
          }
        }
      }
    }

    const tryKeys = [key, key.replace(/_TOOLTIPONLY$/i, ''), key.replace(/_TOOLTIP$/i, '')]
    for (const tk of tryKeys) {
      if (Object.prototype.hasOwnProperty.call(map, tk)) {
        const v = map[tk]
        if (v === undefined) return ''
        const numericVal = typeof v === 'number' ? v * multiplier : v
        return formatEffectDisplayValue(tk, numericVal)
      }
    }

    const lower = key.toLowerCase()
    for (const [mk, mv] of Object.entries(map)) {
      if (
        mk.toLowerCase() === lower ||
        mk.toLowerCase().replace(/_tooltiponly$/i, '') === lower.replace(/_tooltiponly$/i, '')
      ) {
        const numericVal = typeof mv === 'number' ? mv * multiplier : mv
        return formatEffectDisplayValue(mk, numericVal)
      }
    }
    return ''
  })
  s = s.replace(/@([A-Za-z0-9_*.:]+)@/g, '')
  while (/\(\s*\)/.test(s)) s = s.replace(/\(\s*\)/g, '')
  s = s.replace(/\s+([.,;:!?])/g, '$1')
  return finalizeTftWhitespace(s)
}
