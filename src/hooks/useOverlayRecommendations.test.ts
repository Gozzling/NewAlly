import { describe, expect, it } from 'vitest'
import { filterPersonalMatchesForSummoner } from './useOverlayRecommendations'
import type { PersonalMatchRecord } from '@/services/indexedDbService'

function row(summonerName: string, id: string): PersonalMatchRecord {
  return {
    id,
    summonerName,
    region: 'euw1',
    createdAt: 1,
    timestamp: 1,
    isSynced: true,
    syncStatus: 'synced',
    placement: 4,
    units: [],
    items: [],
    augments: [],
    comp: null,
    compName: null,
    duration: null,
    source: 'gep_match_end',
    raw: {},
  }
}

describe('filterPersonalMatchesForSummoner', () => {
  it('returns all rows when summoner is null', () => {
    const rows = [row('Alpha#EUW', 'a'), row('Beta#EUW', 'b')]
    expect(filterPersonalMatchesForSummoner(rows, null)).toHaveLength(2)
  })

  it('matches riot id base name case-insensitively', () => {
    const rows = [row('Alpha#EUW', 'a'), row('Beta#EUW', 'b')]
    const filtered = filterPersonalMatchesForSummoner(rows, 'alpha#NA1')
    expect(filtered.map((r) => r.id)).toEqual(['a'])
  })
})
