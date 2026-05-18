import type { RecommendationFeedbackEvent, RecommendationFeedbackEventType } from '@/types/recommendationFeedback'

export type EngagementCounts = {
  shown: number
  accepted: number
  rejected: number
  helpful: number
  notHelpful: number
}

export function precisionAtK(predicted: string[], relevant: Set<string>, k: number): number {
  if (k <= 0 || predicted.length === 0) return 0
  const top = predicted.slice(0, k)
  const hits = top.filter((id) => relevant.has(id)).length
  return hits / top.length
}

/** Proxy engagement score from accept/reject ratio (0–1). */
export function engagementProxyScore(counts: EngagementCounts): number {
  const interactions = counts.accepted + counts.rejected + counts.helpful + counts.notHelpful
  if (interactions === 0) return 0
  const positive = counts.accepted + counts.helpful
  return positive / interactions
}

export function successRateByRecommendationType(
  feedback: RecommendationFeedbackEvent[],
): Record<RecommendationFeedbackEventType, number> {
  const totals: Record<string, { pos: number; total: number }> = {}

  for (const e of feedback) {
    const bucket = totals[e.type] ?? { pos: 0, total: 0 }
    bucket.total += 1
    if (
      e.type === 'RECOMMENDATION_ACCEPTED' ||
      e.type === 'AUGMENT_HELPFUL'
    ) {
      bucket.pos += 1
    }
    totals[e.type] = bucket
  }

  const out = {} as Record<RecommendationFeedbackEventType, number>
  for (const [type, { pos, total }] of Object.entries(totals)) {
    out[type as RecommendationFeedbackEventType] = total > 0 ? pos / total : 0
  }
  return out
}

export function summarizeFeedbackCounts(
  feedback: RecommendationFeedbackEvent[],
): EngagementCounts {
  const counts: EngagementCounts = {
    shown: 0,
    accepted: 0,
    rejected: 0,
    helpful: 0,
    notHelpful: 0,
  }
  for (const e of feedback) {
    switch (e.type) {
      case 'RECOMMENDATION_ACCEPTED':
        counts.accepted += 1
        break
      case 'RECOMMENDATION_REJECTED':
        counts.rejected += 1
        break
      case 'AUGMENT_HELPFUL':
        counts.helpful += 1
        break
      case 'AUGMENT_NOT_HELPFUL':
        counts.notHelpful += 1
        break
    }
  }
  return counts
}
