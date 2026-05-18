import { AUGMENTS } from '@/data/augments'
import {
  getCdnCatalogVersion,
  getCurrentCatalogVersion,
  getStaticCatalogVersion,
  resolveCatalogVersion,
} from '@/lib/canonicalDataVersion'
import { mergeAugmentSources, type CdnAugmentRow } from '@/lib/mergeAugments'
import { registerPatchCatalog } from '@/lib/canonicalPatchCatalogStore'
import { catalogFromGameData } from '@/lib/gameDataCatalog'
import type { CanonicalDataVersion, MergedAugmentCatalog } from '@/types/canonicalAugment'
import { catalogVersionKey, patchCatalogPath } from '@/types/canonicalCatalog'
import { useAppStore } from '@/store/useAppStore'
import { FALLBACK_SEED, getFallbackSetData } from '@/services/cdnDataService'

const mergedCache = new Map<string, MergedAugmentCatalog>()

function loadCdnAugmentRows(): CdnAugmentRow[] {
  const { gameData } = useAppStore.getState()
  return gameData.augments.length > 0 ? gameData.augments : getFallbackSetData().augments
}

function cacheMergedCatalog(merged: MergedAugmentCatalog, scope: string): MergedAugmentCatalog {
  const key = `${scope}:${catalogVersionKey(merged.version)}`
  mergedCache.set(key, merged)
  registerPatchCatalog({
    version: merged.version,
    path: patchCatalogPath(merged.version),
    entities: { augment: merged },
  })
  return merged
}

export function buildStaticAugmentCatalog(): MergedAugmentCatalog {
  const version = getStaticCatalogVersion()
  const key = `static:${catalogVersionKey(version)}`
  const cached = mergedCache.get(key)
  if (cached) return cached

  const catalog = catalogFromGameData(useAppStore.getState().gameData, FALLBACK_SEED)
  const merged = mergeAugmentSources({
    version,
    staticAugments: catalog.augments,
    cdnAugments: [],
    bundledAugments: [],
  })
  return cacheMergedCatalog(merged, 'static')
}

export function buildCdnAugmentCatalog(): MergedAugmentCatalog {
  const version = getCdnCatalogVersion()
  const key = `cdn:${catalogVersionKey(version)}`
  const cached = mergedCache.get(key)
  if (cached) return cached

  const merged = mergeAugmentSources({
    version,
    staticAugments: [],
    cdnAugments: loadCdnAugmentRows(),
    bundledAugments: [],
  })
  return cacheMergedCatalog(merged, 'cdn')
}

export function buildMergedAugmentCatalog(version?: CanonicalDataVersion): MergedAugmentCatalog {
  const resolvedVersion = version ?? getCurrentCatalogVersion()
  const key = `merged:${catalogVersionKey(resolvedVersion)}`
  const cached = mergedCache.get(key)
  if (cached) return cached

  const catalog = catalogFromGameData(useAppStore.getState().gameData, FALLBACK_SEED)
  const merged = mergeAugmentSources({
    version: resolvedVersion,
    staticAugments: catalog.augments,
    cdnAugments: loadCdnAugmentRows(),
    bundledAugments: AUGMENTS,
  })
  return cacheMergedCatalog(merged, 'merged')
}

export function getMergedAugmentCatalog(options?: {
  set?: number
  patch?: string
  locale?: string
}): MergedAugmentCatalog {
  const version = resolveCatalogVersion(options)
  return buildMergedAugmentCatalog(version)
}

/** @internal Test-only — clear catalog memoization. */
export function resetAugmentCatalogCache(): void {
  mergedCache.clear()
}
