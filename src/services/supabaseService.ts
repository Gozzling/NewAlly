import { supabase, hasSupabase } from './supabaseClient'
import type { RiotRegion, MatchRegion, Summoner, LeagueEntry, MatchDetail, PlayerCard, Match } from '../types/riot'

export class SupabaseError extends Error {
  code: string
  constructor(message: string, code: string) {
    super(message)
    this.code = code
    this.name = 'SupabaseError'
  }
}

function assertAvailable(): void {
  if (!hasSupabase()) {
    throw new SupabaseError('Supabase not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.', 'NO_CONFIG')
  }
}

// ── Validation utilities ───────────────────────────────────────────────────────

function validatePuuid(puuid: string, logFn?: (msg: string) => void): void {
  const log = logFn ?? console.log
  if (!puuid || typeof puuid !== 'string') {
    log('[VALIDATION] Invalid PUUID: missing or not a string')
    throw new SupabaseError('PUUID is required and must be a string', 'INVALID_PUUID')
  }
  // Riot PUUID format: base64-encoded string, typically 78 characters
  // Format: [A-Za-z0-9+/=_]+ (base64 characters with underscores)
  const riotPuuidRegex = /^[A-Za-z0-9+/=_]{63,78}$/
  if (!riotPuuidRegex.test(puuid)) {
    log('[VALIDATION] Invalid PUUID format: ' + puuid)
    throw new SupabaseError('PUUID must be a valid Riot PUUID (base64-encoded string)', 'INVALID_PUUID')
  }
}

// function validateMatchRegion(region: MatchRegion, logFn?: (msg: string) => void): void {
//   const log = logFn ?? console.log
//   const validRegions: MatchRegion[] = ['americas', 'europe', 'asia', 'sea']
//   if (!region || typeof region !== 'string') {
//     log('[VALIDATION] Invalid region: missing or not a string')
//     throw new SupabaseError('Region is required and must be a string', 'INVALID_REGION')
//   }
//   if (!validRegions.includes(region)) {
//     log('[VALIDATION] Invalid region: ' + region + '. Valid regions: ' + validRegions.join(', '))
//     throw new SupabaseError(`Invalid region "${region}". Valid regions: ${validRegions.join(', ')}`, 'INVALID_REGION')
//   }
// }

function validateCount(count: number, logFn?: (msg: string) => void): void {
  const log = logFn ?? console.log
  if (typeof count !== 'number' || isNaN(count)) {
    log('[VALIDATION] Invalid count: not a number')
    throw new SupabaseError('Count must be a number', 'INVALID_COUNT')
  }
  if (count < 1 || count > 100) {
    log('[VALIDATION] Invalid count: ' + count + '. Must be between 1 and 100')
    throw new SupabaseError('Count must be between 1 and 100', 'INVALID_COUNT')
  }
}

function validateOffset(offset: number, logFn?: (msg: string) => void): void {
  const log = logFn ?? console.log
  if (typeof offset !== 'number' || isNaN(offset)) {
    log('[VALIDATION] Invalid offset: not a number')
    throw new SupabaseError('Offset must be a number', 'INVALID_OFFSET')
  }
  if (offset < 0) {
    log('[VALIDATION] Invalid offset: ' + offset + '. Must be >= 0')
    throw new SupabaseError('Offset must be >= 0', 'INVALID_OFFSET')
  }
}

async function invoke<T>(functionName: string, params: Record<string, unknown>, logFn?: (msg: string) => void): Promise<T> {
  assertAvailable()
  const log = logFn ?? console.log
  log('[SUPABASE] Invoking edge function: ' + JSON.stringify({ functionName, params }))
  const { data, error } = await supabase!.functions.invoke(functionName, { body: params })
  log('[SUPABASE] Edge function response: status=' + (data ? 'success' : 'null') + ', error=' + JSON.stringify(error))
  if (error) {
    log('[SUPABASE] Edge function error: ' + JSON.stringify({ functionName, error }))
    if (error.statusCode >= 400 && error.statusCode < 500) {
      throw new SupabaseError(`Edge function error: ${error.message} (${error.statusCode})`, 'EDGE_CLIENT_ERROR')
    }
    throw new SupabaseError(error.message, 'EDGE_FUNCTION_ERROR')
  }
  log('[SUPABASE] Edge function success: ' + functionName)
  return data as T
}

