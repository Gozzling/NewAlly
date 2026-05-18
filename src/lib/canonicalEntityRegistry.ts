import type { CanonicalDataVersion } from '@/types/canonicalCatalog'
import { catalogVersionKey } from '@/types/canonicalCatalog'
import {
  resetEntityTelemetryDedupe,
  trackUnresolvedEntity,
} from '@/lib/canonicalEntityTelemetry'
import { getPatchCatalog, registerPatchCatalog, resetPatchCatalogStore } from '@/lib/canonicalPatchCatalogStore'
import type {
  CanonicalEntity,
  CanonicalEntityType,
  ResolveEntityOptions,
} from '@/types/canonicalEntity'

export type EntityCatalogIndexes<T extends CanonicalEntity = CanonicalEntity> = {
  byCanonicalId: Map<string, T>
  byApiName: Map<string, T>
  byName: Map<string, T>
}

type EntityTypeIndexes = Map<CanonicalEntityType, EntityCatalogIndexes>

type VersionedCatalog = {
  version: CanonicalDataVersion
  types: EntityTypeIndexes
}

const catalogs = new Map<string, VersionedCatalog>()

type EntityResolver<T extends CanonicalEntity = CanonicalEntity> = (
  identifier: string,
  indexes: EntityCatalogIndexes<T>,
) => T | null

const customResolvers = new Map<CanonicalEntityType, EntityResolver>()

function normalizeApiKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '')
}

function normalizeNameKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/['\u2019\u0060\u00B4]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function emptyIndexes<T extends CanonicalEntity>(): EntityCatalogIndexes<T> {
  return {
    byCanonicalId: new Map(),
    byApiName: new Map(),
    byName: new Map(),
  }
}

function indexEntity<T extends CanonicalEntity>(indexes: EntityCatalogIndexes<T>, entity: T): void {
  indexes.byCanonicalId.set(entity.canonicalId, entity)
  if (entity.apiName) {
    indexes.byApiName.set(normalizeApiKey(entity.apiName), entity)
  }
  const nk = normalizeNameKey(entity.name)
  if (nk) indexes.byName.set(nk, entity)
}

function defaultLookup<T extends CanonicalEntity>(
  identifier: string,
  indexes: EntityCatalogIndexes<T>,
): T | null {
  const trimmed = identifier.trim()
  if (!trimmed) return null

  const byId = indexes.byCanonicalId.get(trimmed)
  if (byId) return byId

  const api = indexes.byApiName.get(normalizeApiKey(trimmed))
  if (api) return api

  const name = indexes.byName.get(normalizeNameKey(trimmed))
  if (name) return name

  const lower = trimmed.toLowerCase()
  return indexes.byName.get(lower) ?? null
}

function resolveVersion(options?: ResolveEntityOptions): CanonicalDataVersion {
  const patchCatalog = options?.set != null && options?.patch
    ? getPatchCatalog({
        set: options.set,
        patch: options.patch,
        locale: options.locale ?? 'en',
      })
    : undefined

  if (patchCatalog) return patchCatalog.version

  return {
    set: options?.set ?? 17,
    patch: options?.patch ?? '17.1',
    locale: options?.locale ?? 'en',
  }
}

function getOrCreateCatalog(version: CanonicalDataVersion): VersionedCatalog {
  const key = catalogVersionKey(version)
  let catalog = catalogs.get(key)
  if (!catalog) {
    catalog = { version, types: new Map() }
    catalogs.set(key, catalog)
  }
  return catalog
}

function getTypeIndexes<T extends CanonicalEntity>(
  type: CanonicalEntityType,
  version: CanonicalDataVersion,
): EntityCatalogIndexes<T> {
  const catalog = getOrCreateCatalog(version)
  let indexes = catalog.types.get(type) as EntityCatalogIndexes<T> | undefined
  if (!indexes) {
    indexes = emptyIndexes<T>()
    catalog.types.set(type, indexes as EntityCatalogIndexes)
  }
  return indexes
}

/** Register a single entity into the versioned catalog for its type. */
export function registerEntity<T extends CanonicalEntity>(entity: T): void {
  const version: CanonicalDataVersion = {
    set: entity.set ?? 17,
    patch: entity.patch ?? '17.1',
    locale: entity.locale ?? 'en',
  }
  const indexes = getTypeIndexes<T>(entity.type, version)
  indexEntity(indexes, entity)
}

