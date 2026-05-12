import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  fetchMatchIdsSupabase: vi.fn(),
}))

vi.mock('./supabaseClient', () => ({
  hasSupabase: () => true,
}))

vi.mock('./supabaseService', () => ({
  SupabaseError: class SupabaseError extends Error {
    code: string

    constructor(message: string, code: string) {
      super(message)
      this.code = code
      this.name = 'SupabaseError'
    }
  },
  fetchSummonerByNameSupabase: vi.fn(),
  fetchLeagueEntriesSupabase: vi.fn(),
  fetchMatchIdsSupabase: mocks.fetchMatchIdsSupabase,
  fetchMatchDetailSupabase: vi.fn(),
  fetchPlayerCardSupabase: vi.fn(),
  fetchServerStatusSupabase: vi.fn(),
  fetchActiveGameSupabase: vi.fn(),
}))

import { fetchMatchIds } from './riotApiClient'

describe('fetchMatchIds', () => {
  beforeEach(() => {
    localStorage.clear()
    mocks.fetchMatchIdsSupabase.mockReset()
  })

  it('preserves pagination offset when using the Supabase backend', async () => {
    const puuid = 'a'.repeat(78)
    mocks.fetchMatchIdsSupabase.mockResolvedValue(['NA1_1'])

    const result = await fetchMatchIds(puuid, 'na1', 'americas', 20, 40, () => {})

    expect(result).toEqual(['NA1_1'])
    expect(mocks.fetchMatchIdsSupabase).toHaveBeenCalledWith(puuid, 'na1', 20, 40)
  })
})
