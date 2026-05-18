import type { CanonicalRelationship } from '@/types/canonicalRelationship'
import { mergeRelationshipSignals } from '@/lib/relationshipScoring'

function pairKey(sourceId: string, targetId: string, relationship: string): string {
  return `${sourceId}→${relationship}→${targetId}`
}

type RelationshipIndexes = {
  all: CanonicalRelationship[]
  bySource: Map<string, CanonicalRelationship[]>
  byTarget: Map<string, CanonicalRelationship[]>
  byPair: Map<string, CanonicalRelationship>
}

const indexes: RelationshipIndexes = {
  all: [],
  bySource: new Map(),
  byTarget: new Map(),
  byPair: new Map(),
}

function pushToIndex(map: Map<string, CanonicalRelationship[]>, key: string, rel: CanonicalRelationship): void {
  const list = map.get(key) ?? []
  list.push(rel)
  map.set(key, list)
}

function mergeIntoExisting(existing: CanonicalRelationship, incoming: CanonicalRelationship): CanonicalRelationship {
  return {
    ...existing,
    weight: incoming.weight ?? existing.weight,
    derived: incoming.derived ?? existing.derived,
    signals: mergeRelationshipSignals(existing.signals, incoming.signals),
    metadata: { ...existing.metadata, ...incoming.metadata },
  }
}

function replaceInList(list: CanonicalRelationship[], prev: CanonicalRelationship, next: CanonicalRelationship): void {
  const idx = list.indexOf(prev)
  if (idx >= 0) list[idx] = next
}

export function registerRelationship(rel: CanonicalRelationship): void {
  const key = pairKey(rel.sourceId, rel.targetId, rel.relationship)
  const existing = indexes.byPair.get(key)
  if (existing) {
    const merged = mergeIntoExisting(existing, rel)
    indexes.byPair.set(key, merged)
    replaceInList(indexes.all, existing, merged)
    const srcList = indexes.bySource.get(rel.sourceId)
    if (srcList) replaceInList(srcList, existing, merged)
    const tgtList = indexes.byTarget.get(rel.targetId)
    if (tgtList) replaceInList(tgtList, existing, merged)
    return
  }

  indexes.all.push(rel)
  pushToIndex(indexes.bySource, rel.sourceId, rel)
  pushToIndex(indexes.byTarget, rel.targetId, rel)
  indexes.byPair.set(key, rel)
}

export function registerRelationships(rels: CanonicalRelationship[]): void {
  for (const rel of rels) registerRelationship(rel)
}

export function getRelationshipsFromSource(sourceId: string): CanonicalRelationship[] {
  return indexes.bySource.get(sourceId) ?? []
}

export function getRelationshipsToTarget(targetId: string): CanonicalRelationship[] {
  return indexes.byTarget.get(targetId) ?? []
}

export function getRelationship(
  sourceId: string,
  targetId: string,
  relationship: string,
): CanonicalRelationship | undefined {
  return indexes.byPair.get(pairKey(sourceId, targetId, relationship))
}

export function listRelationships(): CanonicalRelationship[] {
  return [...indexes.byPair.values()]
}

/** @internal Test-only */
export function resetRelationshipRegistry(): void {
  indexes.all = []
  indexes.bySource.clear()
  indexes.byTarget.clear()
  indexes.byPair.clear()
}
