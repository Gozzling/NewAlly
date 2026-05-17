import { UNITS, type Unit } from '@/data/units'
import { SYNERGIES, type Synergy } from '@/data/synergies'
import type {
  TFTAugmentTier,
  TFTDataCatalog,
  TFTItemCategory,
  TFTStaticAugment,
  TFTStaticGodBoon,
  TFTStaticItem,
  TFTStaticTrait,
  TFTStaticUnit,
} from '@/types/tftStaticData'
import { augmentIconUrl } from '@/utils/augmentDisplay'
import { gameIconDisplayUrl } from '@/utils/cdIconDisplay'
import { itemIconUrl } from '@/utils/itemDisplay'
import { unitIconUrl } from '@/utils/unitDisplay'

export interface UnitGuideEntry {
  id: string
  apiName: string
  name: string
  cost: 1 | 2 | 3 | 4 | 5
  traits: string[]
  ability: { name: string; description: string; damage: string }
  stats: {
    hp: number
    ad: number
    ap: number
    armor: number
    mr: number
    atkSpeed: number
    range: number
  }
  bestItems: string[]
  bestComps: string[]
  tier: 'S' | 'A' | 'B' | 'C' | 'D'
  iconUrl: string
}

export interface ItemGuideEntry {
  apiName: string
  name: string
  components: [string, string] | [string] | []
  effect: string
  tags: string[]
  tier: 'S' | 'A' | 'B' | 'C'
  bestOn: string[]
  category: TFTItemCategory
  iconUrl: string
}

export interface AugmentGuideEntry {
  id: string
  apiName: string
  name: string
  tier: 'prismatic' | 'gold' | 'silver'
  description: string
  effect: string
  bestComps: string[]
  pickRate: number
  winRate: number
  avgPlacement: number
  synergies: string[]
  counters: string[]
  tags: string[]
  iconUrl: string
}

export type TraitGuideEntry = Synergy & {
  apiName: string
  iconUrl: string | null
}

function clampCost(cost: number | null): 1 | 2 | 3 | 4 | 5 {
  const n = cost ?? 1
  if (n <= 1) return 1
  if (n >= 5) return 5
  return n as 1 | 2 | 3 | 4 | 5
}

function mapUnitStats(
  stats: TFTStaticUnit['stats'],
  fallback?: Unit['stats'],
): UnitGuideEntry['stats'] {
  return {
    hp: stats?.hp ?? fallback?.hp ?? 0,
    ad: stats?.damage ?? fallback?.ad ?? 0,
    ap: fallback?.ap ?? 0,
    armor: stats?.armor ?? fallback?.armor ?? 0,
    mr: stats?.magicResist ?? fallback?.mr ?? 0,
    atkSpeed: stats?.attackSpeed ?? fallback?.atkSpeed ?? 0,
    range: stats?.range ?? fallback?.range ?? 1,
  }
}

export function buildUnitGuideEntries(catalog: TFTDataCatalog): UnitGuideEntry[] {
  const curatedByName = new Map(UNITS.map((u) => [u.name.toLowerCase(), u]))

  return catalog.units.map((su) => {
    const curated = curatedByName.get(su.name.toLowerCase())
    return {
      id: su.apiName,
      apiName: su.apiName,
      name: su.name,
      cost: clampCost(su.cost),
      traits: su.traits,
      ability: {
        name: su.ability?.name ?? curated?.ability.name ?? 'Ability',
        description:
          su.ability?.description || su.description || curated?.ability.description || '',
        damage: curated?.ability.damage ?? '',
      },
      stats: mapUnitStats(su.stats, curated?.stats),
      bestItems: curated?.bestItems ?? [],
      bestComps: curated?.bestComps ?? [],
      tier: curated?.tier ?? 'B',
      iconUrl: gameIconDisplayUrl(su.iconUrl, unitIconUrl(su.name)),
    }
  })
}

function itemDisplayName(catalog: TFTDataCatalog, apiName: string): string {
  return catalog.getItemByIdOrApiName(apiName)?.name ?? apiName
}

