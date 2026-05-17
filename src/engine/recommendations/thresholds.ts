/**
 * Central tuning knobs for overlay / coach recommendation strategies.
 * Adjust here rather than scattering magic numbers across strategy files.
 */
export const RECOMMENDATION_THRESHOLDS = {
  economy: {
    /** Suggest building toward 10/20/50 when below this gold and healthy. */
    interestBuildGoldMax: 48,
    interestBuildHpMin: 38,
    /** Bank interest when rich, healthy, and recent placements are weak. */
    bankGoldMin: 50,
    bankHpMin: 35,
    bankAvgPlacementMin: 4.85,
    bankHistoryWindowMin: 6,
    /** Stabilize before elimination. */
    rollHpMax: 28,
    rollGoldMin: 0,
  },
  items: {
    craftConfidenceBase: 0.52,
    craftConfidencePerCraftable: 0.06,
    craftConfidenceCraftableCap: 3,
    missingCountUrgencyMedium: 3,
    partialSlamMinConfidence: 0.5,
  },
  shop: {
    maxRecommendations: 4,
    minMappedConfidence: 0.45,
    historyEvidenceWindowMin: 5,
  },
  comp: {
    minBoardUnits: 3,
    minMissingUnits: 1,
    maxMissingListed: 4,
    finishMatchPercentMin: 55,
    finishMatchPercentMax: 95,
    finishMaxMissingUnits: 3,
    pivotMatchPercentMax: 48,
    pivotMinMissingUnits: 2,
    historyWindowMin: 5,
  },
} as const
