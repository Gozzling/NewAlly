export const DOMAIN_EVENT_TYPES = [
  'AUGMENT_PICKED',
  'ITEM_EQUIPPED',
  'TRAIT_ACTIVATED',
  'ROUND_STARTED',
  'PLAYER_DAMAGED',
] as const

export type DomainEventType = (typeof DOMAIN_EVENT_TYPES)[number]

export type DomainEventPayloads = {
  AUGMENT_PICKED: {
    canonicalId: string | null
    displayName: string
    slot: number
    rawId?: string | null
  }
  ITEM_EQUIPPED: {
    unitName: string
    itemName: string
    slot: number
  }
  TRAIT_ACTIVATED: {
    traitId: string
    displayName: string
    unitCount: number
    tier: number
  }
  ROUND_STARTED: {
    round: number
    stage?: string
  }
  PLAYER_DAMAGED: {
    damage: number
    remainingHealth: number
  }
}

export type DomainEvent<T extends DomainEventType = DomainEventType> = {
  type: T
  timestampMs: number
  matchId?: string
  set?: number
  patch?: string
  payload: DomainEventPayloads[T]
}

export function createDomainEvent<T extends DomainEventType>(
  type: T,
  payload: DomainEventPayloads[T],
  meta?: Pick<DomainEvent<T>, 'timestampMs' | 'matchId' | 'set' | 'patch'>,
): DomainEvent<T> {
  return {
    type,
    timestampMs: meta?.timestampMs ?? Date.now(),
    matchId: meta?.matchId,
    set: meta?.set,
    patch: meta?.patch,
    payload,
  }
}