function itemTags(item: TFTStaticItem): string[] {
  const tags = new Set<string>([item.category])
  for (const t of item.tags ?? []) {
    const s = String(t).toLowerCase()
    if (s.length > 2 && !s.startsWith('{')) tags.add(s)
  }
  return [...tags]
}

export function buildItemGuideEntries(catalog: TFTDataCatalog): ItemGuideEntry[] {
  const displayItems = [
    ...catalog.itemsByCategory.finished,
    ...catalog.itemsByCategory.radiant,
    ...catalog.itemsByCategory.artifact,
    ...catalog.itemsByCategory.component,
  ]

  return displayItems.map((item) => {
    const comp = item.composition ?? []
    const components: ItemGuideEntry['components'] =
      comp.length >= 2
        ? [itemDisplayName(catalog, comp[0]), itemDisplayName(catalog, comp[1])]
        : comp.length === 1
          ? [itemDisplayName(catalog, comp[0])]
          : []

    return {
      apiName: item.apiName,
      name: item.name,
      components,
      effect: item.description,
      tags: itemTags(item),
      tier: 'B',
      bestOn: [],
      category: item.category,
      iconUrl: gameIconDisplayUrl(item.iconUrl, itemIconUrl(item.name)),
    }
  })
}

function mapAugmentTier(tier: TFTAugmentTier): AugmentGuideEntry['tier'] {
  if (tier === 'prismatic') return 'prismatic'
  if (tier === 'gold') return 'gold'
  return 'silver'
}

export interface GodBoonGuideEntry {
  id: string
  apiName: string
  name: string
  description: string
  godKey: string
  godName: string
  isPrimary: boolean
  iconUrl: string
}

export function buildGodBoonGuideEntries(catalog: TFTDataCatalog): GodBoonGuideEntry[] {
  return catalog.godBoons.map((boon: TFTStaticGodBoon) => ({
    id: boon.apiName,
    apiName: boon.apiName,
    name: boon.name,
    description: boon.description,
    godKey: boon.godKey,
    godName: boon.godName,
    isPrimary: boon.isPrimary,
    iconUrl: gameIconDisplayUrl(boon.iconUrl, augmentIconUrl(boon.name)),
  }))
}

export function buildAugmentGuideEntries(catalog: TFTDataCatalog): AugmentGuideEntry[] {
  return catalog.augments.map((aug: TFTStaticAugment) => ({
    id: aug.apiName,
    apiName: aug.apiName,
    name: aug.name,
    tier: mapAugmentTier(aug.tier),
    description: aug.description,
    effect: aug.description,
    bestComps: [],
    pickRate: 0,
    winRate: 0,
    avgPlacement: 0,
    synergies: aug.associatedTraits,
    counters: [],
    tags: [aug.tier, 'augment'],
    iconUrl: gameIconDisplayUrl(aug.iconUrl, augmentIconUrl(aug.name)),
  }))
}

function formatThresholdEffect(tr: TFTStaticTrait, minUnits: number): string {
  const row = tr.thresholds.find((t) => t.minUnits === minUnits)
  if (!row?.variables) return 'Active'
  return Object.entries(row.variables)
    .filter(([k]) => !k.startsWith('{'))
    .slice(0, 4)
    .map(([k, v]) => `${k}: ${v}`)
    .join(' · ')
}

export function buildTraitGuideEntries(catalog: TFTDataCatalog): TraitGuideEntry[] {
  const curatedByName = new Map(SYNERGIES.map((s) => [s.name.toLowerCase(), s]))

  return catalog.traits.map((tr) => {
    const curated = curatedByName.get(tr.name.toLowerCase())
    const thresholds =
      curated?.thresholds ??
      tr.thresholds.map((t) => ({
        count: t.minUnits,
        effect: formatThresholdEffect(tr, t.minUnits),
      }))

    return {
      id: curated?.id ?? tr.apiName,
      apiName: tr.apiName,
      name: tr.name,
      description: tr.description || curated?.description || '',
      thresholds,
      bestUnits: curated?.bestUnits ?? [],
      bestComps: curated?.bestComps ?? [],
      counters: curated?.counters ?? [],
      type: curated?.type ?? 'hybrid',
      iconUrl: gameIconDisplayUrl(tr.iconUrl, ''),
    }
  })
}
