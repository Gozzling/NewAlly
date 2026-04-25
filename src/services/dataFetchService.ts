import { getCache, setCache, ONE_HOUR } from './storageService'

const TWELVE_HOURS = 12 * ONE_HOUR
const RIOT_DDRAGON = 'https://ddragon.leagueoflegends.com'
const TFT_CDRAGON = 'https://raw.communitydragon.org/latest/cdragon/tft'

interface PatchInfo {
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

export async function fetchCurrentPatch(): Promise<PatchInfo | null> {
  const cacheKey = 'riot:current-patch'
  const cached = getCache<PatchInfo>(cacheKey)
  if (cached) return cached

  // Try ddragon version endpoint
  const versions = await riotFetch<string[]>(`${RIOT_DDRAGON}/api/versions.json`)
  if (versions && versions.length > 0) {
    const latest = versions[0]
    // TFT set info from community dragon
    const setInfo = await riotFetch<any>(`${TFT_CDRAGON}/set-info.json`)
    const setNumber = setInfo?.activeSet ?? 17
    const setName = setInfo?.setName ?? 'Space Gods'
    const info: PatchInfo = { patch: latest, setNumber, setName, tftPatch: latest }
    setCache(cacheKey, info, TWELVE_HOURS)
    return info
  }
  return null
}

export async function fetchAllUnits(): Promise<FetchedUnit[] | null> {
  const cacheKey = 'riot:set17-units'
  const cached = getCache<FetchedUnit[]>(cacheKey)
  if (cached) return cached

  const patch = await fetchCurrentPatch()
  if (!patch) return null

  const data = await riotFetch<any>(`${TFT_CDRAGON}/units.json`)
  if (!data) return null

  const units: FetchedUnit[] = (Array.isArray(data) ? data : data.units ?? [])
    .map((u: any) => ({
      id: u.character_id ?? u.apiName ?? u.name,
      name: u.name,
      cost: Number(u.cost) || 1,
      traits: Array.isArray(u.traits) ? u.traits.map((t: any) => typeof t === 'string' ? t : t.name) : [],
      abilityName: u.ability?.name ?? 'Ability',
      abilityDesc: u.ability?.desc ?? '',
      stats: {
        hp: Number(u.stats?.hp ?? u.hp) || 500,
        ad: Number(u.stats?.ad ?? u.damage) || 50,
        ap: Number(u.stats?.ap) || 50,
        armor: Number(u.stats?.armor) || 20,
        mr: Number(u.stats?.mr) || 20,
        atkSpeed: Number(u.stats?.attackSpeed) || 0.6,
        range: Number(u.stats?.range) || 1,
      },
    }))

  setCache(cacheKey, units, TWELVE_HOURS)
  return units
}

export async function fetchAllAugments(): Promise<FetchedAugment[] | null> {
  const cacheKey = 'riot:set17-augments'
  const cached = getCache<FetchedAugment[]>(cacheKey)
  if (cached) return cached

  const data = await riotFetch<any>(`${TFT_CDRAGON}/augments.json`)
  if (!data) return null

  const augments: FetchedAugment[] = (Array.isArray(data) ? data : data.augments ?? [])
    .map((a: any) => ({
      id: a.apiName ?? a.id ?? a.name,
      name: a.name,
      tier: a.tier ?? a.rarity ?? 'gold',
      description: a.desc ?? a.description ?? '',
      icon: a.icon ?? '',
    }))

  setCache(cacheKey, augments, TWELVE_HOURS)
  return augments
}

export async function fetchAllTraits(): Promise<FetchedTrait[] | null> {
  const cacheKey = 'riot:set17-traits'
  const cached = getCache<FetchedTrait[]>(cacheKey)
  if (cached) return cached

  const data = await riotFetch<any>(`${TFT_CDRAGON}/traits.json`)
  if (!data) return null

  const traits: FetchedTrait[] = (Array.isArray(data) ? data : data.traits ?? [])
    .map((t: any) => ({
      id: t.apiName ?? t.id ?? t.name,
      name: t.name,
      description: t.desc ?? t.description ?? '',
      thresholds: Array.isArray(t.effects)
        ? t.effects.map((e: any) => ({
            count: Number(e.minUnits) || Number(e.requiredUnits) || 1,
            effect: e.description ?? '',
          }))
        : [],
      icon: t.icon ?? '',
    }))

  setCache(cacheKey, traits, TWELVE_HOURS)
  return traits
}

export async function fetchItemRecipes(): Promise<Record<string, [string, string]> | null> {
  const cacheKey = 'riot:set17-items'
  const cached = getCache<Record<string, [string, string]>>(cacheKey)
  if (cached) return cached

  const data = await riotFetch<any>(`${TFT_CDRAGON}/items.json`)
  if (!data) return null

  const recipes: Record<string, [string, string]> = {}
  for (const item of Array.isArray(data) ? data : data.items ?? []) {
    if (item.recipe && Array.isArray(item.recipe) && item.recipe.length === 2) {
      recipes[item.name] = [item.recipe[0], item.recipe[1]]
    }
  }

  if (Object.keys(recipes).length === 0) return null
  setCache(cacheKey, recipes, TWELVE_HOURS)
  return recipes
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
