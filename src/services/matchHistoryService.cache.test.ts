import { afterEach, describe, expect, it } from 'vitest'
import { setCache, ONE_DAY } from './storageService'
import {
  clearAllMatchHistoryCache,
  getCacheStats,
  hasCachedMatchHistory,
} from './matchHistoryService'

const PUUID = 'test-puuid-123'
const REGION = 'na1' as const

afterEach(() => {
  clearAllMatchHistoryCache()
})

describe('match history cache helpers', () => {
  it('hasCachedMatchHistory detects legacy cache under tft-ally:: prefix', () => {
    setCache(`history:${REGION}:${PUUID}:20:0`, [{ matchId: 'm1', placement: 1 }], ONE_DAY)
    expect(hasCachedMatchHistory(PUUID, REGION)).toBe(true)
  })

  it('hasCachedMatchHistory detects enriched cache under tft-ally:: prefix', () => {
    setCache(
      `history-enriched:${REGION}:${PUUID}:20:0`,
      [{ match: { id: 'm1', placement: 1 }, validation: { valid: true, issues: [] } }],
      ONE_DAY,
    )
    expect(hasCachedMatchHistory(PUUID, REGION)).toBe(true)
  })

  it('hasCachedMatchHistory returns false for other players', () => {
    setCache(`history:${REGION}:other-puuid:20:0`, [{ matchId: 'm1' }], ONE_DAY)
    expect(hasCachedMatchHistory(PUUID, REGION)).toBe(false)
  })

  it('clearAllMatchHistoryCache removes legacy and enriched entries', () => {
    setCache(`history:${REGION}:${PUUID}:20:0`, [{ matchId: 'm1' }], ONE_DAY)
    setCache(`history-enriched:${REGION}:${PUUID}:20:0`, [{ match: { id: 'm1' } }], ONE_DAY)
    setCache('settings:foo', { x: 1 }, ONE_DAY)

    clearAllMatchHistoryCache()

    expect(hasCachedMatchHistory(PUUID, REGION)).toBe(false)
    expect(localStorage.getItem('tft-ally::settings:foo')).not.toBeNull()
  })

  it('getCacheStats reports legacy and enriched buckets', () => {
    setCache(`history:${REGION}:${PUUID}:20:0`, [{ matchId: 'm1' }], ONE_DAY)
    setCache(`history-enriched:${REGION}:${PUUID}:20:0`, [{ match: { id: 'm2' } }], ONE_DAY)
    setCache(`history-enriched:${REGION}:other:20:0`, [], ONE_DAY)

    const stats = getCacheStats()
    expect(stats.total).toBe(3)
    expect(stats.valid).toBe(2)
    expect(stats.invalid).toBe(1)
    expect(stats.legacy).toEqual({ total: 1, valid: 1, invalid: 0 })
    expect(stats.enriched).toEqual({ total: 2, valid: 1, invalid: 1 })
  })
})
