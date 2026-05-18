export {
  MIN_SAMPLE_BY_SIGNAL_TYPE,
  sampleSizeMeetsThreshold,
  sampleSizeConfidenceScale,
} from './sampleSizeThresholds'
export { confidenceDecayForPatch, patchDistance } from './confidenceDecay'
export { smoothFeedbackDelta, emaFeedbackAdjustment } from './feedbackSmoothing'
export {
  evaluateMinimumDataGuards,
  applyMinimumDataCap,
  type MinimumDataContext,
  type MinimumDataGuardResult,
} from './minimumDataGuards'
export { applyStabilityControls, type StabilityInput, type StabilityResult } from './applyStabilityControls'
