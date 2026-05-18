import type { Augment } from '@/data/augments'
import type { Unit } from '@/data/units'
import type { Synergy } from '@/data/synergies'
import type { ItemGuideEntry } from '@/data/itemGuideCatalog'
import type {
  TFTStaticAugment,
  TFTStaticGodBoon,
  TFTStaticItem,
  TFTStaticMeta,
  TFTStaticTrait,
  TFTStaticUnit,
} from '@/types/tftStaticData'

/** Build-time seed written by `npm run sync-all` → `src/data/fallback-seed.json`. */
export interface FallbackSeedCatalog {
  units: TFTStaticUnit[]
  traits: TFTStaticTrait[]
  items: TFTStaticItem[]
  augments: TFTStaticAugment[]
}

export interface FallbackSeed {
  setNumber: number
  meta: TFTStaticMeta
  champions: Unit[]
  traits: Synergy[]
  items: ItemGuideEntry[]
  augments: Augment[]
  godBoons: TFTStaticGodBoon[]
  catalog: FallbackSeedCatalog
}
