import { getMergedAugmentCatalog } from '@/lib/augmentCatalog'
import {
  attachPatchCatalogBundle,
  registerEntityResolver,
  resetCanonicalEntityRegistry,
} from '@/lib/canonicalEntityRegistry'
import {
  registerRelationships,
  resetRelationshipRegistry,
} from '@/lib/canonicalRelationshipRegistry'
import {
  normalizeAugmentApiKey,
  normalizeAugmentIdentifier,
  normalizeAugmentNameKey,
  normalizeAugmentWhitespace,
} from '@/lib/augmentNormalize'
import type { CanonicalDataVersion } from '@/types/canonicalCatalog'
import type { CanonicalAugment } from '@/types/canonicalAugment'
import type { EntityCatalogIndexes } from '@/lib/canonicalEntityRegistry'
import type { CanonicalRelationship } from '@/types/canonicalRelationship'
import {
  defaultSignalForRelationship,
  signalTypeFromRelationshipName,
} from '@/lib/relationshipScoring'
import type { RelationshipSignal } from '@/types/relationshipSignal'
import { normalizeAugmentDisplayName } from '@/shared/augmentParse'

let bootstrappedVersionKey: string | null = null

function catalogSignal(
  aug: CanonicalAugment,
  type: RelationshipSignal['type'],
  confidence: number,
): RelationshipSignal {
  return {
    type,
    confidence,
    set: aug.set,
    patch: aug.patch,
    source: 'catalog_derived',
  }
}

function augmentRelationships(aug: CanonicalAugment): CanonicalRelationship[] {
  const rels: CanonicalRelationship[] = []
  for (const traitId of aug.synergies ?? []) {
    rels.push({
      sourceId: aug.canonicalId,
      targetId: traitId,
      relationship: 'synergy',
      derived: true,
      weight: 0.7,
      signals: [catalogSignal(aug, 'synergy', 0.7)],
      metadata: { apiName: aug.apiName },
    })
  }
  for (const comp of aug.comps ?? []) {
    rels.push({
      sourceId: aug.canonicalId,
      targetId: comp,
      relationship: 'recommended_comp',
      derived: true,
      weight: 0.85,
      signals: [catalogSignal(aug, 'core', 0.85)],
    })
  }
  for (const counter of aug.counters ?? []) {
    const rel: CanonicalRelationship = {
      sourceId: aug.canonicalId,
      targetId: counter,
      relationship: 'counter',
      derived: true,
      weight: 0.75,
      signals: [catalogSignal(aug, 'counter', 0.75)],
    }
    rels.push(rel)
  }

  if (rels.length === 0 && aug.stats?.winRate != null && aug.stats.winRate > 52) {
    rels.push({
      sourceId: aug.canonicalId,
      targetId: aug.canonicalId,
      relationship: 'tempo',
      derived: true,
      weight: 0.6,
      signals: [catalogSignal(aug, 'tempo', 0.6)],
      metadata: { winRate: aug.stats.winRate },
    })
  }

  for (const rel of rels) {
    if (!rel.signals?.length) {
      rel.signals = [defaultSignalForRelationship(rel, rel.weight ?? 0.6)]
    } else {
      rel.signals = rel.signals.map((s) => ({
        ...s,
        type: s.type ?? signalTypeFromRelationshipName(rel.relationship),
      }))
    }
  }

  return rels
}

function augmentCustomLookup(
  identifier: string,
  indexes: EntityCatalogIndexes<CanonicalAugment>,
): CanonicalAugment | null {
  const trimmed = normalizeAugmentWhitespace(identifier)
  if (!trimmed) return null

  const hitId = indexes.byCanonicalId.get(trimmed)
  if (hitId) return hitId

  const apiKey = normalizeAugmentApiKey(trimmed)
  const hitApi = indexes.byApiName.get(apiKey)
  if (hitApi) return hitApi

  const normId = normalizeAugmentIdentifier(trimmed)
  const normKey = normalizeAugmentNameKey(normId)
  const hitNorm =
    indexes.byName.get(normKey) ?? indexes.byName.get(normalizeAugmentNameKey(trimmed))
  if (hitNorm) return hitNorm

  const lower = trimmed.toLowerCase()
  const hitLower = indexes.byName.get(lower) ?? indexes.byName.get(normId.toLowerCase())
  if (hitLower) return hitLower

  if (/^TFT/i.test(trimmed)) {
    const human = normalizeAugmentDisplayName(trimmed)
    const humanKey = normalizeAugmentNameKey(human)
    const hitHuman = indexes.byName.get(humanKey) ?? indexes.byName.get(human.toLowerCase())
    if (hitHuman) return hitHuman
  }

  return null
}

/** Load augments for a catalog version into the entity + relationship registries. */
export function bootstrapAugmentCatalog(version?: CanonicalDataVersion): void {
  const catalog = getMergedAugmentCatalog(version)
  const key = `${catalog.version.set}:${catalog.version.patch}:${catalog.version.locale}`
  if (bootstrappedVersionKey === key) return

  const augments = [...catalog.byApiName.values()]
  attachPatchCatalogBundle(catalog.version, { augment: augments })
  registerRelationships(augments.flatMap(augmentRelationships))
  bootstrappedVersionKey = key
}

export function ensureAugmentEntityProvider(): void {
  registerEntityResolver('augment', augmentCustomLookup)
  bootstrapAugmentCatalog()
}

/** @internal Test-only */
export function resetAugmentEntityProvider(): void {
  bootstrappedVersionKey = null
  resetCanonicalEntityRegistry()
  resetRelationshipRegistry()
}
