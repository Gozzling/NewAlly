import { INTENT_SIGNAL_AFFINITY } from '@/types/recommendationIntent'
import type { RelationshipRecommendationScore } from '@/engine/recommendations/scoring/types'
import type { CanonicalRelationship } from '@/types/canonicalRelationship'
import type { RecommendationExplanation, ExplanationSignalSource } from './types'

export type RelationshipEdgeRef = {
  sourceId: string
  targetId: string
  relationship: string
}

function buildSignalSources(
  score: RelationshipRecommendationScore,
  rel: CanonicalRelationship,
): ExplanationSignalSource[] {
  const sources: ExplanationSignalSource[] = [
    {
      kind: 'relationship_graph',
      weight: 0.5,
      note: `${rel.signals?.length ?? 0} graph signal(s) on ${rel.relationship} edge`,
    },
  ]

  if (rel.derived) {
    sources.push({
      kind: 'derived_inference',
      weight: 0.2,
      note: 'Edge inferred from related signals (derived)',
    })
  }

  if (Math.abs(score.factors.feedbackAdjustment) > 0.01) {
    sources.push({
      kind: 'user_feedback',
      weight: 0.15,
      note: `Feedback adjustment ${score.factors.feedbackAdjustment >= 0 ? '+' : ''}${score.factors.feedbackAdjustment.toFixed(3)}`,
    })
  }

  return sources
}

export function explainRelationshipRecommendation(
  edge: RelationshipEdgeRef,
  score: RelationshipRecommendationScore,
): RecommendationExplanation {
  const rel = score.relationship
  const signalTypes = rel.signals?.map((s) => s.type) ?? []
  const preferred = score.intent ? INTENT_SIGNAL_AFFINITY[score.intent] : []
  const matched = preferred.filter((t) => signalTypes.includes(t as (typeof signalTypes)[number]))

  const maxSample = Math.max(0, ...(rel.signals?.map((s) => s.sampleSize ?? 0) ?? []))

  const summaryLines: string[] = [
    `Edge confidence ${(score.calibratedConfidence * 100).toFixed(0)}%`,
    `${rel.sourceId} → ${rel.targetId} (${rel.relationship})`,
  ]

  if (rel.derived) {
    summaryLines.push('Derived edge — stability penalty applied')
  }
  if (score.intent && matched.length > 0) {
    summaryLines.push(`Intent ${score.intent}: matched ${matched.join(', ')} signals`)
  }

  return {
    edge: {
      sourceId: edge.sourceId,
      targetId: edge.targetId,
      relationship: edge.relationship,
    },
    signalSources: buildSignalSources(score, rel),
    confidence: {
      rawScore: score.score,
      calibratedConfidence: score.calibratedConfidence,
      factors: score.factors,
    },
    historicalStats: {
      sampleSize: maxSample,
    },
    intentAlignment: {
      intent: score.intent,
      affinityScore: signalTypes.length
        ? matched.length / signalTypes.length
        : 0.4,
      preferredSignalTypes: preferred as RecommendationExplanation['intentAlignment']['preferredSignalTypes'],
    },
    summaryLines,
  }
}
