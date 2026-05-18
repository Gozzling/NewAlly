import type { CanonicalDataVersion } from '@/types/canonicalCatalog'
import type { CanonicalEntity } from '@/types/canonicalEntity'

export type { CanonicalDataVersion } from '@/types/canonicalCatalog'
export { catalogVersionKey, patchCatalogPath } from '@/types/canonicalCatalog'

export type CanonicalAugmentTier = 'silver' | 'gold' | 'prismatic'

export type CanonicalAugmentSource = 'static' | 'cdn' | 'bundled'

/** @deprecated Use metadata.completeness — kept for migration */
export type CanonicalAugmentCompleteness = {
  hasEffects: boolean
  hasFormattedDescription: boolean
  hasStats: boolean
  sourceChain: CanonicalAugmentSource[]
}

export type CanonicalAugment = CanonicalEntity<'augment'> & {
  /** Mirrors set/patch/locale for backward-compatible consumers */
  version: CanonicalDataVersion

  iconUrl?: string
  tier?: CanonicalAugmentTier

  rawDescription?: string
  formattedDescription?: string

  effects?: Record<string, number>

  tags?: string[]
  comps?: string[]

  stats?: {
    pickRate?: number
    winRate?: number
    avgPlacement?: number
  }

  synergies?: string[]
  counters?: string[]
}

export type MergedAugmentCatalog = {
  version: CanonicalDataVersion
  byApiName: Map<string, CanonicalAugment>
  byCanonicalId: Map<string, CanonicalAugment>
}

export function augmentVersion(aug: CanonicalAugment): CanonicalDataVersion {
  return (
    aug.version ?? {
      set: aug.set ?? 0,
      patch: aug.patch ?? '',
      locale: aug.locale ?? 'en',
    }
  )
}

/** Read legacy completeness shape from entity metadata. */
export function augmentCompleteness(
  aug: CanonicalAugment,
): CanonicalAugmentCompleteness {
  const c = aug.metadata?.completeness ?? {}
  const chain = (aug.metadata?.sourceChain ?? []) as CanonicalAugmentSource[]
  return {
    hasEffects: Boolean(c.hasEffects),
    hasFormattedDescription: Boolean(c.hasFormattedDescription),
    hasStats: Boolean(c.hasStats),
    sourceChain: chain,
  }
}
