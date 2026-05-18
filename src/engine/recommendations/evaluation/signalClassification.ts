import type {
  ClassifiedSignal,
  SessionInsightReport,
  SignalKind,
} from './types'

const MIN_SAMPLE = 5

function push(
  out: ClassifiedSignal[],
  kind: SignalKind,
  metricKey: string,
  label: string,
  value: number,
  strength: number,
): void {
  if (strength < 0.08) return
  out.push({ kind, metricKey, label, value, strength })
}

function classifyGapSignals(
  gap: SessionInsightReport['perceptionGap'],
  out: ClassifiedSignal[],
): void {
  if (gap.sampleSize < MIN_SAMPLE) {
    push(out, 'noise', 'gap.sampleSize', 'Low sample — gap metrics are noisy', gap.sampleSize, 0.15)
    return
  }

  push(
    out,
    'structural_ux',
    'gap.correctButIgnored',
    'High-confidence picks ignored',
    gap.correctButIgnoredRate,
    gap.correctButIgnoredRate,
  )
  push(
    out,
    'behavioral',
    'gap.incorrectButClicked',
    'Low-confidence picks still taken',
    gap.incorrectButClickedRate,
    gap.incorrectButClickedRate,
  )
  push(
    out,
    'behavioral',
    'gap.explanationDelta',
    'Explanation expand vs accept delta',
    gap.explanationHelpfulnessDelta,
    Math.abs(gap.explanationHelpfulnessDelta),
  )
}

function classifyExplanationSignals(
  u: SessionInsightReport['explanationUsefulness'],
  out: ClassifiedSignal[],
): void {
  push(
    out,
    'structural_ux',
    'explain.influence',
    'Explanation influence on acceptance',
    u.explanationInfluenceScore,
    Math.abs(u.explanationInfluenceScore - 0.5),
  )
  push(out, 'behavioral', 'explain.fatigue', 'Explanation fatigue', u.explanationFatigueIndex, u.explanationFatigueIndex)
  if (u.expandedThenIgnoredRate > 0.25) {
    push(
      out,
      'structural_ux',
      'explain.expandIgnored',
      'Expanded then ignored',
      u.expandedThenIgnoredRate,
      u.expandedThenIgnoredRate,
    )
  }
}

function classifyPerceivedSignals(
  p: SessionInsightReport['perceived'],
  intentProxy: number,
  out: ClassifiedSignal[],
): void {
  push(
    out,
    'behavioral',
    'perceived.explanationOpen',
    'Explanation open rate',
    p.explanationOpenedRate,
    p.explanationOpenedRate * 0.6,
  )
  push(
    out,
    'behavioral',
    'perceived.overlayAccept',
    'Overlay accept rate',
    p.overlayAcceptRate,
    p.overlayAcceptRate * 0.5,
  )
  if (p.sessionExplanationSimilarity > 0.55) {
    push(
      out,
      'noise',
      'perceived.similarity',
      'High explanation repetition',
      p.sessionExplanationSimilarity,
      p.sessionExplanationSimilarity,
    )
  }
  if (intentProxy < 0.35) {
    push(
      out,
      'intent_misclassification',
      'intent.accuracyProxy',
      'Weak intent follow-through',
      intentProxy,
      1 - intentProxy,
    )
  }
}

/**
 * Separates noise vs behavioral vs structural vs intent-misalignment signals.
 * Observational only — does not affect recommendations.
 */
export function classifySessionSignals(report: SessionInsightReport): ClassifiedSignal[] {
  const out: ClassifiedSignal[] = []

  if (report.effectiveness.shown < MIN_SAMPLE) {
    push(out, 'noise', 'session.volume', 'Insufficient impressions', report.effectiveness.shown, 0.2)
    return out
  }

  classifyGapSignals(report.perceptionGap, out)
  classifyExplanationSignals(report.explanationUsefulness, out)
  classifyPerceivedSignals(report.perceived, report.effectiveness.intentAccuracyProxy, out)

  if (report.delayedFollowThroughCount > 0) {
    push(
      out,
      'behavioral',
      'followThrough.delayed',
      'Delayed follow-through',
      report.delayedFollowThroughCount,
      Math.min(1, report.delayedFollowThroughCount / 5),
    )
  }

  return out.sort((a, b) => b.strength - a.strength)
}

export function signalsByKind(
  signals: ClassifiedSignal[],
): Record<SignalKind, ClassifiedSignal[]> {
  const buckets: Record<SignalKind, ClassifiedSignal[]> = {
    noise: [],
    behavioral: [],
    structural_ux: [],
    intent_misclassification: [],
  }
  for (const s of signals) {
    buckets[s.kind].push(s)
  }
  return buckets
}

export function dominantSignalKind(signals: ClassifiedSignal[]): SignalKind | null {
  const buckets = signalsByKind(signals)
  let best: SignalKind | null = null
  let bestStrength = 0
  for (const kind of Object.keys(buckets) as SignalKind[]) {
    const sum = buckets[kind].reduce((a, s) => a + s.strength, 0)
    if (sum > bestStrength) {
      bestStrength = sum
      best = kind
    }
  }
  return best
}
