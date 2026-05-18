import type { RelationshipSignal } from '@/types/relationshipSignal'

export type CanonicalRelationship = {
  sourceId: string
  targetId: string
  relationship: string
  weight?: number
  signals?: RelationshipSignal[]
  /** True when inferred from static catalog fields rather than analytics */
  derived?: boolean
  metadata?: Record<string, unknown>
}
