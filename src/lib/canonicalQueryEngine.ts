/**
 * @internal Engine-only canonical graph queries. UI and product surfaces must use
 * `@/lib/intentQueryEngine` instead of importing this module directly.
 */
import { resolveCatalogVersion } from '@/lib/canonicalDataVersion'
import { listEntities } from '@/lib/canonicalEntityRegistry'
import { ensureAugmentEntityProvider } from '@/lib/entityProviders/augmentEntityProvider'
import { listRelationships } from '@/lib/canonicalRelationshipRegistry'
import {
  mergeRelationshipSignals,
  relationshipMeetsConfidence,
  scoreRelationship,
} from '@/lib/relationshipScoring'
import {
  scoreEntityRecommendation,
  scoreRelationshipRecommendation,
} from '@/engine/recommendations/scoring'
import type { EntityRecommendationScore, RelationshipRecommendationScore, ScoreContext } from '@/engine/recommendations/scoring'
import type { CanonicalRelationship } from '@/types/canonicalRelationship'
import type { CanonicalEntity, CanonicalEntityType } from '@/types/canonicalEntity'
import type { RecommendationIntent } from '@/types/recommendationIntent'
import type { RelationshipSignalType } from '@/types/relationshipSignal'
import { INTENT_SIGNAL_AFFINITY } from '@/types/recommendationIntent'

export type EntityQuery = {
  type: CanonicalEntityType
  set?: number
  patch?: string
  locale?: string
  search?: string
  intent?: RecommendationIntent
  /** Use recommendation scoring pipeline (default true) */
  useScoring?: boolean
  minConfidence?: number
}

export type RelationshipQuery = {
  sourceId?: string
  targetId?: string
  relationship?: string
  signalTypes?: RelationshipSignalType[]
  set?: number
  patch?: string
  intent?: RecommendationIntent
  minConfidence?: number
  derived?: boolean
  useScoring?: boolean
  sourceWinRate?: number
}

export type TraversalOptions = {
  set?: number
  patch?: string
  locale?: string
  depth?: number
  minConfidence?: number
  relationshipTypes?: string[]
  signalTypes?: RelationshipSignalType[]
  intent?: RecommendationIntent
  useScoring?: boolean
}

export type ScoredRelationship = CanonicalRelationship & { score: number }

export type RankedEntityResult = EntityRecommendationScore
export type RankedRelationshipResult = RelationshipRecommendationScore

function ensureAugmentGraphLoaded(options?: { set?: number; patch?: string }): void {
  ensureAugmentEntityProvider()
}

function buildScoreContext(query: {
  set?: number
  patch?: string
  intent?: RecommendationIntent
  sourceWinRate?: number
}): ScoreContext {
  const version = resolveCatalogVersion(query)
  return {
    intent: query.intent,
    set: version.set,
    patch: version.patch,
    currentPatch: version.patch,
    sourceWinRate: query.sourceWinRate,
  }
}

function matchesVersion(
  item: { set?: number; patch?: string },
  version: { set: number; patch: string },
): boolean {
  if (item.patch != null && item.patch !== version.patch) return false
  if (item.set != null && item.set !== version.set) return false
  return true
}

function intentSignalTypes(intent?: RecommendationIntent): RelationshipSignalType[] | undefined {
  if (!intent) return undefined
  return INTENT_SIGNAL_AFFINITY[intent] as RelationshipSignalType[]
}

function filterRelationships(query: RelationshipQuery): CanonicalRelationship[] {
  const version = resolveCatalogVersion(query)
  const minConfidence = query.minConfidence ?? 0
  const intentTypes = query.signalTypes ?? intentSignalTypes(query.intent)

  return listRelationships().filter((rel) => {
    if (query.sourceId && rel.sourceId !== query.sourceId) return false
    if (query.targetId && rel.targetId !== query.targetId) return false
    if (query.relationship && rel.relationship !== query.relationship) return false
    if (query.derived != null && Boolean(rel.derived) !== query.derived) return false

    if (intentTypes?.length) {
      const types = new Set(rel.signals?.map((s) => s.type) ?? [])
      if (!intentTypes.some((t) => types.has(t))) return false
    }

    if (rel.signals?.length) {
      const patchOk = rel.signals.some((s) => matchesVersion(s, version))
      if (!patchOk && (query.patch != null || query.set != null)) return false
    }

    if (query.useScoring === false) {
      return relationshipMeetsConfidence(rel, minConfidence)
    }
    return true
  })
}

/** Rank entities through the recommendation scoring pipeline. */
export function rankEntities(
  entities: CanonicalEntity[],
  ctx: ScoreContext,
): RankedEntityResult[] {
  return entities
    .map((entity) => scoreEntityRecommendation(entity, ctx))
    .filter((row) => row.calibratedConfidence >= (ctx.minConfidence ?? 0))
    .sort((a, b) => b.score - a.score)
}

/** Rank relationships through scoring + feedback adjustment. */
export function rankRelationships(
  relationships: CanonicalRelationship[],
  ctx: ScoreContext,
): RankedRelationshipResult[] {
  return relationships
    .map((rel) => scoreRelationshipRecommendation(rel, ctx))
    .filter((row) => row.calibratedConfidence >= (ctx.minConfidence ?? 0))
    .sort((a, b) => b.score - a.score)
}

