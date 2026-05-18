/** @see src/utils/unitAbilityText.ts — keep in sync for sync-all */

const STAR_INDICES = [1, 2, 3]

function roundTftWhole(n) {
  if (!Number.isFinite(n)) return n
  return Math.round(n)
}

function starTierValues(values) {
  if (values.length >= 4) {
    return [values[1] ?? 0, values[2] ?? 0, values[3] ?? 0]
  }
  if (values.length === 3) return [values[0] ?? 0, values[1] ?? 0, values[2] ?? 0]
  const v = values[0] ?? 0
  return [v, v, v]
}

export function abilityVariableMap(variables) {
  const map = {}
  for (const row of variables) {
    const name = row.name?.trim()
    if (!name) continue
    const val = row.value
    if (Array.isArray(val)) {
      const [s1, s2, s3] = starTierValues(val)
      map[name] = `${roundTftWhole(s1)}/${roundTftWhole(s2)}/${roundTftWhole(s3)}`
    } else if (typeof val === 'number' && Number.isFinite(val)) {
      map[name] = val
    }
  }
  if (!map.ModifiedHeal && map.HealAP) map.ModifiedHeal = map.HealAP
  if (!map.ModifiedDamage && map.DamageAD) map.ModifiedDamage = map.DamageAD
  if (!map.ModifiedNovaDamage && map.DamageAD) map.ModifiedNovaDamage = map.DamageAD
  return map
}

export function formatUnitAbilityDescription(raw, variables) {
  const map = abilityVariableMap(variables ?? [])
  let s = String(raw || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<ShowIf[^>]*>/gi, '')
    .replace(/<\/ShowIf[^>]*>/gi, '')
    .replace(/<\/?scaleLevel[^>]*>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/%i:[A-Za-z0-9_]+%/gi, '')
  s = s.replace(/@([A-Za-z0-9_*.:]+)@/g, (_, token) => {
    let key = token
    if (key.includes(':')) key = key.split(':').pop() || key
    if (Object.prototype.hasOwnProperty.call(map, key)) return String(map[key])
    return ''
  })
  while (/\(\s*\)/.test(s)) s = s.replace(/\(\s*\)/g, '')
  return s.replace(/\s+([.,;:!?])/g, '$1').replace(/\n{3,}/g, '\n\n').trim()
}

export function abilityDamageLine(variables) {
  if (!variables?.length) return ''
  let best = null
  for (const row of variables) {
    const name = row.name?.trim()
    if (!name) continue
    const key = name.toLowerCase()
    if (!/damage|heal/.test(key) || /modifier|tooltip|nova/.test(key)) continue
    if (!Array.isArray(row.value) || row.value.length === 0) continue
    const [s1, s2, s3] = starTierValues(row.value)
    const line = `${roundTftWhole(s1)}/${roundTftWhole(s2)}/${roundTftWhole(s3)}`
    const suffix = key.includes('ad') ? ' AD' : key.includes('ap') ? ' AP' : ''
    const score = key.includes('damagead') ? 18 : key.includes('damage') ? 10 : 4
    if (!best || score > best.score) best = { score, line: line + suffix }
  }
  return best?.line ?? ''
}
