import { describe, expect, it } from 'vitest'
import {
  condenseInsightsByCategory,
  mergeRelatedFindings,
  reduceRedundantAnomalies,
} from './insightCondensation'
import type { PrioritizedFinding, TriagedAnomaly } from './types'

describe('insightCondensation', () => {
  it('condenseInsightsByCategory groups by interpretability', () => {
    const triaged: TriagedAnomaly[] = [
      {
        category: 'ux_issue',
        interpretabilityLabel: 'user experience friction',
        surface: 'overlay',
        summary: 'Blocked on overlay',
      },
      {
        category: 'ranking_mismatch',
        interpretabilityLabel: 'recommendation quality gap',
        surface: 'overlay',
        summary: 'Ignored high score',
      },
    ]
    const findings: PrioritizedFinding[] = [
      {
        id: 'f1',
        title: 'Trust gap',
        impactScore: 0.8,
        signalKinds: ['structural_ux'],
        relatedSurfaces: ['overlay'],
        interpretationHint: 'Review UX',
      },
    ]
    const groups = condenseInsightsByCategory(triaged, findings)
    expect(groups.some((g) => g.category === 'ux_issue')).toBe(true)
    expect(groups.some((g) => g.category === 'finding')).toBe(true)
  })

  it('mergeRelatedFindings collapses overlapping findings', () => {
    const findings: PrioritizedFinding[] = [
      {
        id: 'a',
        title: 'Trust gap: strong picks ignored',
        impactScore: 0.7,
        signalKinds: ['structural_ux'],
        relatedSurfaces: ['overlay'],
        interpretationHint: 'hint a',
      },
      {
        id: 'b',
        title: 'Trust gap: strong picks ignored',
        impactScore: 0.65,
        signalKinds: ['structural_ux'],
        relatedSurfaces: ['overlay'],
        interpretationHint: 'hint b',
      },
    ]
    const merged = mergeRelatedFindings(findings)
    expect(merged.length).toBe(1)
    expect(merged[0].title).toContain('related')
  })

  it('reduceRedundantAnomalies dedupes by category and canonical id', () => {
    const triaged: TriagedAnomaly[] = [
      {
        category: 'ranking_mismatch',
        canonicalId: 'aug-1',
        interpretabilityLabel: 'recommendation quality gap',
        surface: 'overlay',
        summary: 'Ignored',
        confidence: 0.5,
      },
      {
        category: 'ranking_mismatch',
        canonicalId: 'aug-1',
        interpretabilityLabel: 'recommendation quality gap',
        surface: 'overlay',
        summary: 'Ignored',
        confidence: 0.9,
      },
    ]
    const reduced = reduceRedundantAnomalies(triaged)
    expect(reduced.length).toBe(1)
    expect(reduced[0].confidence).toBe(0.9)
  })
})