/** Query canonical entities — use this instead of direct registry access. */
export function queryEntities<T extends CanonicalEntity = CanonicalEntity>(
  query: EntityQuery,
): T[] {
  ensureAugmentGraphLoaded(query)
  const version = resolveCatalogVersion(query)
  let rows = listEntities<T>(query.type, version) as T[]

  if (query.search?.trim()) {
    const q = query.search.trim().toLowerCase()
    rows = rows.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.canonicalId.toLowerCase() === q ||
        (e.apiName?.toLowerCase().includes(q) ?? false),
    )
  }

  if (query.useScoring !== false && query.intent) {
    const ctx = { ...buildScoreContext(query), minConfidence: query.minConfidence }
    const ranked = rankEntities(rows, ctx)
    return ranked.map((r) => r.entity) as T[]
  }

  return rows
}

/** Query entities with full recommendation scores (product-facing). */
export function queryEntitiesRanked(query: EntityQuery): RankedEntityResult[] {
  ensureAugmentGraphLoaded(query)
  const version = resolveCatalogVersion(query)
  const rows = listEntities(query.type, version)
  const ctx = { ...buildScoreContext(query), minConfidence: query.minConfidence ?? 0 }
  let ranked = rankEntities(rows, ctx)
  if (query.search?.trim()) {
    const q = query.search.trim().toLowerCase()
    ranked = ranked.filter(
      (r) =>
        r.entity.name.toLowerCase().includes(q) ||
        r.entity.canonicalId.toLowerCase() === q,
    )
  }
  return ranked
}

/** Query relationship edges with patch, intent, and scoring pipeline. */
export function queryRelationships(query: RelationshipQuery = {}): ScoredRelationship[] {
  ensureAugmentGraphLoaded(query)
  const ctx = { ...buildScoreContext(query), minConfidence: query.minConfidence ?? 0 }

  if (query.useScoring === false) {
    return filterRelationships(query)
      .map((rel) => ({ ...rel, score: scoreRelationship(rel) }))
      .filter((rel) => rel.score >= (query.minConfidence ?? 0))
      .sort((a, b) => b.score - a.score)
  }

  const ranked = rankRelationships(filterRelationships(query), ctx)
  return ranked.map((r) => ({ ...r.relationship, score: r.score }))
}

/** Product-facing relationship query with full scoring metadata. */
export function queryRelationshipsRanked(
  query: RelationshipQuery = {},
): RankedRelationshipResult[] {
  ensureAugmentGraphLoaded(query)
  const ctx = { ...buildScoreContext(query), minConfidence: query.minConfidence ?? 0 }
  return rankRelationships(filterRelationships(query), ctx)
}

export type ConnectedEntity = {
  entity: CanonicalEntity | null
  relationship: ScoredRelationship
  direction: 'outgoing' | 'incoming'
}

/** BFS traversal from a canonicalId across relationship edges. */
export function resolveConnectedEntities(
  startCanonicalId: string,
  entityType: CanonicalEntityType,
  options: TraversalOptions = {},
): ConnectedEntity[] {
  ensureAugmentGraphLoaded(options)
  const depth = Math.max(1, options.depth ?? 2)
  const minConfidence = options.minConfidence ?? 0
  const ctx = buildScoreContext(options)
  const visited = new Set<string>([startCanonicalId])
  const out: ConnectedEntity[] = []

  let frontier = [startCanonicalId]

  for (let d = 0; d < depth; d++) {
    const nextFrontier: string[] = []
    for (const nodeId of frontier) {
      const relQuery: RelationshipQuery = {
        sourceId: nodeId,
        set: options.set,
        patch: options.patch,
        intent: options.intent,
        signalTypes: options.signalTypes ?? intentSignalTypes(options.intent),
        useScoring: options.useScoring,
        minConfidence,
      }

      const outgoing = queryRelationships(relQuery)
      const incoming = queryRelationships({
        set: options.set,
        patch: options.patch,
        targetId: nodeId,
        intent: options.intent,
        signalTypes: options.signalTypes ?? intentSignalTypes(options.intent),
        useScoring: options.useScoring,
        minConfidence,
      })

      for (const rel of outgoing) {
        const target = queryEntities({
          type: entityType,
          set: options.set,
          patch: options.patch,
          locale: options.locale,
          search: rel.targetId,
          useScoring: false,
        })[0] ?? null

        out.push({ entity: target, relationship: rel, direction: 'outgoing' })

        if (!visited.has(rel.targetId)) {
          visited.add(rel.targetId)
          nextFrontier.push(rel.targetId)
        }
      }

      for (const rel of incoming) {
        const source = queryEntities({
          type: entityType,
          set: options.set,
          patch: options.patch,
          locale: options.locale,
          search: rel.sourceId,
          useScoring: false,
        })[0] ?? null

        out.push({ entity: source, relationship: rel, direction: 'incoming' })

        if (!visited.has(rel.sourceId)) {
          visited.add(rel.sourceId)
          nextFrontier.push(rel.sourceId)
        }
      }
    }
    frontier = nextFrontier
  }

  return out
}

/** Top-N relationships for a source node ranked by recommendation scoring. */
export function resolveTopRelationships(
  sourceCanonicalId: string,
  options: TraversalOptions & { limit?: number; sourceWinRate?: number } = {},
): ScoredRelationship[] {
  ensureAugmentGraphLoaded(options)
  const limit = options.limit ?? 10

  return queryRelationships({
    sourceId: sourceCanonicalId,
    set: options.set,
    patch: options.patch,
    intent: options.intent,
    signalTypes: options.signalTypes ?? intentSignalTypes(options.intent),
    relationship: options.relationshipTypes?.[0],
    minConfidence: options.minConfidence ?? 0,
    useScoring: options.useScoring,
    sourceWinRate: options.sourceWinRate,
  }).slice(0, limit)
}

export { mergeRelationshipSignals, scoreRelationship }
