import type {
  ClassifiedSignal,
  PrioritizedFinding,
  SessionInsightReport,
  SignalKind,
  SurfaceComparisonInsight,
  TriagedAnomaly,
} from './types'
import { dominantSignalKind, signalsByKind } from './signalClassification'
import { groupTriagedFindings } from './anomalyTriage'

const REDUNDANT_KEYS = new Set(['gap.sampleSize', 'session.volume', 'perceived.similarity'])

function hintForKind(kind: SignalKind): string {
  switch (kind) {
    case 'noise':
      return 'Treat as low confidence until more session data accumulates.'
    case 'behavioral':
      return 'Reflects how users acted this session — useful for copy tests, not ranking changes alone.'
    case 'structural_ux':
      return 'May indicate surface layout, explanation density, or trust cues — review UX before tuning scores.'
    case 'intent_misclassification':
      return 'Overlay intent blend may not match user plan — compare with guide intent picks.'
  }
}

export function prioritizeSessionFindings(
  report: SessionInsightReport,
  classified: ClassifiedSignal[],
  triaged: TriagedAnomaly[],
  surfaceInsights: SurfaceComparisonInsight,
): PrioritizedFinding[] {
  const findings: PrioritizedFinding[] = []
  const byKind = signalsByKind(classified)
  const triageGroups = groupTriagedFindings(triaged)

  if (report.perceptionGap.correctButIgnoredRate > 0.15 && report.perceptionGap.sampleSize >= 5) {
    findings.push({
      id: 'trust-gap-ignored',
      title: 'Trust gap: strong picks ignored',
      impactScore: report.perceptionGap.correctButIgnoredRate * 0.9,
      signalKinds: ['structural_ux'],
      relatedSurfaces: report.surfaceComparison.map((s) => s.surface),
      interpretationHint:
        'Users saw high-confidence suggestions but did not act — often copy, timing, or surface friction rather than raw ranking error.',
    })
  }

  if (report.explanationUsefulness.explanationFatigueIndex > 0.2) {
    findings.push({
      id: 'explain-fatigue',
      title: 'Explanation fatigue later in session',
      impactScore: report.explanationUsefulness.explanationFatigueIndex * 0.75,
      signalKinds: ['behavioral', 'structural_ux'],
      relatedSurfaces: ['overlay', 'coach'],
      interpretationHint: hintForKind('structural_ux'),
    })
  }

  if (byKind.intent_misclassification.length > 0) {
    findings.push({
      id: 'intent-misalign',
      title: 'Intent follow-through is weak',
      impactScore: 0.7,
      signalKinds: ['intent_misclassification'],
      relatedSurfaces: ['overlay'],
      interpretationHint: hintForKind('intent_misclassification'),
    })
  }

  if (triageGroups.ranking_mismatch.length >= 2) {
    findings.push({
      id: 'ranking-mismatch-group',
      title: `${triageGroups.ranking_mismatch.length} ranking perception mismatches`,
      impactScore: 0.65,
      signalKinds: ['structural_ux', 'behavioral'],
      relatedSurfaces: [],
      interpretationHint: 'Score display and user choices diverge — review confidence presentation before changing weights.',
    })
  }

  if (triageGroups.explanation_issue.length > 0) {
    findings.push({
      id: 'explain-issue-group',
      title: 'Explanation engagement without acceptance',
      impactScore: 0.6,
      signalKinds: ['structural_ux'],
      relatedSurfaces: ['overlay', 'guide'],
      interpretationHint: hintForKind('structural_ux'),
    })
  }

  for (const diff of surfaceInsights.meaningfulDifferences) {
    findings.push({
      id: `surface-${diff.slice(0, 24)}`,
      title: diff,
      impactScore: 0.55,
      signalKinds: ['behavioral'],
      relatedSurfaces: report.surfaceComparison.filter((s) => s.statisticallyMeaningful).map((s) => s.surface),
      interpretationHint: 'Cross-surface difference with enough volume to be worth comparing in playtests.',
    })
  }

  if (report.explanationUsefulness.explanationInfluenceScore > 0.62) {
    findings.push({
      id: 'explain-positive',
      title: 'Explanations correlate with acceptance',
      impactScore: 0.45,
      signalKinds: ['behavioral'],
      relatedSurfaces: [],
      interpretationHint: 'Positive signal — expanding context appears helpful when users are deciding.',
    })
  }

  const dominant = dominantSignalKind(classified)
  if (dominant === 'noise' && findings.length === 0) {
    findings.push({
      id: 'noise-dominated',
      title: 'Session dominated by low-signal noise',
      impactScore: 0.2,
      signalKinds: ['noise'],
      relatedSurfaces: [],
      interpretationHint: hintForKind('noise'),
    })
  }

  return suppressRedundant(findings)
    .sort((a, b) => b.impactScore - a.impactScore)
    .slice(0, 8)
}

function suppressRedundant(findings: PrioritizedFinding[]): PrioritizedFinding[] {
  const seenTitles = new Set<string>()
  return findings.filter((f) => {
    const norm = f.title.toLowerCase().slice(0, 40)
    if (seenTitles.has(norm)) return false
    seenTitles.add(norm)
    return f.impactScore >= 0.25
  })
}

export function filterLowSignalMetrics(classified: ClassifiedSignal[]): ClassifiedSignal[] {
  return classified.filter((s) => !REDUNDANT_KEYS.has(s.metricKey) || s.strength > 0.25)
}