/** Bulk-register entities and rebuild relationship hooks via provider callbacks. */
export function registerEntityBatch<T extends CanonicalEntity>(
  type: CanonicalEntityType,
  version: CanonicalDataVersion,
  entities: T[],
): void {
  const indexes = getTypeIndexes<T>(type, version)
  for (const entity of entities) {
    indexEntity(indexes, entity)
  }
}

export function registerEntityResolver<T extends CanonicalEntity>(
  type: CanonicalEntityType,
  resolver: EntityResolver<T>,
): void {
  customResolvers.set(type, resolver as EntityResolver)
}

export function resolveEntity<T extends CanonicalEntity = CanonicalEntity>(
  type: CanonicalEntityType,
  identifier: string,
  options?: ResolveEntityOptions,
): T | null {
  const version = resolveVersion(options)
  const indexes = getTypeIndexes<T>(type, version)
  const custom = customResolvers.get(type) as EntityResolver<T> | undefined
  const hit = custom ? custom(identifier, indexes) : defaultLookup(identifier, indexes)

  if (!hit && !options?.silent) {
    trackUnresolvedEntity({
      type,
      identifier,
      source: 'canonical_entity_registry',
      patch: version.patch,
      set: version.set,
      context: options?.context,
    })
  }

  return hit
}

export function resolveByCanonicalId<T extends CanonicalEntity = CanonicalEntity>(
  type: CanonicalEntityType,
  canonicalId: string,
  options?: ResolveEntityOptions,
): T | null {
  const version = resolveVersion(options)
  const hit = getTypeIndexes<T>(type, version).byCanonicalId.get(canonicalId) ?? null
  if (!hit && !options?.silent) {
    trackUnresolvedEntity({
      type,
      identifier: canonicalId,
      source: 'canonical_entity_registry',
      patch: version.patch,
      set: version.set,
      context: options?.context ?? 'by_canonical_id',
    })
  }
  return hit
}

export function resolveByApiName<T extends CanonicalEntity = CanonicalEntity>(
  type: CanonicalEntityType,
  apiName: string,
  options?: ResolveEntityOptions,
): T | null {
  const version = resolveVersion(options)
  const hit = getTypeIndexes<T>(type, version).byApiName.get(normalizeApiKey(apiName)) ?? null
  if (!hit && !options?.silent) {
    trackUnresolvedEntity({
      type,
      identifier: apiName,
      source: 'canonical_entity_registry',
      patch: version.patch,
      set: version.set,
      context: options?.context ?? 'by_api_name',
    })
  }
  return hit
}

export function resolveByName<T extends CanonicalEntity = CanonicalEntity>(
  type: CanonicalEntityType,
  name: string,
  options?: ResolveEntityOptions,
): T | null {
  return resolveEntity(type, name, { ...options, context: options?.context ?? 'by_name' })
}

export function listEntities<T extends CanonicalEntity = CanonicalEntity>(
  type: CanonicalEntityType,
  options?: ResolveEntityOptions,
): T[] {
  const version = resolveVersion(options)
  return [...getTypeIndexes<T>(type, version).byCanonicalId.values()]
}

/** Link a merged catalog bundle into the patch catalog store + entity registry. */
export function attachPatchCatalogBundle(
  version: CanonicalDataVersion,
  entitiesByType: Partial<Record<CanonicalEntityType, CanonicalEntity[]>>,
): void {
  registerPatchCatalog({
    version,
    path: `catalogs/${version.set}/${version.patch}`,
    entities: entitiesByType,
  })

  for (const [type, entities] of Object.entries(entitiesByType) as [
    CanonicalEntityType,
    CanonicalEntity[],
  ][]) {
    if (entities?.length) registerEntityBatch(type, version, entities)
  }
}

/** @internal Test-only — reset all registry state. */
export function resetCanonicalEntityRegistry(): void {
  catalogs.clear()
  customResolvers.clear()
  resetPatchCatalogStore()
  resetEntityTelemetryDedupe()
}

export { registerPatchCatalog, getPatchCatalog, listPatchCatalogs }
