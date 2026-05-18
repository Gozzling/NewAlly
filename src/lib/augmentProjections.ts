import type { Augment } from '@/data/augments'
import { deriveCanonicalAugmentId } from '@/lib/canonicalAugmentId'
import {
  getCachedProjection,
  projectionKeyFromVersion,
} from '@/lib/canonicalProjectionCache'
import { CURRENT_TFT_SET_NUMBER } from '@/meta/tftCurrentSet'
import { augmentVersion } from '@/types/canonicalAugment'
import type { CanonicalAugment } from '@/types/canonicalAugment'
import type { CanonicalDataVersion } from '@/types/canonicalCatalog'
import { augmentIconUrl } from '@/utils/augmentDisplay'
import { gameIconDisplayUrl } from '@/utils/cdIconDisplay'

export type GuideAugment = {
  id: string
  canonicalId: string
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

export type OverlayAugment = {
  canonicalId: string
  name: string
  tier: 'prismatic' | 'gold' | 'silver' | null
  iconUrl: string
}

export type SearchAugment = {
  canonicalId: string
  apiName: string
  label: string
  tier: CanonicalAugment['tier']
}

export type AnalyticsAugment = {
  canonicalId: string
  apiName: string
  name: string
  tier: CanonicalAugment['tier']
  version: CanonicalDataVersion
  metadata: CanonicalAugment['metadata']
  stats?: CanonicalAugment['stats']
}

function project<T>(aug: CanonicalAugment, projection: 'guide' | 'overlay' | 'search' | 'analytics' | 'legacy', factory: () => T): T {
  const version = augmentVersion(aug)
  return getCachedProjection(
    projectionKeyFromVersion(aug.canonicalId, projection, version),
    factory,
  )
}

/** Live CDN / store row for Augment Guide (icons + formatted description). */
export function fromStoreAugment(aug: Augment): GuideAugment {
  const apiName = aug.apiName ?? aug.id
  const canonicalId = deriveCanonicalAugmentId(apiName, CURRENT_TFT_SET_NUMBER)
  const description = aug.description?.trim() || aug.effect || aug.name
  return {
    id: aug.id,
    canonicalId,
    apiName,
    name: aug.name,
    tier: aug.tier,
    description,
    effect: aug.effect || description.slice(0, 160),
    bestComps: aug.bestComps,
    pickRate: aug.pickRate,
    winRate: aug.winRate,
    avgPlacement: aug.avgPlacement,
    synergies: aug.synergies,
    counters: aug.counters,
    tags: aug.tags.length > 0 ? aug.tags : ['augment'],
    iconUrl: gameIconDisplayUrl(aug.iconUrl, augmentIconUrl(aug.name)),
  }
}

export function toGuideAugment(aug: CanonicalAugment): GuideAugment {
  return project(aug, 'guide', () => {
  const description = aug.formattedDescription ?? aug.rawDescription ?? aug.name
  return {
    id: aug.apiName,
    canonicalId: aug.canonicalId,
    apiName: aug.apiName,
    name: aug.name,
    tier: aug.tier ?? 'gold',
    description,
    effect: description.slice(0, 160),
    bestComps: aug.comps ?? [],
    pickRate: aug.stats?.pickRate ?? 0,
    winRate: aug.stats?.winRate ?? 0,
    avgPlacement: aug.stats?.avgPlacement ?? 0,
    synergies: aug.synergies ?? [],
    counters: aug.counters ?? [],
    tags: aug.tags ?? ['augment'],
    iconUrl: gameIconDisplayUrl(aug.iconUrl, augmentIconUrl(aug.name)),
  }
  })
}

export function toOverlayAugment(aug: CanonicalAugment): OverlayAugment {
  return project(aug, 'overlay', () => ({
    canonicalId: aug.canonicalId,
    name: aug.name,
    tier: aug.tier ?? null,
    iconUrl: gameIconDisplayUrl(aug.iconUrl, augmentIconUrl(aug.name)),
  }))
}

export function toSearchAugment(aug: CanonicalAugment): SearchAugment {
  return project(aug, 'search', () => ({
    canonicalId: aug.canonicalId,
    apiName: aug.apiName,
    label: aug.name,
    tier: aug.tier,
  }))
}

export function toAnalyticsAugment(aug: CanonicalAugment): AnalyticsAugment {
  return project(aug, 'analytics', () => ({
    canonicalId: aug.canonicalId,
    apiName: aug.apiName,
    name: aug.name,
    tier: aug.tier,
    version: augmentVersion(aug),
    metadata: aug.metadata,
    stats: aug.stats,
  }))
}

/** Legacy Zustand / advisor shape — UI fields only, no canonical leakage required downstream */
export function toLegacyAugment(aug: CanonicalAugment): Augment {
  return project(aug, 'legacy', () => {
  const guide = toGuideAugment(aug)
  return {
    id: `aug_${aug.canonicalId}`,
    apiName: aug.apiName,
    name: guide.name,
    tier: guide.tier,
    description: guide.description,
    effect: guide.effect,
    bestComps: guide.bestComps,
    pickRate: guide.pickRate,
    winRate: guide.winRate,
    avgPlacement: guide.avgPlacement,
    synergies: guide.synergies,
    counters: guide.counters,
    tags: guide.tags,
    iconUrl: guide.iconUrl,
    rawDescription: aug.rawDescription,
    effects: aug.effects,
  }
  })
}
