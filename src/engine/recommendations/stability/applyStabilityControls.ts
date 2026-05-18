import type { CalibrationInput } from '@/engine/recommendations/scoring/applyConfidenceCalibration'
import { confidenceDecayForPatch } from './confidenceDecay'
import { evaluateMinimumDataGuards, applyMinimumDataCap } from './minimumDataGuards'
import { sampleSizeConfidenceScale } from './sampleSizeThresholds'
import type { RelationshipSignalType } from '@/types/relationshipSignal'

export type StabilityInput = CalibrationInput & {
  entityPatch?: string
  currentPatch?: string
  signalType?: RelationshipSignalType
  hasStats?: boolean
}

export type StabilityResult = {
  calibratedScore: number
  patchDecay: number
  sampleScale: number
  dataGuard: ReturnType<typeof evaluateMinimumDataGuards>
}

/**
 * Applies sample thresholds, patch decay, and minimum-data guards on top of raw calibration.
 */
export function applyStabilityControls(input: StabilityInput): StabilityResult {
  const patchDecay = confidenceDecayForPatch(input.entityPatch, input.currentPatch)
  const sampleScale = sampleSizeConfidenceScale(input.sampleSize ?? 0, input.signalType)

  const dataGuard = evaluateMinimumDataGuards({
    sampleSize: input.sampleSize ?? 0,
    signalType: input.signalType,
    hasStats: input.hasStats,
    patchMatches: input.entityPatch == null || input.entityPatch === input.currentPatch,
  })

  let score = input.rawScore * patchDecay
  score *= 0.7 + 0.3 * sampleScale

  if (input.sampleSize != null && input.sampleSize > 0) {
    const sampleBoost = Math.min(1, 0.55 + Math.log10(input.sampleSize + 1) / 4)
    score *= sampleBoost
  } else if (input.sampleSize === 0) {
    score *= 0.75
  }

  if (input.patchStability != null) {
    score *= 0.65 + 0.35 * Math.min(1, Math.max(0, input.patchStability))
  }

  if (input.derived) {
    score *= 0.88
  }

  score = applyMinimumDataCap(score, dataGuard)

  return {
    calibratedScore: Math.min(1, Math.max(0, score)),
    patchDecay,
    sampleScale,
    dataGuard,
  }
}
