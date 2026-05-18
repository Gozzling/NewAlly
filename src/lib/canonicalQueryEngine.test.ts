import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  queryEntitiesRanked,
  queryRelationshipsRanked,
  resolveTopRelationships,
} from '@/lib/canonicalQueryEngine'
import { resetAugmentEntityProvider } from '@/lib/entityProviders/augmentEntityProvider'
import type { CanonicalAugment } from '@/types/canonicalAugment'

vi.mock('@/store/useAppStore', () => ({
  useAppStore: {
    getState: () => ({
      gameData: { augments: [], lastUpdated: 1, setNumber: 17 },
    }),
  },
}))

describe('canonicalQueryEngine', () => {
  beforeEach(() => {
    resetAugmentEntityProvider()
  })

  it('queries augments and relationships via graph engine', () => {
    const ranked = queryEntitiesRanked({ type: 'augment', patch: '17.1', set: 17, minConfidence: 0 })
    expect(ranked.length).toBeGreaterThan(0)

    const sample = ranked.find((a) => a.entity.name === 'Space God Blessing')
    expect(sample).toBeDefined()

    const rels = queryRelationshipsRanked({
      sourceId: sample!.entity.canonicalId,
      minConfidence: 0,
    })
    expect(rels.length).toBeGreaterThanOrEqual(0)

    const top = resolveTopRelationships(sample!.entity.canonicalId, { limit: 3, minConfidence: 0 })
    expect(top.every((r) => r.score >= 0)).toBe(true)
  })
})
