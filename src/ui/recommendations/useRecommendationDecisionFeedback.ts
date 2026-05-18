import { useCallback, useEffect, useRef } from 'react'
import {
  getPerceivedIntelligenceSnapshot,
  trackExplanationCollapsed,
  trackExplanationExpanded,
  trackRecommendationIgnored,
  trackRecommendationShown,
  trackRecommendationUsed,
} from '@/engine/recommendations/evaluation'
import { sessionExplanationSimilarity } from '@/ui/recommendations/explanationConsistency'
import type { RecommendationSurface } from '@/engine/recommendations/evaluation'
import type { RecommendationIntent } from '@/types/recommendationIntent'

export type RecommendationDecisionFeedback = {
  onRecommendationClicked: (canonicalId: string) => void
  onRecommendationIgnored: (canonicalId: string) => void
  onExplanationExpanded: (canonicalId?: string) => void
  onExplanationCollapsed: (canonicalId?: string) => void
}

export type VisibleRecommendation = {
  canonicalId: string
  confidence?: number
}

export type UseRecommendationDecisionFeedbackOptions = {
  surface: RecommendationSurface
  intent?: RecommendationIntent
  /** Visible picks — records shown once per batch (with optional confidence for gap analysis) */
  visible?: VisibleRecommendation[]
  /** @deprecated Use visible[] with confidence */
  visibleIds?: string[]
  enabled?: boolean
}

/**
 * UI-only hooks feeding observational evaluation (no scoring impact).
 */
export function useRecommendationDecisionFeedback(
  options: UseRecommendationDecisionFeedbackOptions,
): RecommendationDecisionFeedback {
  const { surface, intent, enabled = true } = options
  const visible =
    options.visible ??
    (options.visibleIds ?? []).map((canonicalId) => ({ canonicalId }))
  const shownBatchRef = useRef<string>('')

  useEffect(() => {
    if (!enabled || visible.length === 0) return
    const batchKey = visible.map((v) => `${v.canonicalId}:${v.confidence ?? ''}`).join('|')
    if (shownBatchRef.current === batchKey) return
    shownBatchRef.current = batchKey

    for (const row of visible) {
      trackRecommendationShown({
        canonicalId: row.canonicalId,
        intent,
        surface,
        confidence: row.confidence,
      })
    }
  }, [enabled, visible, intent, surface])

  const onRecommendationClicked = useCallback(
    (canonicalId: string) => {
      if (!enabled) return
      trackRecommendationUsed({ canonicalId, intent, surface })
    },
    [enabled, intent, surface],
  )

  const onRecommendationIgnored = useCallback(
    (canonicalId: string) => {
      if (!enabled) return
      trackRecommendationIgnored({ canonicalId, intent, surface })
    },
    [enabled, intent, surface],
  )

  const onExplanationExpanded = useCallback(
    (canonicalId?: string) => {
      if (!enabled) return
      trackExplanationExpanded({ canonicalId, intent, surface })
    },
    [enabled, intent, surface],
  )

  const onExplanationCollapsed = useCallback(
    (canonicalId?: string) => {
      if (!enabled) return
      trackExplanationCollapsed({ canonicalId, surface })
    },
    [enabled, surface],
  )

  return {
    onRecommendationClicked,
    onRecommendationIgnored,
    onExplanationExpanded,
    onExplanationCollapsed,
  }
}

/** Read perceived intelligence metrics for dev/telemetry panels. */
export function readPerceivedIntelligenceMetrics() {
  return getPerceivedIntelligenceSnapshot(sessionExplanationSimilarity())
}

export { getPerceivedIntelligenceReport } from '@/engine/recommendations/evaluation'
