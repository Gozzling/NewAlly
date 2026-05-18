import type { CanonicalDataVersion } from '@/types/canonicalCatalog'

export type ProjectionType = 'guide' | 'overlay' | 'search' | 'analytics' | 'legacy'

export type ProjectionCacheKey = {
  canonicalId: string
  patch: string
  locale: string
  projection: ProjectionType
}

function cacheKey(key: ProjectionCacheKey): string {
  return `${key.projection}:${key.patch}:${key.locale}:${key.canonicalId}`
}

const store = new Map<string, unknown>()

export function projectionKeyFromVersion(
  canonicalId: string,
  projection: ProjectionType,
  version: Pick<CanonicalDataVersion, 'patch' | 'locale'>,
): ProjectionCacheKey {
  return {
    canonicalId,
    patch: version.patch,
    locale: version.locale,
    projection,
  }
}

export function getCachedProjection<T>(
  key: ProjectionCacheKey,
  factory: () => T,
): T {
  const k = cacheKey(key)
  if (store.has(k)) return store.get(k) as T
  const value = factory()
  store.set(k, value)
  return value
}

export function setCachedProjection<T>(key: ProjectionCacheKey, value: T): void {
  store.set(cacheKey(key), value)
}

export function invalidateProjectionCache(match?: Partial<ProjectionCacheKey>): void {
  if (!match) {
    store.clear()
    return
  }
  for (const k of store.keys()) {
    if (match.projection && !k.startsWith(`${match.projection}:`)) continue
    if (match.patch && !k.includes(`:${match.patch}:`)) continue
    if (match.locale && !k.includes(`:${match.locale}:`)) continue
    if (match.canonicalId && !k.endsWith(`:${match.canonicalId}`)) continue
    store.delete(k)
  }
}

/** @internal Test-only */
export function resetProjectionCache(): void {
  store.clear()
}
