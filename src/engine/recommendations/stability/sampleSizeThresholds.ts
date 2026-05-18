import type { RelationshipSignalType } from '@/types/relationshipSignal'

/** Minimum sample depth required before a signal type fully contributes to scoring. */
export const MIN_SAMPLE_BY_SIGNAL_TYPE: Record<RelationshipSignalType, number> = {
  synergy: 25,
  counter: 30,
  transition: 20,
  core: 40,
  fallback: 15,
  tempo: 25,
}

export function sampleSizeMeetsThreshold(
  sampleSize: number,
  signalType?: RelationshipSignalType,
): boolean {
  if (sampleSize <= 0) return false
  if (!signalType) return sampleSize >= 10
  return sampleSize >= MIN_SAMPLE_BY_SIGNAL_TYPE[signalType]
}

/** Scale confidence contribution by how close sample size is to the threshold (0–1). */
export function sampleSizeConfidenceScale(
  sampleSize: number,
  signalType?: RelationshipSignalType,
): number {
  const min = signalType ? MIN_SAMPLE_BY_SIGNAL_TYPE[signalType] : 10
  if (sampleSize <= 0) return 0
  if (sampleSize >= min * 2) return 1
  return Math.min(1, sampleSize / min)
}
