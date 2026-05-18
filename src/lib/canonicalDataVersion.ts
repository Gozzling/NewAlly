import { FALLBACK_SEED } from '@/services/cdnDataService'
import { CURRENT_TFT_SET_NUMBER, SET_17_PATCH } from '@/meta/tftCurrentSet'
import type { CanonicalDataVersion } from '@/types/canonicalCatalog'
import { useAppStore } from '@/store/useAppStore'

export type { CanonicalDataVersion } from '@/types/canonicalCatalog'
export { catalogVersionKey as versionCacheKey, patchCatalogPath } from '@/types/canonicalCatalog'

export function getCurrentCatalogVersion(): CanonicalDataVersion {
  const { gameData } = useAppStore.getState()
  const staticMeta = FALLBACK_SEED.meta
  return {
    set: gameData.setNumber || staticMeta.setNumber || CURRENT_TFT_SET_NUMBER,
    patch: SET_17_PATCH.patch,
    locale: staticMeta.locale?.split('_')[0] ?? 'en',
  }
}

export function getStaticCatalogVersion(): CanonicalDataVersion {
  const meta = FALLBACK_SEED.meta
  return {
    set: meta.setNumber,
    patch: SET_17_PATCH.patch,
    locale: meta.locale?.split('_')[0] ?? 'en',
  }
}

export function getCdnCatalogVersion(): CanonicalDataVersion {
  const { gameData } = useAppStore.getState()
  return {
    set: gameData.setNumber || CURRENT_TFT_SET_NUMBER,
    patch: SET_17_PATCH.patch,
    locale: 'en',
  }
}

export function resolveCatalogVersion(options?: {
  set?: number
  patch?: string
  locale?: string
}): CanonicalDataVersion {
  const current = getCurrentCatalogVersion()
  return {
    set: options?.set ?? current.set,
    patch: options?.patch ?? current.patch,
    locale: options?.locale ?? current.locale,
  }
}
