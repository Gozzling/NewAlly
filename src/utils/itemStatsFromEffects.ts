import { roundTftWhole } from '@/utils/formatTftText'

const EFFECT_STAT_SKIP = new Set([
  'MinUnits',
  'MaxUnits',
  'HealthThreshold',
  'ShieldDuration',
  'ShieldHealthPercent',
  'Cooldown',
  'Duration',
  'NumAttacks',
  'NumTargets',
  'HexRadius',
  'Damage',
  'ModifiedDamage',
])

type StatLine = { keys: string[]; label: (v: number) => string }

const STAT_LINES: StatLine[] = [
  { keys: ['AD', 'AttackDamage', 'BonusAD'], label: (v) => `+${pctOrWhole(v)}% Attack Damage` },
  { keys: ['AP', 'AbilityPower', 'BonusAP'], label: (v) => `+${pctOrWhole(v)}% Ability Power` },
  { keys: ['AS', 'AttackSpeed', 'BonusAttackSpeed'], label: (v) => `+${flatOrPct(v)} Attack Speed` },
  { keys: ['Health', 'BonusHealth', 'MaxHealth'], label: (v) => `+${flatOrPct(v)} Health` },
  { keys: ['Armor', 'BonusArmor'], label: (v) => `+${flatOrPct(v)} Armor` },
  { keys: ['MagicResist', 'MR', 'BonusMR'], label: (v) => `+${flatOrPct(v)} Magic Resist` },
  { keys: ['Mana', 'BonusMana'], label: (v) => `+${flatOrPct(v)} Mana` },
  { keys: ['ManaRegen', 'BonusManaRegen'], label: (v) => `+${flatOrPct(v)} Mana Regen` },
  { keys: ['CritChance', 'BonusCritChance'], label: (v) => `+${pctOrWhole(v)}% Crit Chance` },
  { keys: ['Omnivamp', 'StatOmnivamp', 'LifeSteal'], label: (v) => `+${pctOrWhole(v)}% Omnivamp` },
]

function pctOrWhole(v: number): string {
  if (v > 0 && v <= 1) return String(roundTftWhole(v * 100))
  return String(roundTftWhole(v))
}

function flatOrPct(v: number): string {
  if (v > 0 && v <= 1) return `${roundTftWhole(v * 100)}%`
  return String(roundTftWhole(v))
}

function pickEffectValue(
  effects: Record<string, number | undefined>,
  keys: string[],
): number | undefined {
  for (const key of keys) {
    const v = effects[key]
    if (typeof v === 'number' && v !== 0) return v
  }
  return undefined
}

/** Build +AD / +AP style lines from Riot item `effects` for guide tooltips. */
export function buildItemStatsFromEffects(
  effects: Record<string, number | undefined> | undefined,
): string {
  if (!effects) return ''
  const lines: string[] = []
  const used = new Set<string>()

  for (const row of STAT_LINES) {
    const v = pickEffectValue(effects, row.keys)
    if (v === undefined) continue
    lines.push(row.label(v))
    for (const k of row.keys) used.add(k)
  }

  for (const [rawKey, rawVal] of Object.entries(effects)) {
    if (used.has(rawKey) || EFFECT_STAT_SKIP.has(rawKey)) continue
    if (typeof rawVal !== 'number' || rawVal === 0) continue
    const lk = rawKey.toLowerCase()
    if (
      lk.includes('threshold') ||
      lk.includes('duration') ||
      lk.includes('cooldown') ||
      lk.includes('count') ||
      lk.includes('radius') ||
      lk.includes('damage') ||
      lk.includes('store') ||
      lk.includes('tooltip')
    ) {
      continue
    }
    const humanKey = rawKey.replace(/([A-Z])/g, ' $1').trim()
    const displayVal = rawVal > 0 && rawVal <= 1 ? `${roundTftWhole(rawVal * 100)}%` : String(roundTftWhole(rawVal))
    lines.push(`${displayVal} ${humanKey}`)
  }

  return lines.join('\n')
}
