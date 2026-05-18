import type { CanonicalRelationship } from '@/types/canonicalRelationship'
import type { RelationshipSignal, RelationshipSignalType } from '@/types/relationshipSignal'

const SIGNAL_TYPE_WEIGHT: Record<RelationshipSignalType, number> = {
  synergy: 1,
  core: 0.95,
  tempo: 0.85,
  transition: 0.8,
  counter: 0.75,
  fallback: 0.5,
}

function signalKey(sig: RelationshipSignal): string {
  return `${sig.type}:${sig.patch ?? ''}:${sig.set ?? ''}:${sig.source ?? ''}`
}

/** Combine duplicate signal rows — keeps highest confidence per type/patch/source key. */
export function mergeRelationshipSignals(
  existing: RelationshipSignal[] = [],
  incoming: RelationshipSignal[] = [],
): RelationshipSignal[] {
  const map = new Map<string, RelationshipSignal>()
  for (const sig of [...existing, ...incoming]) {
    const key = signalKey(sig)
    const prev = map.get(key)
    if (!prev || sig.confidence > prev.confidence) {
      map.set(key, { ...sig })
    }
  }
  return [...map.values()]
}

/** Clamp relationship weight to 0–1 using explicit weight and signal confidences. */
export function normalizeRelationshipWeight(
  weight?: number,
  signals?: RelationshipSignal[],
): number {
  const base = Math.min(1, Math.max(0, weight ?? 0.5))
  if (!signals?.length) return base

  let weighted = 0
  let totalTypeWeight = 0
  for (const sig of signals) {
    const tw = SIGNAL_TYPE_WEIGHT[sig.type] ?? 0.7
    weighted += Math.min(1, Math.max(0, sig.confidence)) * tw
    totalTypeWeight += tw
  }
  const signalScore = totalTypeWeight > 0 ? weighted / totalTypeWeight : base
  return Math.min(1, Math.max(0, base * 0.4 + signalScore * 0.6))
}

/** Explainable score for ranking graph edges in recommendations. */
export function scoreRelationship(rel: CanonicalRelationship): number {
  return normalizeRelationshipWeight(rel.weight, rel.signals)
}

export function relationshipMeetsConfidence(
  rel: CanonicalRelationship,
  minConfidence: number,
): boolean {
  return scoreRelationship(rel) >= minConfidence
}

/** Map legacy relationship string labels to signal types. */
export function signalTypeFromRelationshipName(relationship: string): RelationshipSignalType {
  const r = relationship.toLowerCase()
  if (r.includes('counter')) return 'counter'
  if (r.includes('synergy') || r.includes('trait')) return 'synergy'
  if (r.includes('comp') || r.includes('core')) return 'core'
  if (r.includes('tempo')) return 'tempo'
  if (r.includes('transition') || r.includes('pivot')) return 'transition'
  return 'fallback'
}

export function defaultSignalForRelationship(
  rel: CanonicalRelationship,
  confidence = 0.6,
): RelationshipSignal {
  return {
    type: signalTypeFromRelationshipName(rel.relationship),
    confidence,
    source: rel.derived ? 'catalog_derived' : 'catalog',
  }
}
