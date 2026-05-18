import { notifyTelemetry } from '@/engine/events/telemetryBridge'
import type { CanonicalEntityType } from '@/types/canonicalEntity'

export type UnresolvedEntityTelemetry = {
  type: CanonicalEntityType
  identifier: string
  source: string
  patch: string
  set: number
  context?: string
}

const unresolvedLogged = new Set<string>()

function dedupeKey(payload: UnresolvedEntityTelemetry): string {
  return `${payload.type}:${payload.set}:${payload.patch}:${payload.identifier.toLowerCase()}`
}

/** Structured telemetry for any canonical entity resolver miss. */
export function trackUnresolvedEntity(payload: UnresolvedEntityTelemetry): void {
  const key = dedupeKey(payload)
  if (unresolvedLogged.has(key)) return
  unresolvedLogged.add(key)

  notifyTelemetry({
    kind: 'entity_unresolved',
    entityType: payload.type,
    identifier: payload.identifier,
    source: payload.source,
    patch: payload.patch,
    set: payload.set,
    context: payload.context ?? null,
    timestampMs: Date.now(),
  })

  if (payload.type === 'augment') {
    notifyTelemetry({
      kind: 'augment_unresolved',
      identifier: payload.identifier,
      source: payload.source,
      patch: payload.patch,
      set: payload.set,
      context: payload.context ?? null,
      timestampMs: Date.now(),
    })
  }
}

/** @internal Test-only */
export function resetEntityTelemetryDedupe(): void {
  unresolvedLogged.clear()
}
