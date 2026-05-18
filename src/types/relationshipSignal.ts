export type RelationshipSignalType =
  | 'synergy'
  | 'counter'
  | 'transition'
  | 'core'
  | 'fallback'
  | 'tempo'

export type RelationshipSignal = {
  type: RelationshipSignalType
  confidence: number
  patch?: string
  set?: number
  sampleSize?: number
  source?: string
}
