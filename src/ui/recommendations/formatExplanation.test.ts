import { beforeEach, describe, expect, it } from 'vitest'
import {
  diversifyExplanationsAcrossList,
  formatRecommendationList,
  formatSummaryLines,
  prioritizeTopReasons,
  truncateByIntent,
} from '@/ui/recommendations/formatExplanation'
import { explanationTemplateHash, resetExplanationSession } from '@/ui/recommendations/explanationSession'
import type { EntityRecommendationWithExplanation } from '@/lib/intentQueryEngine'
import type { CanonicalAugment } from '@/types/canonicalAugment'

function mockRow(id: string, name: string, confidence: number): EntityRecommendationWithExplanation {
  const entity: CanonicalAugment = {
    type: 'augment',
    canonicalId: id,
    apiName: id,
    name,
    set: 17,
    patch: '17.1',
    locale: 'en',
    version: { set: 17, patch: '17.1', locale: 'en' },
    tier: 'gold',
    stats: { winRate: 54, pickRate: 12 },
    metadata: {
      completeness: { hasEffects: true, hasFormattedDescription: true, hasStats: true },
      sourceChain: ['static'],
    },
  }
  return {
    entity,
    score: confidence,
    calibratedConfidence: confidence,
    intent: 'tempo',
    explanation: {
      entityId: id,
      signalSources: [],
      confidence: {
        rawScore: confidence,
        calibratedConfidence: confidence,
        factors: {
          base: 0.5,
          sampleSize: 50,
          patchStability: 1,
          winRateDelta: 0.5,
          derivedPenalty: 0,
          feedbackAdjustment: 0,
        },
      },
      historicalStats: { winRate: 54, pickRate: 12 },
      intentAlignment: { affinityScore: 0.8, matchedHints: ['tempo'] },
      summaryLines: [
        'Calibrated confidence 68%',
        'Win rate 54.0% vs baseline',
        'strong synergy with board',
      ],
    },
  }
}

describe('formatExplanation', () => {
  beforeEach(() => {
    resetExplanationSession()
  })

  it('caps lines per tempo intent and strips generic phrases', () => {
    const lines = formatSummaryLines(
      [
        'Calibrated confidence 68%',
        'strong synergy with board',
        'Win rate 54.0% vs baseline',
        'Aligns with tempo intent (tempo, win)',
      ],
      'tempo',
    )
    expect(lines.length).toBeLessThanOrEqual(truncateByIntent('tempo').max)
    expect(lines.some((l) => /strong synergy/i.test(l))).toBe(false)
    expect(lines.some((l) => /calibrated confidence/i.test(l))).toBe(false)
  })

  it('prioritizes contextual anchors in top reasons', () => {
    const ordered = prioritizeTopReasons(['Generic rank', 'Gold interest spike'], 'econ', {
      gold: 52,
      hp: 80,
    })
    expect(ordered[0]).toMatch(/52g|econ/i)
  })

  it('diversifies repeated lines across list', () => {
    const shared = 'Aligns with tempo intent (tempo)'
    const map = diversifyExplanationsAcrossList(
      [
        { id: 'a', lines: [shared, 'Unique A'] },
        { id: 'b', lines: [shared, 'Unique B'] },
      ],
      3,
    )
    expect(map.get('a')?.[0]).toBe(shared)
    expect(map.get('b')?.[0]).not.toBe(shared)
  })

  it('primary pick gets action line; alts get comparison context', () => {
    const formatted = formatRecommendationList(
      [mockRow('a', 'Alpha', 0.8), mockRow('b', 'Beta', 0.65)],
      { intent: 'tempo', topReasons: [], entitySummaries: [], relationshipSummaries: [], generatedAtMs: 0 },
      { intent: 'tempo', listLimit: 2, gameContext: { hp: 30, gold: 8 } },
    )
    expect(formatted[0]?.displayRole).toBe('primary')
    expect(formatted[0]?.actionLine).toMatch(/Alpha/)
    expect(formatted[1]?.displayRole).toBe('comparison')
    expect(formatted[1]?.summaryLines[0]).toMatch(/Backup|Alt/)
  })

  it('compression mode reduces line budget', () => {
    const full = truncateByIntent('stabilization', false)
    const compressed = truncateByIntent('stabilization', true)
    expect(compressed.max).toBeLessThan(full.max)
    expect(compressed.maxChars).toBeLessThan(full.maxChars)
  })

  it('template hash normalizes numbers for fatigue tracking', () => {
    expect(explanationTemplateHash('Win rate 54.0%')).toBe(explanationTemplateHash('Win rate 61.2%'))
  })
})
