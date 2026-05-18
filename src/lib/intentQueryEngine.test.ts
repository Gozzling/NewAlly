import { beforeEach, describe, expect, it, vi } from 'vitest'
import { resetAugmentEntityProvider } from '@/lib/entityProviders/augmentEntityProvider'
import {
  queryByIntent,
  queryByIntentWithRationale,
  rankEntitiesForIntent,
  rankEntitiesForIntentWithExplanation,
} from '@/lib/intentQueryEngine'
import { resetDriftMonitor } from '@/engine/recommendations/monitoring'

vi.mock('@/store/useAppStore', () => ({
  useAppStore: {
    getState: () => ({
      gameData: { augments: [], lastUpdated: 1, setNumber: 17 },
    }),
  },
}))

describe('intentQueryEngine', () => {
  beforeEach(() => {
    resetAugmentEntityProvider()
    resetDriftMonitor()
  })

  it('ranks augments by intent through canonical query engine', () => {
    const ranked = rankEntitiesForIntent({
      intent: 'stabilization',
      minConfidence: 0,
      limit: 5,
    })
    expect(ranked.length).toBeGreaterThan(0)
    expect(ranked[0].calibratedConfidence).toBeGreaterThanOrEqual(ranked[ranked.length - 1]?.calibratedConfidence ?? 0)
  })

  it('queryByIntent returns entities and relationships', () => {
    const result = queryByIntent({ intent: 'tempo', minConfidence: 0, limit: 3 })
    expect(result.entities.length).toBeGreaterThan(0)
    expect(Array.isArray(result.relationships)).toBe(true)
  })

  it('rankEntitiesForIntentWithExplanation attaches explanations', () => {
    const ranked = rankEntitiesForIntentWithExplanation({
      intent: 'stabilization',
      minConfidence: 0,
      limit: 3,
    })
    expect(ranked[0]?.explanation).toBeDefined()
    expect(ranked[0]?.explanation?.summaryLines.length).toBeGreaterThan(0)
  })

  it('queryByIntentWithRationale returns rationale bundle', () => {
    const result = queryByIntentWithRationale({ intent: 'econ', minConfidence: 0, limit: 2 })
    expect(result.rationale.intent).toBe('econ')
    expect(result.entities[0]?.explanation).toBeDefined()
  })
})
