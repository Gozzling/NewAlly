/** Registered entity kinds — extend as items, traits, and champions migrate. */
export type CanonicalEntityType = 'augment' | 'item' | 'trait' | 'champion'

export type CanonicalEntityMetadata = {
  sourceChain?: string[]
  completeness?: Record<string, boolean>
}

export type CanonicalEntity<TType extends CanonicalEntityType = CanonicalEntityType> = {
  canonicalId: string
  type: TType

  apiName?: string
  name: string

  set?: number
  patch?: string
  locale?: string

  source?: string

  metadata?: CanonicalEntityMetadata
}

export type ResolveEntityOptions = {
  set?: number
  patch?: string
  locale?: string
  context?: string
  /** Skip unresolved telemetry (display-only lookups) */
  silent?: boolean
}
