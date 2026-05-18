import { catalogFromGameData } from '@/lib/gameDataCatalog'
import { FALLBACK_SEED } from '@/services/cdnDataService'
import type { TFTDataCatalog } from '@/types/tftStaticData'

const EMPTY_GAME_DATA = {
  setNumber: FALLBACK_SEED.setNumber,
  champions: [] as never[],
  traits: [] as never[],
  items: [] as never[],
  augments: [] as never[],
  isLoading: false,
  lastUpdated: null,
  source: null,
}

let cachedCatalog: TFTDataCatalog | null = null

/** Seed catalog from fallback-seed.json — safe outside React. */
export function createTFTDataCatalog(): TFTDataCatalog {
  if (cachedCatalog) return cachedCatalog
  cachedCatalog = catalogFromGameData(EMPTY_GAME_DATA, FALLBACK_SEED)
  return cachedCatalog
}

/** @internal Test-only: clear memoized catalog between tests. */
export function resetTFTDataCatalogCache(): void {
  cachedCatalog = null
}
