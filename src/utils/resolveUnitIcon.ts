import fallbackSeedJson from '@/data/fallback-seed.json'
import type { Unit } from '@/data/units'
import type { FallbackSeed } from '@/types/fallbackSeed'
import { normalizeCdragonPath } from '@/utils/tftAssetPath'
import { isPlayableRosterUnit } from '@/lib/unitRosterFilter'
import { unitIconUrl, unitMatchKey } from '@/utils/unitDisplay'

const FALLBACK_SEED = fallbackSeedJson as unknown as FallbackSeed

const seedByMatchKey = new Map(
  FALLBACK_SEED.champions.map((c) => [unitMatchKey(c.name), c] as const),
)

const seedByApiName = new Map(
  FALLBACK_SEED.champions
    .filter((c): c is typeof c & { apiName: string } => Boolean(c.apiName))
    .map((c) => [c.apiName, c] as const),
)

function seedIconForUnit(unit: Pick<Unit, 'name' | 'apiName' | 'id'>): string | undefined {
  if (unit.apiName) {
    const hit = seedByApiName.get(unit.apiName)
    if (hit?.iconUrl) return hit.iconUrl
  }
  const hit = seedByMatchKey.get(unitMatchKey(unit.name))
  return hit?.iconUrl
}

/** HUD square path heuristic when seed/CDN row omitted iconUrl (e.g. stale IndexedDB cache). */
function iconUrlFromApiName(apiName: string): string | undefined {
  const m = /^TFT(\d+)_/i.exec(apiName)
  if (!m) return undefined
  const setNum = m[1]
  const path = `ASSETS/Characters/${apiName}/HUD/${apiName}_Square.TFT_Set${setNum}.tex`
  return normalizeCdragonPath(path)
}

/** Best portrait URL for a roster unit (CDN png → seed → HUD heuristic → local / Data Dragon). */
export function resolveUnitIconUrl(
  unit: Pick<Unit, 'name' | 'apiName' | 'iconUrl' | 'id'>,
): string {
  const direct = normalizeCdragonPath(unit.iconUrl)
  if (direct) return direct

  const fromSeed = normalizeCdragonPath(seedIconForUnit(unit))
  if (fromSeed) return fromSeed

  if (unit.apiName) {
    const built = iconUrlFromApiName(unit.apiName)
    if (built) return built
  }

  return unitIconUrl(unit.name)
}

export function filterPlayableChampions<T extends Unit>(champions: T[]): T[] {
  return champions.filter((c) => isPlayableRosterUnit(c.apiName ?? c.id, c.name))
}

export function enrichChampionIcons<T extends Unit>(champions: T[]): T[] {
  return filterPlayableChampions(champions).map((c) => {
    const iconUrl = resolveUnitIconUrl(c)
    return iconUrl === c.iconUrl ? c : { ...c, iconUrl }
  })
}
