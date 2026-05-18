/**

 * Product-facing recommendation query API.

 * All recommendation consumers (UI, overlay, coach) must use this module — not scoring or canonicalQueryEngine.

 */

import { resolveCatalogVersion } from '@/lib/canonicalDataVersion'

import {

  queryEntitiesRanked,

  queryRelationshipsRanked,

  resolveConnectedEntities,

  type EntityQuery,

  type RelationshipQuery,

} from '@/lib/canonicalQueryEngine'

import {

  buildRecommendationRationale,

  explainEntityRecommendation,

  explainRelationshipRecommendation,

} from '@/engine/recommendations/explainability'

import type { RecommendationExplanation, RecommendationRationale } from '@/engine/recommendations/explainability'

import { recordIntentQuery } from '@/engine/recommendations/monitoring'

import type { EntityRecommendationScore, RelationshipRecommendationScore } from '@/engine/recommendations/scoring'

import type { CanonicalAugment } from '@/types/canonicalAugment'

import type { CanonicalEntityType } from '@/types/canonicalEntity'

import type { RecommendationIntent } from '@/types/recommendationIntent'



export type IntentQueryOptions = {

  type?: CanonicalEntityType

  set?: number

  patch?: string

  locale?: string

  intent: RecommendationIntent

  minConfidence?: number

  limit?: number

  search?: string

  /** When true, attaches per-row explanation payloads (default false for backward compatibility). */

  includeExplanation?: boolean

}



export type TransitionPath = {

  steps: RelationshipRecommendationScore[]

  totalScore: number

  targetId: string

}



export type EntityRecommendationWithExplanation = EntityRecommendationScore & {

  explanation?: RecommendationExplanation

}



export type RelationshipRecommendationWithExplanation = RelationshipRecommendationScore & {

  explanation?: RecommendationExplanation

}



export type IntentQueryWithRationale = {

  entities: EntityRecommendationWithExplanation[]

  relationships: RelationshipRecommendationWithExplanation[]

  rationale: RecommendationRationale

}



function attachEntityExplanations(

  rows: EntityRecommendationScore[],

  include: boolean,

): EntityRecommendationWithExplanation[] {

  if (!include) return rows

  return rows.map((row) => ({

    ...row,

    explanation: explainEntityRecommendation(row.entity.canonicalId, row),

  }))

}



function attachRelationshipExplanations(

  rows: RelationshipRecommendationScore[],

  include: boolean,

): RelationshipRecommendationWithExplanation[] {

  if (!include) return rows

  return rows.map((row) => ({

    ...row,

    explanation: explainRelationshipRecommendation(

      {

        sourceId: row.relationship.sourceId,

        targetId: row.relationship.targetId,

        relationship: row.relationship.relationship,

      },

      row,

    ),

  }))

}



function trackQuery(

  intent: RecommendationIntent,

  entities: EntityRecommendationScore[],

  relationships: RelationshipRecommendationScore[],

  patch?: string,

): void {

  recordIntentQuery(intent, entities, relationships, patch)

}



/** Intent-filtered entity + relationship query (wraps canonicalQueryEngine). */

export function queryByIntent(options: IntentQueryOptions): {

  entities: EntityRecommendationWithExplanation[]

  relationships: RelationshipRecommendationWithExplanation[]

} {

  const version = resolveCatalogVersion(options)

  const entityQuery: EntityQuery = {

    type: options.type ?? 'augment',

    set: version.set,

    patch: version.patch,

    locale: options.locale,

    intent: options.intent,

    minConfidence: options.minConfidence ?? 0.35,

    useScoring: true,

    search: options.search,

  }



  const entities = queryEntitiesRanked(entityQuery).slice(0, options.limit ?? 50)

  const relationships = queryRelationshipsRanked({

    set: version.set,

    patch: version.patch,

    intent: options.intent,

    minConfidence: options.minConfidence ?? 0.35,

    useScoring: true,

  }).slice(0, options.limit ?? 50)



  trackQuery(options.intent, entities, relationships, version.patch)



  return {

    entities: attachEntityExplanations(entities, options.includeExplanation ?? false),

    relationships: attachRelationshipExplanations(relationships, options.includeExplanation ?? false),

  }

}



