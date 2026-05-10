import { getCache, setCache, ONE_HOUR } from './storageService'

const TWELVE_HOURS = 12 * ONE_HOUR
const RIOT_DDRAGON = 'https://ddragon.leagueoflegends.com'
/** Riot TFT game data (same tree the client uses), via Community Dragon raw. Not Summoner's Rift ddragon. */
const TFT_GAME_V1 =
  'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1'

export interface PatchInfo {
  patch: string
  setNumber: number
  setName: string
  tftPatch: string
}

interface FetchedUnit {
  id: string
  name: string
  cost: number
  traits: string[]
  abilityName: string
  abilityDesc: string
  stats: { hp: number; ad: number; ap: number; armor: number; mr: number; atkSpeed: number; range: number }
}

interface FetchedAugment {
  id: string
  name: string
  tier: string
  description: string
  icon: string
}

interface FetchedTrait {
  id: string
  name: string
  description: string
  thresholds: Array<{ count: number; effect: string }>
  icon: string
}

export interface FetchedSetData {
  patch: PatchInfo
  units: FetchedUnit[]
  augments: FetchedAugment[]
  traits: FetchedTrait[]
  itemRecipes: Record<string, [string, string]>
}

async function riotFetch<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

const TFT17_HUD = /\/Characters\/TFT17_[^/]+\/HUD\/TFT17_/

function formatTraitConstants(constants: { name: string; value: number }[] | undefined): string {
  if (!constants?.length) return ''
  return constants
    .map((c) => {
      let v: string | number = c.value
      if (typeof v === 'number' && Math.abs(v) > 0 && Math.abs(v) <= 1 && !Number.isInteger(v)) {
        v = `${Math.round(v * 100)}%`
      }
      return `${c.name}: ${v}`
    })
    .join(' · ')
}

export async function fetchCurrentPatch(): Promise<PatchInfo | null> {
  const cacheKey = 'riot:current-patch'
  const cached = getCache<PatchInfo>(cacheKey)
  if (cached) return cached

  const versions = await riotFetch<string[]>(`${RIOT_DDRAGON}/api/versions.json`)
  if (versions && versions.length > 0) {
    const latest = versions[0]
    const info: PatchInfo = {
      patch: latest,
      setNumber: 17,
      setName: 'Space Gods',
      tftPatch: latest,
    }
    setCache(cacheKey, info, TWELVE_HOURS)
    return info
  }
  return null
}

/** TFT champions from tftchampions.json (TFT units, not LoL champions). */
export async function fetchAllUnits(): Promise<FetchedUnit[] | null> {
  const cacheKey = 'riot:set17-units'
  const cached = getCache<FetchedUnit[]>(cacheKey)
  if (cached) return cached

  const data = await riotFetch<Record<string, { character_record?: Record<string, unknown> }>>(
    `${TFT_GAME_V1}/tftchampions.json`,
  )
  if (!data) return null

  const units: FetchedUnit[] = []
  for (const k of Object.keys(data)) {
    const r = data[k]?.character_record as
      | {
          character_id?: string
          display_name?: string
          traits?: { name: string }[]
          squareIconPath?: string
        }
      | undefined
    if (!r?.character_id?.startsWith('TFT17_')) continue
    if (!TFT17_HUD.test(r.squareIconPath ?? '')) continue
    if (/_TraitClone$/i.test(r.character_id)) continue
    if (!r.traits?.length) continue

    units.push({
      id: r.character_id,
      name: r.display_name ?? r.character_id,
      cost: 1,
      traits: r.traits.map((t) => t.name),
      abilityName: 'Ability',
      abilityDesc: '',
      stats: { hp: 500, ad: 50, ap: 50, armor: 20, mr: 20, atkSpeed: 0.6, range: 1 },
    })
  }

  units.sort((a, b) => a.name.localeCompare(b.name))
  setCache(cacheKey, units, TWELVE_HOURS)
  return units
}

