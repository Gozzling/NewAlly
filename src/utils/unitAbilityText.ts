import { formatTftText, roundTftWhole } from '@/utils/formatTftText'

/** Community Dragon ability `value` arrays: indices 1–3 are 1★ / 2★ / 3★. */
export const TFT_ABILITY_STAR_INDICES = [1, 2, 3] as const

export interface TFTAbilityVariable {
  name: string
  value: number | number[]
}

export function starTierValues(values: number[]): [number, number, number] {
  if (values.length >= 4) {
    return [
      values[TFT_ABILITY_STAR_INDICES[0]] ?? values[0] ?? 0,
      values[TFT_ABILITY_STAR_INDICES[1]] ?? values[1] ?? 0,
      values[TFT_ABILITY_STAR_INDICES[2]] ?? values[2] ?? 0,
    ]
  }
  if (values.length === 3) {
    return [values[0] ?? 0, values[1] ?? 0, values[2] ?? 0]
  }
  const v = values[0] ?? 0
  return [v, v, v]
}

function formatScalarForVar(name: string, n: number): string {
  const key = name.toLowerCase()
  if (
    (key.includes('percent') || key.includes('ratio') || key.endsWith('hp')) &&
    n > 0 &&
    n <= 1
  ) {
    return `${roundTftWhole(n * 100)}%`
  }
  return String(roundTftWhole(n))
}

function slashStarLine(values: number[]): string {
  return starTierValues(values)
    .map((n) => roundTftWhole(n))
    .join('/')
}

/** Build a map for {@link formatTftText} from CD `ability.variables`. */
export function abilityVariableMap(variables: TFTAbilityVariable[]): Record<string, unknown> {
  const map: Record<string, unknown> = {}

  for (const row of variables) {
    const name = row.name?.trim()
    if (!name) continue
    const val = row.value
    if (Array.isArray(val)) {
      const slash = slashStarLine(val)
      map[name] = slash
      const [s1, s2, s3] = starTierValues(val)
      map[`${name}_1`] = s1
      map[`${name}_2`] = s2
      map[`${name}_3`] = s3
    } else if (typeof val === 'number' && Number.isFinite(val)) {
      map[name] = val
    }
  }

  aliasModifiedAbilityTokens(map)
  return map
}

/** Map tooltip `Modified*` tokens to base scaling vars when CD omits them. */
function aliasModifiedAbilityTokens(map: Record<string, unknown>): void {
  const pick = (...keys: string[]): string | undefined => {
    for (const k of keys) {
      if (map[k] != null && map[k] !== '') return String(map[k])
    }
    return undefined
  }

  if (!map.ModifiedHeal) {
    const heal = pick('HealAP', 'HealHP', 'Heal')
    if (heal) map.ModifiedHeal = heal
  }
  if (!map.ModifiedDamage) {
    const dmg = pick('DamageAD', 'DamageAP', 'Damage', 'PrimaryDamage', 'SpellDamage')
    if (dmg) map.ModifiedDamage = dmg
  }
  if (!map.ModifiedNovaDamage) {
    const nova = pick('NovaDamage', 'NOVADamage', 'DamageAD')
    if (nova) map.ModifiedNovaDamage = nova
  }
}

export function preprocessAbilityDescription(raw: string): string {
  return String(raw || '')
    .replace(/<ShowIf[^>]*>/gi, '')
    .replace(/<\/ShowIf[^>]*>/gi, '')
    .replace(/<\/?scaleLevel[^>]*>/gi, '')
    .replace(/\s+enabled=[^\s>]+/gi, '')
    .replace(/\s+alternate=[^\s>]+/gi, '')
}

/** Full ability blurb with star-tier numbers resolved from CD variables. */
export function formatUnitAbilityDescription(
  raw: string | undefined | null,
  variables: TFTAbilityVariable[] | undefined | null,
): string {
  const prepped = preprocessAbilityDescription(raw ?? '')
  const map = abilityVariableMap(variables ?? [])
  return formatTftText(prepped, map)
}

/** Short scaling line for the ability card (e.g. `80/120/180 AD`). */
export function abilityDamageLine(variables: TFTAbilityVariable[] | undefined | null): string {
  if (!variables?.length) return ''

  const scored: { score: number; line: string }[] = []

  for (const row of variables) {
    const name = row.name?.trim()
    if (!name) continue
    const key = name.toLowerCase()
    if (!/(damage|heal|shield|snip|bolt|beam)/i.test(key)) continue
    if (key.includes('modifier') || key.includes('tooltip') || key.includes('nova')) continue

    const val = row.value
    if (!Array.isArray(val) || val.length === 0) continue

    const [s1, s2, s3] = starTierValues(val)
    const line = `${formatScalarForVar(name, s1)}/${formatScalarForVar(name, s2)}/${formatScalarForVar(name, s3)}`
    let suffix = ''
    if (key.includes('ad') || key.includes('attackdamage')) suffix = ' AD'
    else if (key.includes('ap') || key.includes('spell')) suffix = ' AP'
    else if (key.includes('hp') && s1 <= 1) suffix = ' max HP'

    const score =
      (key.includes('damage') ? 10 : 0) +
      (key.includes('primary') ? 5 : 0) +
      (key === 'damagead' || key === 'damageap' ? 8 : 0) +
      (key.includes('heal') ? 4 : 0)

    scored.push({ score, line: `${line}${suffix}`.trim() })
  }

  scored.sort((a, b) => b.score - a.score)
  const top = scored[0]?.line
  return top ?? ''
}

export function mapCdragonAbilityVariables(
  variables: unknown[] | undefined,
): TFTAbilityVariable[] {
  if (!Array.isArray(variables)) return []
  const out: TFTAbilityVariable[] = []
  for (const v of variables) {
    if (!v || typeof v !== 'object') continue
    const name = (v as { name?: string }).name
    const value = (v as { value?: number | number[] }).value
    if (typeof name !== 'string' || !name.trim()) continue
    if (typeof value === 'number' && Number.isFinite(value)) {
      out.push({ name: name.trim(), value })
    } else if (Array.isArray(value) && value.every((x) => typeof x === 'number')) {
      out.push({ name: name.trim(), value })
    }
  }
  return out
}
