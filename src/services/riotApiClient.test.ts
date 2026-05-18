import { beforeEach, describe, expect, it, vi } from 'vitest'

const { fetchMatchIdsSupabaseMock } = vi.hoisted(() => ({
  fetchMatchIdsSupabaseMock: vi.fn(),
}))

vi.mock('./supabaseClient', () => ({
  hasSupabase: () => true,
}))

vi.mock('./supabaseService', () => {
  class SupabaseError extends Error {
    constructor(
      message: string,
      public code: string,
    ) {
      super(message)
      this.name = 'SupabaseError'
    }
  }

  return {
    SupabaseError,
    fetchSummonerByNameSupabase: vi.fn(),
    fetchLeagueEntriesSupabase: vi.fn(),
    fetchMatchIdsSupabase: fetchMatchIdsSupabaseMock,
    fetchMatchDetailSupabase: vi.fn(),
    fetchPlayerCardSupabase: vi.fn(),
    fetchServerStatusSupabase: vi.fn(),
    fetchActiveGameSupabase: vi.fn(),
  }
})

describe('fetchMatchIds', () => {
  beforeEach(() => {
    localStorage.clear()
    fetchMatchIdsSupabaseMock.mockReset()
  })

  it('forwards pagination offset to the Supabase proxy', async () => {
    fetchMatchIdsSupabaseMock.mockResolvedValue(['NA1_123'])

    const ids = await fetchMatchIds(
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghi',
      'na1',
      'americas',
      100,
      200,
    )

    expect(ids).toEqual(['NA1_123'])
    expect(fetchMatchIdsSupabaseMock).toHaveBeenCalledTimes(1)
    expect(fetchMatchIdsSupabaseMock).toHaveBeenCalledWith(
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghi',
      'na1',
      100,
      200,
    )
  })
})
