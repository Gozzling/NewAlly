import type { CanonicalDataVersion } from '@/types/canonicalCatalog'
import { catalogVersionKey, patchCatalogPath } from '@/types/canonicalCatalog'
import type { CanonicalEntityType } from '@/types/canonicalEntity'

export type PatchCatalogBundle = {
  version: CanonicalDataVersion
  path: string
  entities: Partial<Record<CanonicalEntityType, unknown>>
}

const bundles = new Map<string, PatchCatalogBundle>()

export function patchCatalogKey(version: CanonicalDataVersion): string {
  return catalogVersionKey(version)
}

/** Register an archived or live catalog bundle (multiple patch catalogs can coexist). */
export function registerPatchCatalog(bundle: PatchCatalogBundle): void {
  bundles.set(patchCatalogKey(bundle.version), {
    ...bundle,
    path: bundle.path || patchCatalogPath(bundle.version),
  })
}

export function getPatchCatalog(version: CanonicalDataVersion): PatchCatalogBundle | undefined {
  return bundles.get(patchCatalogKey(version))
}

export function listPatchCatalogs(): PatchCatalogBundle[] {
  return [...bundles.values()]
}

/** @internal Test-only */
export function resetPatchCatalogStore(): void {
  bundles.clear()
}
