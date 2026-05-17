import { useMemo } from 'react'
import { createTFTDataCatalog } from '@/lib/tftStaticData'
import type { TFTDataCatalog } from '@/types/tftStaticData'

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

/**
 * In-memory TFT static data from `data/tft-static/en/` with indexed lookups.
 * Catalog is built once per session (shared with `createTFTDataCatalog`).
 */
export function useTFTData(): TFTDataCatalog {
  return useMemo(() => createTFTDataCatalog(), [])
}
