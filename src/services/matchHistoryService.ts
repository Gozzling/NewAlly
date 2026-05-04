import type { Match, MatchDetail, RiotRegion } from '../types/riot'
// --- Helper utilities for MatchHistory page ---

/**
 * Check if browser is online.
 */
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine;
}

/**
 * Retrieve cached match history if present.
 * Returns an array of matches (may be empty) and respects offset for pagination.
 */
export function getCachedMatchHistory(puuid: string, region: RiotRegion, count = 20, offset = 0): Match[] {
  const cacheKey = `history:${region}:${puuid}:${count}`;
  const cached = getCache<Match[]>(cacheKey);
  if (!cached) return [];
  const sliced = cached.slice(offset);
  // Ensure dates are Date objects
  return sliced.map((m) => ({
    ...m,
    date: new Date(m.date),
  }));
}

/**
 * Returns true if there is cached match history for the given params.
 */
export function hasCachedMatchHistory(puuid: string, region: RiotRegion, count = 20): boolean {
  const cacheKey = `history:${region}:${puuid}:${count}`;
  return !!getCache<Match[]>(cacheKey);
}

/**
 * Convert an error into a user‑friendly message.
 */
export function getUserFriendlyErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') return error;
  return 'An unexpected error occurred';
}

/**
 * Determine appropriate action button text for an error.
 * Returns "Retry" for retryable errors, otherwise empty string.
 */
export function getErrorActionText(error: unknown): string {
  return isRetryableError(error) ? 'Retry' : '';
}

/**
 * Simple heuristic for retryable errors.
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (msg.includes('fetch') || msg.includes('timeout') || msg.includes('network')) {
      return true;
    }
  }
  // SupabaseError handling (if present)
  if (typeof (error as any)?.code === 'string') {
    const code = (error as any).code;
    // treat server errors as retryable
    if (code === 'EDGE_FUNCTION_ERROR' || code === 'SERVER_ERROR') return true;
  }
  return false;
}
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
    gameType: info.tft_game_type,
  comp: normalizeCompName(me.traits),
  }
}

export async function fetchPlayerMatchHistory(
  puuid: string,
  region: RiotRegion,
  count = 20,
  offset = 0,
  logFn?: (msg: string) => void, options?: unknown,
): Promise<Match[]> {
  const cacheKey = `history:${region}:${puuid}:${count}`
  const cached = getCache<Match[]>(cacheKey)
  if (cached) return cached.map((m) => ({ ...m, date: new Date(m.date) }))

  const matchRegion = regionToMatchRegion(region);
const log = logFn ?? console.log;
  const matchIds = await fetchMatchIds(puuid, region, matchRegion, count, offset, log)

  const details = await Promise.all(
    matchIds.map(async (id) => {
      try {
        return await fetchMatchDetail(id, matchRegion)
      } catch (err) {
        console.warn(`[MH] Failed to fetch match ${id}:`, err)
        return null
        }
      })
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

  const { error } = await supabase!.from('personal_matches').upsert(payload, { onConflict: 'id' })
  if (error) {
    throw new Error(`[MH] Supabase insert failed: ${error.message}`)
  }
}

export async function syncUnsyncedPersonalMatches(limit = 50): Promise<{ synced: number; failed: number }> {
  // Existing implementation unchanged

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
