import { sampleSizeMeetsThreshold } from './sampleSizeThresholds'
import type { RelationshipSignalType } from '@/types/relationshipSignal'

export type MinimumDataContext = {
  sampleSize: number
  signalType?: RelationshipSignalType
  hasStats?: boolean
  patchMatches?: boolean
}

export type MinimumDataGuardResult = {
  passes: boolean
  reasons: string[]
  /** Score cap when data is thin (0–1); 1 = no cap */
  confidenceCap: number
}

export function evaluateMinimumDataGuards(ctx: MinimumDataContext): MinimumDataGuardResult {
  const reasons: string[] = []
  let confidenceCap = 1

  if (ctx.sampleSize <= 0) {
    reasons.push('insufficient_sample')
    confidenceCap = Math.min(confidenceCap, 0.55)
  } else if (!sampleSizeMeetsThreshold(ctx.sampleSize, ctx.signalType)) {
    reasons.push('below_signal_sample_threshold')
    confidenceCap = Math.min(confidenceCap, 0.72)
  }

  if (ctx.hasStats === false) {
    reasons.push('missing_historical_stats')
    confidenceCap = Math.min(confidenceCap, 0.65)
  }

  if (ctx.patchMatches === false) {
    reasons.push('patch_mismatch')
    confidenceCap = Math.min(confidenceCap, 0.78)
  }

  return {
    passes: reasons.length === 0,
    reasons,
    confidenceCap,
  }
}

export function applyMinimumDataCap(score: number, guard: MinimumDataGuardResult): number {
  return Math.min(score, guard.confidenceCap)
}
