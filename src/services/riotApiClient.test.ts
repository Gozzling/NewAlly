import { beforeEach, describe, expect, it, vi } from 'vitest'

const { fetchMatchIdsSupabaseMock } = vi.hoisted(() => ({
  fetchMatchIdsSupabaseMock: vi.fn(),
}))

vi.mock('./supabaseClient', () => ({
  hasSupabase: () => true,
}))

vi.mock('./supabaseService', () => ({
  fetchSummonerByNameSupabase: vi.fn(),
  fetchLeagueEntriesSupabase: vi.fn(),
  fetchMatchIdsSupabase: fetchMatchIdsSupabaseMock,
  fetchMatchDetailSupabase: vi.fn(),
  fetchPlayerCardSupabase: vi.fn(),
  fetchServerStatusSupabase: vi.fn(),
  fetchActiveGameSupabase: vi.fn(),
  SupabaseError: class SupabaseError extends Error {
    code: string

    constructor(message: string, code: string) {
      super(message)
      this.code = code
      this.name = 'SupabaseError'
    }
  },
}))

import { fetchMatchIds } from './riotApiClient'

describe('fetchMatchIds', () => {
  beforeEach(() => {
    localStorage.clear()
    fetchMatchIdsSupabaseMock.mockReset()
  })

  it('forwards pagination offset to Supabase match-id lookup', async () => {
    fetchMatchIdsSupabaseMock.mockResolvedValue(['EUW1_1234567890'])

    const result = await fetchMatchIds(
      'valid-puuid-for-forwarding-test-123456789012345678901234567890123456789',
      'euw1',
      'europe',
      20,
      40,
      vi.fn(),
    )

    expect(result).toEqual(['EUW1_1234567890'])
    expect(fetchMatchIdsSupabaseMock).toHaveBeenCalledWith(
      'valid-puuid-for-forwarding-test-123456789012345678901234567890123456789',
      'euw1',
      20,
      40,
    )
  })
})
