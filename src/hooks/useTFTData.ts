import { useMemo } from 'react'
import { catalogFromGameData } from '@/lib/gameDataCatalog'
import { FALLBACK_SEED, getFallbackSetData } from '@/services/cdnDataService'
import { useAppStore, type GameDataState } from '@/store/useAppStore'
import type { TFTDataCatalog } from '@/types/tftStaticData'
import type { TFTSetData } from '@/services/cdnDataService'

export type { TFTDataCatalog } from '@/types/tftStaticData'
export type {
  TFTStaticAugment,
  TFTStaticItem,
  TFTStaticMeta,
  TFTStaticTrait,
  TFTStaticUnit,
  TFTItemCategory,
  TFTAugmentTier,
} from '@/types/tftStaticData'

function resolveRuntimeSet(gameData: ReturnType<typeof useAppStore.getState>['gameData']): TFTSetData {
  if (
    gameData.champions.length > 0 ||
    gameData.traits.length > 0 ||
    gameData.items.length > 0 ||
    gameData.augments.length > 0
  ) {
    return {
      setNumber: gameData.setNumber,
      champions: gameData.champions,
      traits: gameData.traits,
      items: gameData.items,
      augments: gameData.augments,
    }
  }
  return getFallbackSetData()
}

/**
 * Unified TFT catalog for guides, overlays, and canonical lookups — backed by Zustand gameData.
 */
export function useTFTData(): TFTDataCatalog {
  const gameData = useAppStore((s) => s.gameData)
  const lastUpdated = useAppStore((s) => s.gameData.lastUpdated)

  return useMemo(
    () => catalogFromGameData(gameData, FALLBACK_SEED),
    [
      gameData.setNumber,
      gameData.champions,
      gameData.traits,
      gameData.items,
      gameData.augments,
      gameData.source,
      lastUpdated,
    ],
  )
}

/** Runtime champions/traits/items/augments from unified store (seed until CDN hydrates). */
export function useTFTGameData(): TFTSetData & {
  source: GameDataState['source']
  isLoading: boolean
} {
  const gameData = useAppStore((s) => s.gameData)
  const lastUpdated = useAppStore((s) => s.gameData.lastUpdated)
  const source = useAppStore((s) => s.gameData.source)
  const isLoading = useAppStore((s) => s.gameData.isLoading)

  return useMemo(() => {
    const runtime = resolveRuntimeSet(gameData)
    return { ...runtime, source, isLoading }
  }, [
    gameData.setNumber,
    gameData.champions,
    gameData.traits,
    gameData.items,
    gameData.augments,
    source,
    isLoading,
    lastUpdated,
  ])
}
