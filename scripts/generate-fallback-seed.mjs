#!/usr/bin/env node
/**
 * Builds src/data/fallback-seed.json from data/tft-static/en (run after parse-tft-static).
 */
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { abilityDamageLine, formatUnitAbilityDescription } from './lib/unitAbilityText.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const STATIC_EN = path.join(ROOT, 'data/tft-static/en')
const OUT = path.join(ROOT, 'src/data/fallback-seed.json')

async function readJson(rel) {
  const raw = await fs.readFile(path.join(STATIC_EN, rel), 'utf8')
  return JSON.parse(raw)
}

function unitIdFromApi(apiName) {
  const core = String(apiName).replace(/^TFT\d+_/i, '')
  return `u_${core.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`
}

function synId(name) {
  return (
    'syn_' +
    String(name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '')
  )
}

function clampCost(n) {
  const c = Number.isFinite(n) ? Math.round(n) : 1
  return Math.min(5, Math.max(1, c || 1))
}

function mapUnitToRuntime(su) {
  const vars = su.ability?.variables ?? []
  const raw = su.ability?.description || su.description || ''
  const description =
    vars.length > 0 ? formatUnitAbilityDescription(raw, vars) : raw
  const damage = vars.length > 0 ? abilityDamageLine(vars) || '—' : '—'

  return {
    id: unitIdFromApi(su.apiName),
    apiName: su.apiName,
    name: su.name,
    cost: clampCost(su.cost),
    traits: su.traits ?? [],
    ability: {
      name: su.ability?.name ?? 'Ability',
      description,
      damage,
    },
    stats: {
      hp: su.stats?.hp ?? 0,
      ad: su.stats?.damage ?? 0,
      ap: 0,
      armor: su.stats?.armor ?? 0,
      mr: su.stats?.magicResist ?? 0,
      atkSpeed: su.stats?.attackSpeed ?? 0,
      range: su.stats?.range ?? 1,
    },
    bestItems: [],
    bestComps: [],
    tier: 'B',
    ...(su.iconUrl ? { iconUrl: su.iconUrl } : {}),
  }
}

function mapTraitToRuntime(tr) {
  const thresholds = (tr.thresholds ?? [])
    .filter((t) => typeof t.minUnits === 'number' && t.minUnits > 0)
    .map((t) => ({
      count: t.minUnits,
      effect: Object.entries(t.variables ?? {})
        .slice(0, 4)
        .map(([k, v]) => `${k}: ${v}`)
        .join(' · ') || 'Tier bonus',
    }))
    .sort((a, b) => a.count - b.count)

  if (thresholds.length === 0) thresholds.push({ count: 1, effect: 'Active' })

  return {
    id: synId(tr.name),
    name: tr.name,
    description: tr.description || tr.name,
    thresholds,
    bestUnits: [],
    bestComps: [],
    counters: [],
    type: 'hybrid',
    ...(tr.iconUrl ? { iconUrl: tr.iconUrl } : {}),
  }
}

function mapAugmentToRuntime(aug) {
  const tier =
    aug.tier === 'prismatic' || aug.tier === 'gold' || aug.tier === 'silver'
      ? aug.tier
      : 'gold'
  const description = aug.description || aug.rawDescription || aug.name
  return {
    id: `aug_${String(aug.apiName).replace(/[^a-zA-Z0-9]+/g, '_').toLowerCase()}`,
    apiName: aug.apiName,
    name: aug.name,
    tier,
    description,
    rawDescription: aug.rawDescription ?? aug.description,
    effects: aug.effects ?? {},
    effect: (description || aug.name).slice(0, 160),
    bestComps: [],
    pickRate: 0,
    winRate: 0,
    avgPlacement: 0,
    synergies: aug.associatedTraits ?? [],
    counters: [],
    tags: ['seed'],
    ...(aug.iconUrl ? { iconUrl: aug.iconUrl } : {}),
  }
}

function mapItemToRuntime(item) {
  return {
    name: item.name,
    category: item.category === 'component' ? 'core' : item.category === 'finished' ? 'core' : item.category,
    stats: '',
    effect: item.description || item.name,
    components: null,
    tags: [item.category, ...(item.tags ?? [])].filter(Boolean),
    tier: 'B',
    bestOn: [],
    ...(item.iconUrl ? { iconUrl: item.iconUrl } : {}),
  }
}

async function main() {
  const meta = await readJson('meta.json')
  const units = await readJson('units.json')
  const traits = await readJson('traits.json')
  const augments = await readJson('augments.json')
  const godBoons = await readJson('godBoons.json')
  const components = await readJson('items/components.json')
  const finished = await readJson('items/finished.json')
  const radiants = await readJson('items/radiants.json')
  const artifacts = await readJson('items/artifacts.json')

  const catalogItems = [
    ...components.map((r) => ({ ...r, category: 'component' })),
    ...finished.map((r) => ({ ...r, category: 'finished' })),
    ...radiants.map((r) => ({ ...r, category: 'radiant' })),
    ...artifacts.map((r) => ({ ...r, category: 'artifact' })),
  ]

  const seed = {
    setNumber: meta.setNumber,
    meta,
    champions: units.map(mapUnitToRuntime),
    traits: traits.map(mapTraitToRuntime),
    items: catalogItems.map(mapItemToRuntime),
    augments: augments.map(mapAugmentToRuntime),
    godBoons,
    catalog: {
      units,
      traits,
      items: catalogItems,
      augments,
    },
  }

  await fs.writeFile(OUT, JSON.stringify(seed, null, 2) + '\n', 'utf8')
  console.log(`Wrote ${OUT} (set ${meta.setNumber})`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