/** Augment *names* from tftitems rows under Augments/ (no descriptions in this JSON). */
export async function fetchAllAugments(): Promise<FetchedAugment[] | null> {
  const cacheKey = 'riot:set17-augments'
  const cached = getCache<FetchedAugment[]>(cacheKey)
  if (cached) return cached

  const data = await riotFetch<Record<string, { name?: string; squareIconPath?: string; nameId?: string }>>(
    `${TFT_GAME_V1}/tftitems.json`,
  )
  if (!data) return null

  const augments: FetchedAugment[] = []
  for (const k of Object.keys(data)) {
    const it = data[k]
    if (!it?.name || !it.squareIconPath) continue
    if (!/augments/i.test(it.squareIconPath)) continue
    augments.push({
      id: it.nameId ?? it.name,
      name: it.name,
      tier: 'gold',
      description: '',
      icon: it.squareIconPath,
    })
  }

  augments.sort((a, b) => a.name.localeCompare(b.name))
  setCache(cacheKey, augments, TWELVE_HOURS)
  return augments
}

/** TFT traits from tfttraits.json (filter current set in-client). */
export async function fetchAllTraits(): Promise<FetchedTrait[] | null> {
  const cacheKey = 'riot:set17-traits'
  const cached = getCache<FetchedTrait[]>(cacheKey)
  if (cached) return cached

  const data = await riotFetch<
    Record<
      string,
      {
        display_name?: string
        trait_id?: string
        set?: string
        icon_path?: string
        tooltip_text?: string
        conditional_trait_sets?: {
          min_units: number
          constants?: { name: string; value: number }[]
        }[]
      }
    >
  >(`${TFT_GAME_V1}/tfttraits.json`)
  if (!data) return null

  const byName = new Map<string, (typeof data)[string]>()
  for (const key of Object.keys(data)) {
    const tr = data[key]
    if (!tr || tr.set !== 'TFTSet17') continue
    if (String(tr.trait_id ?? '').includes('CarouselMarket')) continue
    if (tr.display_name === 'God-Blessed') continue
    if (tr.display_name === 'Stargazer' && tr.trait_id !== 'TFT17_Stargazer') continue
    const name = tr.display_name ?? tr.trait_id ?? key
    if (!byName.has(name)) byName.set(name, tr)
  }

  const traits: FetchedTrait[] = []
  for (const tr of byName.values()) {
    const sets = tr.conditional_trait_sets ?? []
    const thresholds = sets
      .filter((s) => typeof s.min_units === 'number' && s.min_units > 0)
      .map((s) => ({
        count: s.min_units,
        effect: formatTraitConstants(s.constants) || 'Tier bonus',
      }))
      .sort((a, b) => a.count - b.count)

    traits.push({
      id: tr.trait_id ?? tr.display_name ?? '',
      name: tr.display_name ?? '',
      description: (tr.tooltip_text ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
      thresholds,
      icon: tr.icon_path ?? '',
    })
  }

  traits.sort((a, b) => a.name.localeCompare(b.name))
  setCache(cacheKey, traits, TWELVE_HOURS)
  return traits
}

/** tftitems.json does not include component recipes; use local items.ts or Data Dragon TFT when available. */
export async function fetchItemRecipes(): Promise<Record<string, [string, string]> | null> {
  return null
}

/** Full fetch with fallback to hardcoded data */
export async function fetchFullSetData(): Promise<FetchedSetData | null> {
  const [patch, units, augments, traits, itemRecipes] = await Promise.all([
    fetchCurrentPatch(),
    fetchAllUnits(),
    fetchAllAugments(),
    fetchAllTraits(),
    fetchItemRecipes(),
  ])

  if (!patch) return null

  return {
    patch,
    units: units ?? [],
    augments: augments ?? [],
    traits: traits ?? [],
    itemRecipes: itemRecipes ?? {},
  }
}

export const SET_17_PATCH: PatchInfo = {
  patch: '17.1',
  setNumber: 17,
  setName: 'Space Gods',
  tftPatch: '17.1',
}
