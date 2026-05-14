import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  fetchMatchIdsSupabase: vi.fn(),
}))

vi.mock('./supabaseClient', () => ({
  hasSupabase: () => true,
  supabase: {},
}))

vi.mock('./supabaseService', () => ({
  SupabaseError: class SupabaseError extends Error {
    constructor(message: string, public code: string) {
      super(message)
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

  it('forwards pagination parameters to the Supabase edge function', async () => {
    const log = vi.fn()
    mocks.fetchMatchIdsSupabase.mockResolvedValue(['NA1_1234567890'])

    await fetchMatchIds('test-puuid', 'na1', 'americas', 100, 200, log)

    expect(mocks.fetchMatchIdsSupabase).toHaveBeenCalledWith(
      'test-puuid',
      'na1',
      100,
      200,
      log,
    )
  })
})
