import type { Match, MatchDetail, RiotRegion } from '../types/riot'
import { fetchMatchIds, fetchMatchDetail, regionToMatchRegion } from './riotApiClient'
import { getCache, setCache, ONE_DAY } from './storageService'
import { supabase, hasSupabase } from './supabaseClient'
import type { PersonalMatchRecord } from './indexedDbService'
import { getUnsyncedMatches, markPersonalMatchSynced } from './indexedDbService'

function normalizeCompName(traits: { name: string; num_units: number }[]): string | null {
  const active = traits.filter((t) => t.num_units > 0).map((t) => t.name)
  if (active.length === 0) return null
  return active.slice(0, 3).join(' / ')
}

function parseMatch(detail: MatchDetail, puuid: string): Match {
  const info = detail.info
  const me = info.participants.find((p) => p.puuid === puuid)
  if (!me) {
    return {
      matchId: detail.metadata.match_id,
      placement: 0,
      level: 0,
      date: new Date(info.game_datetime),
      gameLength: info.game_length,
      units: [],
      augments: [],
      traits: [],
      comp: null,
    }
  }

  const unitNames = me.units.map((u) => {
    const id = u.character_id
    return id.startsWith('TFT') ? id.split('_').pop() ?? id : id
  })

  const traits = me.traits
    .filter((t) => t.num_units > 0)
    .sort((a, b) => b.num_units - a.num_units)
    .map((t) => t.name)

  return {
    matchId: detail.metadata.match_id,
    placement: me.placement,
    level: me.level,
    date: new Date(info.game_datetime),
    gameLength: info.game_length,
    units: unitNames,
    augments: me.augments,
    traits,
    comp: normalizeCompName(me.traits),
  }
}

export async function fetchPlayerMatchHistory(
  puuid: string,
  region: RiotRegion,
  count = 20,
): Promise<Match[]> {
  const cacheKey = `history:${region}:${puuid}:${count}`
  const cached = getCache<Match[]>(cacheKey)
  if (cached) return cached.map((m) => ({ ...m, date: new Date(m.date) }))

  const matchRegion = regionToMatchRegion(region)
  const matchIds = await fetchMatchIds(puuid, matchRegion, count)

  const details = await Promise.all(
    matchIds.map(async (id) => {
      try {
        return await fetchMatchDetail(id, matchRegion)
      } catch (err) {
        console.warn(`[MH] Failed to fetch match ${id}:`, err)
        return null
      }
    }),
  )

  const matches = details
    .filter((d): d is MatchDetail => d !== null)
    .map((d) => parseMatch(d, puuid))

  setCache(cacheKey, matches, ONE_DAY)
  return matches
}

export function toRiotMatchFromPersonal(record: PersonalMatchRecord): Match {
  return {
    matchId: record.id,
    placement: record.placement ?? 0,
    level: 0,
    date: new Date(record.createdAt),
    gameLength: record.duration ?? 0,
    units: record.units,
    augments: record.augments,
    traits: [],
    comp: record.comp,
  }
}

export async function syncPersonalMatchToSupabase(record: PersonalMatchRecord): Promise<void> {
  if (!hasSupabase()) {
    throw new Error('Supabase not configured')
  }

  const payload = {
    id: record.id,
    summoner_name: record.summonerName ?? 'Unknown',
    region: record.region ?? 'unknown',
    placement: record.placement ?? 8,
    comp_name: record.compName ?? record.comp ?? null,
    units: record.units,
    augments: record.augments,
    timestamp: record.timestamp ?? record.createdAt,
    duration: record.duration,
  }

  const { error } = await supabase.from('personal_matches').upsert(payload, { onConflict: 'id' })
  if (error) {
    throw new Error(`[MH] Supabase insert failed: ${error.message}`)
  }
}

export async function syncUnsyncedPersonalMatches(limit = 50): Promise<{ synced: number; failed: number }> {
  const rows = await getUnsyncedMatches(limit)
  let synced = 0
  let failed = 0

  for (const row of rows) {
    try {
      await syncPersonalMatchToSupabase(row)
      await markPersonalMatchSynced(row.id, true)
      synced++
    } catch (err) {
      await markPersonalMatchSynced(row.id, false)
      failed++
      console.warn('[MH] Failed to sync personal match', row.id, err)
    }
  }

  return { synced, failed }
}
