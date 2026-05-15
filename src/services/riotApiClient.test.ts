import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => {
  class SupabaseError extends Error {
    code: string

    constructor(message: string, code: string) {
      super(message)
      this.code = code
      this.name = 'SupabaseError'
    }
  }

  return {
    SupabaseError,
    fetchSummonerByNameSupabase: vi.fn(),
    fetchLeagueEntriesSupabase: vi.fn(),
    fetchMatchIdsSupabase: vi.fn(),
    fetchMatchDetailSupabase: vi.fn(),
    fetchPlayerCardSupabase: vi.fn(),
    fetchServerStatusSupabase: vi.fn(),
    fetchActiveGameSupabase: vi.fn(),
  }
})

vi.mock('./supabaseClient', () => ({
  hasSupabase: () => true,
}))

vi.mock('./supabaseService', () => mocks)

import { fetchLeagueEntries, fetchMatchIds } from './riotApiClient'

const PUUID = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/=_abcdef'

describe('riotApiClient Supabase forwarding', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('passes count and offset to the Supabase match-id edge function', async () => {
    const log = vi.fn()
    mocks.fetchMatchIdsSupabase.mockResolvedValueOnce(['EUW1_123'])

    const ids = await fetchMatchIds(PUUID, 'euw1', 'europe', 100, 200, log)

    expect(ids).toEqual(['EUW1_123'])
    expect(mocks.fetchMatchIdsSupabase).toHaveBeenCalledWith(PUUID, 'euw1', 100, 200, log)
  })

  it('looks up TFT league entries by PUUID through Supabase', async () => {
    mocks.fetchLeagueEntriesSupabase.mockResolvedValueOnce([])

    await fetchLeagueEntries(PUUID, 'euw1')

    expect(mocks.fetchLeagueEntriesSupabase).toHaveBeenCalledWith(PUUID, 'euw1')
  })
})
