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

async function invoke<T>(functionName: string, params: Record<string, unknown>): Promise<T> {
  assertAvailable()
  const { data, error } = await supabase!.functions.invoke(functionName, { body: params })
  if (error) {
    if (error.statusCode >= 400 && error.statusCode < 500) {
      throw new SupabaseError(`Edge function error: ${error.message} (${error.statusCode})`, 'EDGE_CLIENT_ERROR')
    }
    throw new SupabaseError(error.message, 'EDGE_FUNCTION_ERROR')
  }
  return data as T
}

// ── Edge Function wrappers ───────────────────────────────────────────────────

export async function fetchSummonerByNameSupabase(name: string, region: RiotRegion): Promise<Summoner> {
  return invoke<Summoner>('tft-summoner', { name, region })
}

export async function fetchLeagueEntriesSupabase(summonerId: string, region: RiotRegion): Promise<LeagueEntry[]> {
  return invoke<LeagueEntry[]>('tft-league', { summonerId, region })
}

export async function fetchMatchIdsSupabase(puuid: string, matchRegion: MatchRegion, count = 20): Promise<string[]> {
  return invoke<string[]>('tft-match-ids', { puuid, region: matchRegion, count })
}

export async function fetchMatchDetailSupabase(matchId: string, matchRegion: MatchRegion): Promise<MatchDetail> {
  return invoke<MatchDetail>('tft-match-detail', { matchId, region: matchRegion })
}

export async function fetchPlayerCardSupabase(name: string, region: RiotRegion): Promise<PlayerCard> {
  return invoke<PlayerCard>('tft-player-card', { name, region })
}

export async function fetchMatchHistorySupabase(puuid: string, region: RiotRegion, count = 20): Promise<Match[]> {
  return invoke<Match[]>('tft-match-history', { puuid, region, count })
}
