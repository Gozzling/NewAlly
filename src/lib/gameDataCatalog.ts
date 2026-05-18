import type { Augment } from '@/data/augments'
import type { ItemGuideEntry } from '@/data/itemGuideCatalog'
import type { Synergy } from '@/data/synergies'
import type { Unit } from '@/data/units'
import type { GameDataState } from '@/store/useAppStore'
import type { FallbackSeed } from '@/types/fallbackSeed'
import { resolveUnitIconUrl } from '@/utils/resolveUnitIcon'
import type {
  TFTDataCatalog,
  TFTItemCategory,
  TFTStaticAugment,
  TFTStaticItem,
  TFTStaticTrait,
  TFTStaticUnit,
} from '@/types/tftStaticData'

function normKey(value: string): string {
  return value.trim().toLowerCase()
}

function indexByApiName<T extends { apiName: string }>(rows: T[]): Map<string, T> {
  const map = new Map<string, T>()
  for (const row of rows) {
    map.set(row.apiName, row)
    map.set(normKey(row.apiName), row)
  }
  return map
}

function indexItemsByName(items: TFTStaticItem[]): Map<string, TFTStaticItem> {
  const map = new Map<string, TFTStaticItem>()
  for (const item of items) {
    const key = normKey(item.name)
    if (!map.has(key)) map.set(key, item)
  }
  return map
}

function unitApiName(unit: Unit, setNumber: number): string {
  if (unit.id.startsWith('TFT')) return unit.id
  const core = unit.id.replace(/^u_/, '').replace(/_/g, '')
  const pascal = core.replace(/\b\w/g, (c) => c.toUpperCase())
  return `TFT${setNumber}_${pascal}`
}

function unitToStatic(unit: Unit, setNumber: number): TFTStaticUnit {
  const apiName = unitApiName(unit, setNumber)
  return {
    apiName,
    name: unit.name,
    description: unit.ability.description,
    cost: unit.cost,
    traits: unit.traits,
    ability: {
      name: unit.ability.name,
      description: unit.ability.description,
      iconPath: null,
      iconUrl: unit.iconUrl ?? null,
    },
    stats: {
      armor: unit.stats.armor,
      attackSpeed: unit.stats.atkSpeed,
      critChance: 0.25,
      critMultiplier: 1.4,
      damage: unit.stats.ad,
      hp: unit.stats.hp,
      initialMana: 0,
      magicResist: unit.stats.mr,
      mana: 0,
      range: unit.stats.range,
    },
    role: null,
    iconPath: null,
    iconUrl: resolveUnitIconUrl(unit),
  }
}

function traitToStatic(trait: Synergy, setNumber: number): TFTStaticTrait {
  const apiName = `TFT${setNumber}_${trait.name.replace(/[^a-zA-Z0-9]/g, '')}`
  return {
    apiName,
    name: trait.name,
    description: trait.description,
    iconPath: null,
    iconUrl: trait.iconUrl ?? null,
    thresholds: trait.thresholds.map((t) => ({
      minUnits: t.count,
      maxUnits: null,
      style: null,
      variables: {},
    })),
  }
}

function augmentToStatic(aug: Augment): TFTStaticAugment {
  const apiName = aug.apiName ?? aug.id
  return {
    apiName,
    name: aug.name,
    description: aug.description,
    rawDescription: aug.rawDescription ?? aug.description,
    tier: aug.tier,
    associatedTraits: aug.synergies ?? [],
    effects: aug.effects ?? {},
    iconPath: null,
    iconUrl: aug.iconUrl ?? null,
  }
}

function guideItemCategory(category: ItemGuideEntry['category']): TFTItemCategory {
  if (category === 'artifact') return 'artifact'
  if (category === 'core') return 'finished'
  return 'finished'
}

function itemToStatic(item: ItemGuideEntry): TFTStaticItem {
  const apiName = `TFTItem_${item.name.replace(/[^a-zA-Z0-9]/g, '')}`
  return {
    apiName,
    name: item.name,
    description: item.effect,
    composition: [],
    from: null,
    tags: item.tags,
    unique: false,
    associatedTraits: [],
    category: guideItemCategory(item.category),
    iconPath: null,
    iconUrl: item.iconUrl ?? null,
  }
}

function hasRuntimeRows(gameData: GameDataState): boolean {
  return (
    (gameData.champions?.length ?? 0) > 0 ||
    (gameData.traits?.length ?? 0) > 0 ||
    (gameData.items?.length ?? 0) > 0 ||
    (gameData.augments?.length ?? 0) > 0
  )
}

function buildCatalog(
  meta: FallbackSeed['meta'],
  units: TFTStaticUnit[],
  traits: TFTStaticTrait[],
  items: TFTStaticItem[],
  augments: TFTStaticAugment[],
  godBoons: FallbackSeed['godBoons'],
): TFTDataCatalog {
  const unitByApi = indexByApiName(units)
  const traitByApi = indexByApiName(traits)
  const itemByApi = indexByApiName(items)
  const itemByName = indexItemsByName(items)
  const augmentByApi = indexByApiName(augments)
  const godBoonByApi = indexByApiName(godBoons)

  const itemsByCategory: Record<TFTItemCategory, TFTStaticItem[]> = {
    component: [],
    finished: [],
    radiant: [],
    artifact: [],
  }
  for (const item of items) {
    itemsByCategory[item.category].push(item)
  }

  return {
    meta,
    units,
    traits,
    items,
    itemsByCategory,
    augments,
    godBoons,
    getUnitByApiName: (apiName: string) =>
      unitByApi.get(apiName) ?? unitByApi.get(normKey(apiName)),
    getTraitByApiName: (apiName: string) =>
      traitByApi.get(apiName) ?? traitByApi.get(normKey(apiName)),
    getItemByIdOrApiName: (identifier: string | number) => {
      if (typeof identifier === 'number') {
        const asString = String(identifier)
        return itemByApi.get(asString) ?? itemByApi.get(normKey(asString))
      }
      const trimmed = identifier.trim()
      if (!trimmed) return undefined
      return (
        itemByApi.get(trimmed) ??
        itemByApi.get(normKey(trimmed)) ??
        itemByName.get(normKey(trimmed))
      )
    },
    getAugmentByApiName: (apiName: string) =>
      augmentByApi.get(apiName) ?? augmentByApi.get(normKey(apiName)),
    getGodBoonByApiName: (apiName: string) =>
      godBoonByApi.get(apiName) ?? godBoonByApi.get(normKey(apiName)),
  }
}

/** Unified catalog view from Zustand gameData (CDN or seed). */
export function catalogFromGameData(
  gameData: GameDataState,
  seed: FallbackSeed,
): TFTDataCatalog {
  if (!hasRuntimeRows(gameData)) {
    return buildCatalog(
      seed.meta,
      seed.catalog.units,
      seed.catalog.traits,
      seed.catalog.items,
      seed.catalog.augments,
      seed.godBoons,
    )
  }

  const setNumber = gameData.setNumber || seed.setNumber
  const units = gameData.champions.map((u) => unitToStatic(u, setNumber))
  const traits = gameData.traits.map((t) => traitToStatic(t, setNumber))
  const items = gameData.items.map(itemToStatic)
  const augments = gameData.augments.map(augmentToStatic)

  return buildCatalog(seed.meta, units, traits, items, augments, seed.godBoons)
}
