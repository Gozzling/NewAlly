import metaJson from '@tft-static/en/meta.json'
import unitsJson from '@tft-static/en/units.json'
import traitsJson from '@tft-static/en/traits.json'
import componentsJson from '@tft-static/en/items/components.json'
import finishedJson from '@tft-static/en/items/finished.json'
import radiantsJson from '@tft-static/en/items/radiants.json'
import artifactsJson from '@tft-static/en/items/artifacts.json'
import augmentsJson from '@tft-static/en/augments.json'
import godBoonsJson from '@tft-static/en/godBoons.json'
import type {
  TFTDataCatalog,
  TFTItemCategory,
  TFTStaticAugment,
  TFTStaticGodBoon,
  TFTStaticItem,
  TFTStaticMeta,
  TFTStaticTrait,
  TFTStaticUnit,
} from '@/types/tftStaticData'

const meta = metaJson as TFTStaticMeta
const units = unitsJson as TFTStaticUnit[]
const traits = traitsJson as TFTStaticTrait[]
const augments = augmentsJson as TFTStaticAugment[]
const godBoons = godBoonsJson as TFTStaticGodBoon[]

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

function tagItems(
  rows: Omit<TFTStaticItem, 'category'>[],
  category: TFTItemCategory,
): TFTStaticItem[] {
  return rows.map((row) => ({ ...row, category }))
}

function buildItems(): TFTStaticItem[] {
  return [
    ...tagItems(componentsJson as Omit<TFTStaticItem, 'category'>[], 'component'),
    ...tagItems(finishedJson as Omit<TFTStaticItem, 'category'>[], 'finished'),
    ...tagItems(radiantsJson as Omit<TFTStaticItem, 'category'>[], 'radiant'),
    ...tagItems(artifactsJson as Omit<TFTStaticItem, 'category'>[], 'artifact'),
  ]
}

let cachedCatalog: TFTDataCatalog | null = null

/** Build (or reuse) the static TFT lookup catalog — safe outside React. */
export function createTFTDataCatalog(): TFTDataCatalog {
  if (cachedCatalog) return cachedCatalog

  const items = buildItems()
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

  const getUnitByApiName = (apiName: string): TFTStaticUnit | undefined =>
    unitByApi.get(apiName) ?? unitByApi.get(normKey(apiName))

  const getTraitByApiName = (apiName: string): TFTStaticTrait | undefined =>
    traitByApi.get(apiName) ?? traitByApi.get(normKey(apiName))

  const getItemByIdOrApiName = (
    identifier: string | number,
  ): TFTStaticItem | undefined => {
    if (typeof identifier === 'number') {
      const asString = String(identifier)
      return (
        itemByApi.get(asString) ??
        itemByApi.get(normKey(asString)) ??
        undefined
      )
    }
    const trimmed = identifier.trim()
    if (!trimmed) return undefined
    return (
      itemByApi.get(trimmed) ??
      itemByApi.get(normKey(trimmed)) ??
      itemByName.get(normKey(trimmed))
    )
  }

  const getAugmentByApiName = (apiName: string): TFTStaticAugment | undefined =>
    augmentByApi.get(apiName) ?? augmentByApi.get(normKey(apiName))

  const getGodBoonByApiName = (apiName: string): TFTStaticGodBoon | undefined =>
    godBoonByApi.get(apiName) ?? godBoonByApi.get(normKey(apiName))

  cachedCatalog = {
    meta,
    units,
    traits,
    items,
    itemsByCategory,
    augments,
    godBoons,
    getUnitByApiName,
    getTraitByApiName,
    getItemByIdOrApiName,
    getAugmentByApiName,
    getGodBoonByApiName,
  }

  return cachedCatalog
}

/** @internal Test-only: clear memoized catalog between tests. */
export function resetTFTDataCatalogCache(): void {
  cachedCatalog = null
}