// ── Edge Function wrappers ───────────────────────────────────────────────────

export async function fetchSummonerByNameSupabase(name: string, region: RiotRegion): Promise<Summoner> {
  console.log('[SUPABASE] fetchSummonerByNameSupabase called:', { name, region })
  const hashIdx  = name.lastIndexOf('#');
  const gameName = hashIdx === -1 ? name : name.slice(0, hashIdx);
  const tagLine  = hashIdx === -1 ? ''   : name.slice(hashIdx + 1);
  console.log('[SUPABASE] Parsed name:', { gameName, tagLine })
  const result = await invoke<Summoner>('tft-summoner', { gameName, tagLine, region })
  console.log('[SUPABASE] fetchSummonerByNameSupabase returned:', { name: result.name, id: result.id, puuid: result.puuid })
  return result
}

export async function fetchLeagueEntriesSupabase(summonerId: string, region: RiotRegion): Promise<LeagueEntry[]> {
  return invoke<LeagueEntry[]>('tft-league', { summonerId, region })
}

export async function fetchMatchIdsSupabase(
  puuid: string,
  riotRegion: RiotRegion,
  count = 20,
  offset = 0,
  logFn?: (msg: string) => void
): Promise<string[]> {
  const log = logFn ?? console.log
  log('[SUPABASE] fetchMatchIdsSupabase called: ' + JSON.stringify({ puuid, riotRegion, count, offset }))

  // Validate parameters before making the request
  try {
    validatePuuid(puuid, log)
    validateCount(count, log)
    validateOffset(offset, log)
    log('[VALIDATION] All parameters validated successfully')
  } catch (err) {
    if (err instanceof SupabaseError) {
      log('[VALIDATION] Parameter validation failed: ' + err.message)
      throw err
    }
    throw new SupabaseError('Unexpected validation error', 'VALIDATION_ERROR')
  }

  const result = await invoke<string[]>('tft-match-ids', { puuid, region: riotRegion, count, offset }, log)
  log('[SUPABASE] fetchMatchIdsSupabase returned: ' + JSON.stringify({ count: result.length, matchIds: result }))
  return result
}

export async function fetchMatchDetailSupabase(matchId: string, matchRegion: MatchRegion): Promise<MatchDetail> {
  return invoke<MatchDetail>('tft-match-detail', { matchId, region: matchRegion })
}

export async function fetchPlayerCardSupabase(name: string, region: RiotRegion): Promise<PlayerCard> {
  console.log('[SUPABASE] fetchPlayerCardSupabase called:', { name, region })
  const hashIdx  = name.lastIndexOf('#');
  const gameName = hashIdx === -1 ? name : name.slice(0, hashIdx);
  const tagLine  = hashIdx === -1 ? ''   : name.slice(hashIdx + 1);
  console.log('[SUPABASE] Parsed name:', { gameName, tagLine })
  const result = await invoke<PlayerCard>('tft-player-card', { gameName, tagLine, region })
  console.log('[SUPABASE] fetchPlayerCardSupabase returned:', result)
  return result
}

export async function fetchMatchHistorySupabase(puuid: string, region: RiotRegion, count = 20): Promise<Match[]> {
  return invoke<Match[]>('tft-match-history', { puuid, region, count })
}

export async function fetchServerStatusSupabase(region: RiotRegion): Promise<Record<string, unknown>> {
  return invoke<Record<string, unknown>>('tft-status', { region })
}

export async function fetchActiveGameSupabase(puuid: string, region: RiotRegion): Promise<Record<string, unknown>> {
  return invoke<Record<string, unknown>>('tft-spectator', { puuid, region })
}