/** Intent-filtered query with full rationale bundle for UI. */

export function queryByIntentWithRationale(options: IntentQueryOptions): IntentQueryWithRationale {

  const version = resolveCatalogVersion(options)

  const withExplain = { ...options, includeExplanation: true }

  const { entities, relationships } = queryByIntent(withExplain)



  const rationale = buildRecommendationRationale({

    intent: options.intent,

    patch: version.patch,

    set: version.set,

    entities: entities.map(({ explanation: _e, ...row }) => row),

    relationships: relationships.map(({ explanation: _e, ...row }) => row),

    maxSummaries: options.limit ?? 5,

  })



  return { entities, relationships, rationale }

}



/** Rank entities for a gameplay intent. */

export function rankEntitiesForIntent(

  options: IntentQueryOptions,

): EntityRecommendationWithExplanation[] {

  return queryByIntent(options).entities

}



/** Rank entities with per-row explanations (coach / augment guide). */

export function rankEntitiesForIntentWithExplanation(

  options: IntentQueryOptions,

): EntityRecommendationWithExplanation[] {

  return rankEntitiesForIntent({ ...options, includeExplanation: true })

}



/** Best transition paths from a starting augment toward high-confidence transition edges. */

export function resolveBestTransitionPaths(

  startCanonicalId: string,

  options: IntentQueryOptions & { maxDepth?: number },

): TransitionPath[] {

  const version = resolveCatalogVersion(options)

  const depth = options.maxDepth ?? 2

  const minConfidence = options.minConfidence ?? 0.4



  const source = queryEntitiesRanked({

    type: 'augment',

    set: version.set,

    patch: version.patch,

    search: startCanonicalId,

    useScoring: true,

  })[0]?.entity as CanonicalAugment | undefined



  const sourceWinRate = source?.stats?.winRate



  const connected = resolveConnectedEntities(startCanonicalId, options.type ?? 'augment', {

    set: version.set,

    patch: version.patch,

    depth,

    intent: options.intent ?? 'transition',

    minConfidence,

    useScoring: true,

  })



  const paths: TransitionPath[] = []



  for (const step of connected) {

    const ranked = queryRelationshipsRanked({

      sourceId: startCanonicalId,

      targetId: step.relationship.targetId,

      set: version.set,

      patch: version.patch,

      intent: 'transition',

      minConfidence,

      sourceWinRate,

      useScoring: true,

    })



    if (ranked.length === 0) continue



    const totalScore = ranked.reduce((sum, r) => sum + r.score, 0) / ranked.length

    paths.push({

      steps: ranked,

      totalScore,

      targetId: step.relationship.targetId,

    })

  }



  return paths.sort((a, b) => b.totalScore - a.totalScore).slice(0, options.limit ?? 5)

}



/** Ranked augment recommendations for overlay/coach surfaces. */

export function queryAugmentRecommendations(

  options: Omit<IntentQueryOptions, 'type'>,

): EntityRecommendationWithExplanation[] {

  return rankEntitiesForIntent({ ...options, type: 'augment' })

}



/** Scored relationship context for a picked augment (intent-aware). */

export function queryAugmentRelationshipRecommendations(

  canonicalId: string,

  options?: Omit<IntentQueryOptions, 'search'> & { sourceWinRate?: number },

): RelationshipRecommendationWithExplanation[] {

  const version = resolveCatalogVersion(options)

  const rows = queryRelationshipsRanked({

    sourceId: canonicalId,

    set: version.set,

    patch: version.patch,

    intent: options?.intent,

    minConfidence: options?.minConfidence ?? 0.35,

    sourceWinRate: options?.sourceWinRate,

    useScoring: true,

  })



  if (options?.intent) {

    trackQuery(options.intent, [], rows, version.patch)

  }



  return attachRelationshipExplanations(rows, options?.includeExplanation ?? false)

}

/** UI-safe explanation types (do not import explainability module from components). */
export type {
  RecommendationExplanation,
  RecommendationRationale,
} from '@/engine/recommendations/explainability'

