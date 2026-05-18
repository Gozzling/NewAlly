import { clamp01 } from '@/engine/recommendations/confidence'
import { applyStabilityControls } from '@/engine/recommendations/stability'
import type { RelationshipSignalType } from '@/types/relationshipSignal'

export type CalibrationInput = {
  rawScore: number
  sampleSize?: number
  patchStability?: number
  derived?: boolean
  entityPatch?: string
  currentPatch?: string
  signalType?: RelationshipSignalType
  hasStats?: boolean
}

/**
 * Calibrate a raw 0–1 score using sample depth, patch stability, derived-signal penalty,
 * and production stability controls (decay, guards, thresholds).
 */
export function applyConfidenceCalibration(input: CalibrationInput): number {
  const result = applyStabilityControls({
    rawScore: clamp01(input.rawScore),
    sampleSize: input.sampleSize,
    patchStability: input.patchStability,
    derived: input.derived,
    entityPatch: input.entityPatch,
    currentPatch: input.currentPatch,
    signalType: input.signalType,
    hasStats: input.hasStats,
  })
  return result.calibratedScore
}
