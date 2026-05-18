import type { CanonicalAugmentSlot } from '@ally/shared-types'
import { resolveCatalogVersion } from '@/lib/canonicalDataVersion'
import {
  listEntities,
  resolveByApiName,
  resolveByCanonicalId,
  resolveByName,
  resolveEntity,
} from '@/lib/canonicalEntityRegistry'
import { normalizeAugmentIdentifier } from '@/lib/augmentNormalize'
import { toLegacyAugment } from '@/lib/augmentProjections'
import {
  bootstrapAugmentCatalog,
  ensureAugmentEntityProvider,
  resetAugmentEntityProvider,
} from '@/lib/entityProviders/augmentEntityProvider'
import { resetAugmentCatalogCache } from '@/lib/augmentCatalog'
import { resetEntityTelemetryDedupe } from '@/lib/canonicalEntityTelemetry'
import { invalidateProjectionCache } from '@/lib/canonicalProjectionCache'
import type { Augment } from '@/data/augments'
import type { CanonicalAugment } from '@/types/canonicalAugment'
import type { ResolveEntityOptions } from '@/types/canonicalEntity'
import { useAppStore } from '@/store/useAppStore'

export type ResolveAugmentOptions = ResolveEntityOptions

let cacheGameDataVersion = -1

function ensureCatalogLoaded(options?: ResolveAugmentOptions): void {
  const gameVersion = useAppStore.getState().gameData.lastUpdated ?? 0
  if (cacheGameDataVersion !== gameVersion) {
    resetAugmentEntityProvider()
    cacheGameDataVersion = gameVersion
  }
  ensureAugmentEntityProvider()
  bootstrapAugmentCatalog(resolveCatalogVersion(options))
}

/** @internal Test-only — reset memoized resolver indexes. */
export function resetAugmentResolverCache(): void {
  cacheGameDataVersion = -1
  resetAugmentCatalogCache()
  resetAugmentEntityProvider()
  resetEntityTelemetryDedupe()
  invalidateProjectionCache()
}

export function resolveAugment(
  identifier: string,
  options?: ResolveAugmentOptions,
): CanonicalAugment | null {
  ensureCatalogLoaded(options)
  return resolveEntity<CanonicalAugment>('augment', identifier, options)
}

export function resolveAugmentByApiName(
  apiName: string,
  options?: ResolveAugmentOptions,
): CanonicalAugment | null {
  ensureCatalogLoaded(options)
  return resolveByApiName<CanonicalAugment>('augment', apiName, options)
}

export function resolveAugmentByCanonicalId(
  canonicalId: string,
  options?: ResolveAugmentOptions,
): CanonicalAugment | null {
  ensureCatalogLoaded(options)
  return resolveByCanonicalId<CanonicalAugment>('augment', canonicalId, options)
}

export function resolveAugmentByName(
  name: string,
  options?: ResolveAugmentOptions,
): CanonicalAugment | null {
  ensureCatalogLoaded(options)
  return resolveByName<CanonicalAugment>('augment', name, options)
}

export function resolveAugmentDisplayName(
  identifier: string,
  options?: ResolveAugmentOptions,
): string {
  return (
    resolveAugment(identifier, { ...options, silent: true })?.name ??
    normalizeAugmentIdentifier(identifier)
  )
}

export function resolveAugmentSlotDisplayName(slot: CanonicalAugmentSlot): string {
  if (slot.displayName?.trim()) return slot.displayName.trim()
  if (slot.canonicalId) {
    const hit = resolveAugmentByCanonicalId(slot.canonicalId, {
      set: slot.set ?? undefined,
      patch: slot.patch ?? undefined,
      silent: true,
    })
    if (hit) return hit.name
  }
  const id = slot.rawId ?? ''
  return resolveAugmentDisplayName(id, {
    set: slot.set ?? undefined,
    patch: slot.patch ?? undefined,
    silent: true,
  })
}

export function enrichAugmentSlot(
  slot: CanonicalAugmentSlot,
  options?: ResolveAugmentOptions,
): CanonicalAugmentSlot {
  const versionOpts = {
    set: slot.set ?? options?.set,
    patch: slot.patch ?? options?.patch,
    locale: options?.locale,
    silent: true,
  }

  const resolved =
    (slot.canonicalId
      ? resolveAugmentByCanonicalId(slot.canonicalId, versionOpts)
      : null) ??
    (slot.rawId ? resolveAugment(slot.rawId, versionOpts) : null) ??
    resolveAugment(slot.displayName, versionOpts)

  const current = resolveCatalogVersion()
  const isHistorical = slot.patch != null && slot.patch !== current.patch

  return {
    ...slot,
    displayName: isHistorical ? slot.displayName : resolved?.name ?? slot.displayName,
    iconUrl: resolved?.iconUrl ?? slot.iconUrl,
    tier: resolved?.tier ?? slot.tier,
    knownInCatalog: Boolean(resolved),
    canonicalId: slot.canonicalId ?? resolved?.canonicalId ?? null,
    set: slot.set ?? resolved?.set ?? null,
    patch: slot.patch ?? resolved?.patch ?? null,
  }
}

export function listCanonicalAugments(options?: ResolveAugmentOptions): CanonicalAugment[] {
  ensureCatalogLoaded(options)
  bootstrapAugmentCatalog(resolveCatalogVersion(options))
  return listEntities<CanonicalAugment>('augment', options).sort((a, b) =>
    a.name.localeCompare(b.name),
  )
}

export { toLegacyAugment } from '@/lib/augmentProjections'

export function listLegacyAugments(options?: ResolveAugmentOptions): Augment[] {
  return listCanonicalAugments(options).map(toLegacyAugment)
}
