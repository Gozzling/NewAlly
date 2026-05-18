import { trackUnresolvedEntity } from '@/lib/canonicalEntityTelemetry'
import type { CanonicalDataVersion } from '@/types/canonicalCatalog'

export type UnresolvedAugmentTelemetry = {
  identifier: string
  source: string
  patch: string
  set: number
  context?: string
}

/** @deprecated Prefer trackUnresolvedEntity — augment-specific wrapper */
export function trackUnresolvedAugment(payload: UnresolvedAugmentTelemetry): void {
  trackUnresolvedEntity({
    type: 'augment',
    identifier: payload.identifier,
    source: payload.source,
    patch: payload.patch,
    set: payload.set,
    context: payload.context,
  })
}

export { resetEntityTelemetryDedupe as resetAugmentTelemetryDedupe } from '@/lib/canonicalEntityTelemetry'

export function trackUnresolvedForVersion(
  identifier: string,
  version: CanonicalDataVersion,
  source: string,
  context?: string,
): void {
  trackUnresolvedEntity({
    type: 'augment',
    identifier,
    source,
    patch: version.patch,
    set: version.set,
    context,
  })
}
