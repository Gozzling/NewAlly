import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  invoke: vi.fn(),
}))

vi.mock('./supabaseClient', () => ({
  hasSupabase: () => true,
  supabase: {
    functions: {
      invoke: mocks.invoke,
    },
  },
}))

import { fetchMatchIdsSupabase } from './supabaseService'

describe('fetchMatchIdsSupabase', () => {
  beforeEach(() => {
    mocks.invoke.mockReset()
  })

  it('sends the requested pagination offset to the edge function', async () => {
    const puuid = 'a'.repeat(78)
    mocks.invoke.mockResolvedValue({ data: ['NA1_101'], error: null })

    const result = await fetchMatchIdsSupabase(puuid, 'na1', 75, 150, () => {})

    expect(result).toEqual(['NA1_101'])
    expect(mocks.invoke).toHaveBeenCalledWith('tft-match-ids', {
      body: { puuid, region: 'na1', count: 75, offset: 150 },
    })
  })
})
