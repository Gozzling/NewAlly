import { buildMergedAugmentCatalog } from '@/lib/augmentCatalog'
import type { CanonicalDataVersion } from '@/types/canonicalCatalog'
import { catalogVersionKey } from '@/types/canonicalCatalog'
import type { CanonicalAugment } from '@/types/canonicalAugment'
import type { CanonicalEntity, CanonicalEntityType } from '@/types/canonicalEntity'
import type { CanonicalRelationship } from '@/types/canonicalRelationship'
import { listRelationships } from '@/lib/canonicalRelationshipRegistry'
import { mergeRelationshipSignals } from '@/lib/relationshipScoring'

export type EntityFieldChange = {
  field: string
  before: unknown
  after: unknown
}

export type EntityDiff = {
  canonicalId: string
  type: CanonicalEntityType
  change: 'added' | 'removed' | 'modified'
  fieldChanges?: EntityFieldChange[]
}

export type RelationshipDiff = {
  key: string
  sourceId: string
  targetId: string
  relationship: string
  change: 'added' | 'removed' | 'modified'
  weightBefore?: number
  weightAfter?: number
  signalsBefore?: number
  signalsAfter?: number
}

export type CatalogDiff = {
  patchA: CanonicalDataVersion
  patchB: CanonicalDataVersion
  entities: EntityDiff[]
  relationships: RelationshipDiff[]
}

function relKey(rel: CanonicalRelationship): string {
  return `${rel.sourceId}→${rel.relationship}→${rel.targetId}`
}

function entitySnapshot(entity: CanonicalEntity): Record<string, unknown> {
  const aug = entity as CanonicalAugment
  return {
    name: entity.name,
    apiName: entity.apiName,
    description: aug.formattedDescription ?? aug.rawDescription,
    rawDescription: aug.rawDescription,
    effects: aug.effects,
    stats: aug.stats,
    tier: aug.tier,
    source: entity.source,
  }
}

function diffSnapshots(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): EntityFieldChange[] {
  const keys = new Set([...Object.keys(before), ...Object.keys(after)])
  const changes: EntityFieldChange[] = []
  for (const field of keys) {
    const a = before[field]
    const b = after[field]
    if (JSON.stringify(a) !== JSON.stringify(b)) {
      changes.push({ field, before: a, after: b })
    }
  }
  return changes
}

function loadAugmentEntities(version: CanonicalDataVersion): Map<string, CanonicalAugment> {
  const catalog = buildMergedAugmentCatalog(version)
  return new Map(catalog.byCanonicalId)
}

/** Compare two patch catalogs for a given entity type (augments today). */
export function compareCatalogs(
  patchA: CanonicalDataVersion,
  patchB: CanonicalDataVersion,
  entityType: CanonicalEntityType = 'augment',
): CatalogDiff {
  if (catalogVersionKey(patchA) === catalogVersionKey(patchB)) {
    return { patchA, patchB, entities: [], relationships: [] }
  }

  const entities = diffEntities(patchA, patchB, entityType)
  const relationships = diffRelationships(patchA, patchB)
  return { patchA, patchB, entities, relationships }
}

export function diffEntities(
  patchA: CanonicalDataVersion,
  patchB: CanonicalDataVersion,
  entityType: CanonicalEntityType = 'augment',
): EntityDiff[] {
  if (entityType !== 'augment') return []

  const mapA = loadAugmentEntities(patchA)
  const mapB = loadAugmentEntities(patchB)
  const ids = new Set([...mapA.keys(), ...mapB.keys()])
  const out: EntityDiff[] = []

  for (const canonicalId of ids) {
    const a = mapA.get(canonicalId)
    const b = mapB.get(canonicalId)

    if (a && !b) {
      out.push({ canonicalId, type: entityType, change: 'removed' })
      continue
    }
    if (!a && b) {
      out.push({ canonicalId, type: entityType, change: 'added' })
      continue
    }
    if (a && b) {
      const fieldChanges = diffSnapshots(entitySnapshot(a), entitySnapshot(b))
      if (fieldChanges.length > 0) {
        out.push({ canonicalId, type: entityType, change: 'modified', fieldChanges })
      }
    }
  }

  return out
}

export function diffRelationships(
  patchA: CanonicalDataVersion,
  patchB: CanonicalDataVersion,
): RelationshipDiff[] {
  const filterByPatch = (rels: CanonicalRelationship[], patch: CanonicalDataVersion) =>
    rels.filter(
      (r) =>
        !r.signals?.length ||
        r.signals.some((s) => (s.patch == null || s.patch === patch.patch) && (s.set == null || s.set === patch.set)),
    )

  const relsA = filterByPatch(listRelationships(), patchA)
  const relsB = filterByPatch(listRelationships(), patchB)

  const mapA = new Map(relsA.map((r) => [relKey(r), r]))
  const mapB = new Map(relsB.map((r) => [relKey(r), r]))
  const keys = new Set([...mapA.keys(), ...mapB.keys()])
  const out: RelationshipDiff[] = []

  for (const key of keys) {
    const a = mapA.get(key)
    const b = mapB.get(key)
    if (a && !b) {
      out.push({
        key,
        sourceId: a.sourceId,
        targetId: a.targetId,
        relationship: a.relationship,
        change: 'removed',
        weightBefore: a.weight,
        signalsBefore: a.signals?.length,
      })
      continue
    }
    if (!a && b) {
      out.push({
        key,
        sourceId: b.sourceId,
        targetId: b.targetId,
        relationship: b.relationship,
        change: 'added',
        weightAfter: b.weight,
        signalsAfter: b.signals?.length,
      })
      continue
    }
    if (a && b) {
      const mergedSignals = mergeRelationshipSignals(a.signals, b.signals)
      const modified =
        a.weight !== b.weight ||
        JSON.stringify(a.signals ?? []) !== JSON.stringify(b.signals ?? []) ||
        mergedSignals.length !== (a.signals?.length ?? 0) + (b.signals?.length ?? 0)
      if (modified) {
        out.push({
          key,
          sourceId: a.sourceId,
          targetId: a.targetId,
          relationship: a.relationship,
          change: 'modified',
          weightBefore: a.weight,
          weightAfter: b.weight,
          signalsBefore: a.signals?.length,
          signalsAfter: b.signals?.length,
        })
      }
    }
  }

  return out
}
