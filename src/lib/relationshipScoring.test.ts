import { describe, expect, it } from 'vitest'
import {
  mergeRelationshipSignals,
  normalizeRelationshipWeight,
  scoreRelationship,
} from '@/lib/relationshipScoring'
import type { CanonicalRelationship } from '@/types/canonicalRelationship'

describe('relationshipScoring', () => {
  it('merges signals by type/patch key keeping max confidence', () => {
    const merged = mergeRelationshipSignals(
      [{ type: 'synergy', confidence: 0.5, patch: '17.1' }],
      [{ type: 'synergy', confidence: 0.8, patch: '17.1' }],
    )
    expect(merged).toHaveLength(1)
    expect(merged[0].confidence).toBe(0.8)
  })

  it('scores relationships from weight and signals', () => {
    const rel: CanonicalRelationship = {
      sourceId: 'a',
      targetId: 'b',
      relationship: 'synergy',
      weight: 0.5,
      signals: [{ type: 'synergy', confidence: 0.9 }],
    }
    expect(scoreRelationship(rel)).toBeGreaterThan(0.5)
    expect(normalizeRelationshipWeight(undefined, [{ type: 'core', confidence: 1 }])).toBeGreaterThan(0.4)
  })
})
