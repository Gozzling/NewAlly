import { beforeEach, describe, expect, it, vi } from 'vitest'

const supabaseMocks = vi.hoisted(() => ({
  fetchSummonerByNameSupabase: vi.fn(),
  fetchLeagueEntriesSupabase: vi.fn(),
  fetchMatchIdsSupabase: vi.fn(),
  fetchMatchDetailSupabase: vi.fn(),
  fetchPlayerCardSupabase: vi.fn(),
  fetchServerStatusSupabase: vi.fn(),
  fetchActiveGameSupabase: vi.fn(),
  SupabaseError: class SupabaseError extends Error {
    code: string

    constructor(message: string, code: string) {
      super(message)
      this.name = 'SupabaseError'
      this.code = code
    }
  },
}))

vi.mock('./supabaseClient', () => ({
  hasSupabase: () => true,
}))

vi.mock('./supabaseService', () => supabaseMocks)

import { fetchMatchIds } from './riotApiClient'

describe('fetchMatchIds', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('passes pagination offset through the Supabase path', async () => {
    supabaseMocks.fetchMatchIdsSupabase.mockResolvedValue(['match-31'])

    const result = await fetchMatchIds('test-puuid', 'euw1', 'europe', 20, 30, vi.fn())

    expect(result).toEqual(['match-31'])
    expect(supabaseMocks.fetchMatchIdsSupabase).toHaveBeenCalledTimes(1)
    expect(supabaseMocks.fetchMatchIdsSupabase).toHaveBeenCalledWith(
      'test-puuid',
      'euw1',
      20,
      30,
      expect.any(Function),
    )
  })
})
