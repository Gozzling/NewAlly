import type { RiotRegion, MatchRegion, Summoner, LeagueEntry, MatchDetail, PlayerCard } from '../types/riot'
import { getCache, setCache, ONE_HOUR, ONE_DAY } from './storageService'
import { hasSupabase } from './supabaseClient'
import {
  fetchSummonerByNameSupabase,
  fetchLeagueEntriesSupabase,
  fetchMatchIdsSupabase,
  fetchMatchDetailSupabase,
  fetchPlayerCardSupabase,
  SupabaseError,
} from './supabaseService'

const DEV_KEY_LIMIT = 20 // req/sec
let requestTimestamps: number[] = []

function regionToMatchRegion(region: RiotRegion): MatchRegion {
  if (['br1', 'la1', 'la2', 'na1'].includes(region)) return 'americas'
  if (['eun1', 'euw1', 'tr1', 'ru'].includes(region)) return 'europe'
  if (['jp1', 'kr'].includes(region)) return 'asia'
  return 'sea'
}

function waitForRateLimit(): Promise<void> {
  const now = Date.now()
  requestTimestamps = requestTimestamps.filter((t) => now - t < 1000)
  if (requestTimestamps.length >= DEV_KEY_LIMIT) {
    const oldest = requestTimestamps[0]
    const delay = 1000 - (now - oldest) + 50
    return new Promise((resolve) => setTimeout(resolve, delay))
  }
  return Promise.resolve()
}

function getApiKey(): string {
  const key = localStorage.getItem('tft-ally::riot-api-key')
  if (!key) throw new RiotApiError('No Riot API key configured. Add one in Settings.', 'NO_KEY')
  return key
}

async function riotFetch<T>(url: string, regionPrefix: string): Promise<T> {
  await waitForRateLimit()
  requestTimestamps.push(Date.now())

  const apiKey = getApiKey()
  const res = await fetch(`https://${regionPrefix}.api.riotgames.com${url}`, {
    headers: { 'X-Riot-Token': apiKey },
  })

  if (res.status === 404) {
    throw new RiotApiError('Player not found', 'NOT_FOUND')
  }
  if (res.status === 429) {
    throw new RiotApiError('Rate limited — wait a moment', 'RATE_LIMIT')
  }
  if (res.status === 403) {
    throw new RiotApiError('Invalid API key', 'FORBIDDEN')
  }
  if (!res.ok) {
    throw new RiotApiError(`Riot API error ${res.status}`, 'API_ERROR')
  }

  return res.json() as Promise<T>
}

export class RiotApiError extends Error {
  code: string
  constructor(message: string, code: string) {
    super(message)
    this.code = code
    this.name = 'RiotApiError'
  }
}

async function trySupabase<T>(supabaseFn: () => Promise<T>, fallback: () => Promise<T>): Promise<T> {
  if (!hasSupabase()) return fallback()
  try {
    return await supabaseFn()
  } catch (err) {
    if (err instanceof SupabaseError && err.code === 'NO_CONFIG') {
      return fallback()
    }
    throw err
  }
}

export async function fetchSummonerByName(name: string, region: RiotRegion): Promise<Summoner> {
  const cacheKey = `summoner:${region}:${name.toLowerCase()}`
  const cached = getCache<Summoner>(cacheKey)
  if (cached) return cached

  const data = await trySupabase(
    () => fetchSummonerByNameSupabase(name, region),
    () => riotFetch<Summoner>(`/tft/summoner/v1/summoners/by-name/${encodeURIComponent(name)}`, region),
  )
  setCache(cacheKey, data, ONE_HOUR)
  return data
}

export async function fetchLeagueEntries(summonerId: string, region: RiotRegion): Promise<LeagueEntry[]> {
  const cacheKey = `league:${region}:${summonerId}`
  const cached = getCache<LeagueEntry[]>(cacheKey)
  if (cached) return cached

  const data = await trySupabase(
    () => fetchLeagueEntriesSupabase(summonerId, region),
    () => riotFetch<LeagueEntry[]>(`/tft/league/v1/entries/by-summoner/${summonerId}`, region),
  )
  setCache(cacheKey, data, ONE_HOUR)
  return data
}

export async function fetchMatchIds(puuid: string, matchRegion: MatchRegion, count = 20): Promise<string[]> {
  const cacheKey = `match-ids:${matchRegion}:${puuid}:${count}`
  const cached = getCache<string[]>(cacheKey)
  if (cached) return cached

  const data = await trySupabase(
    () => fetchMatchIdsSupabase(puuid, matchRegion, count),
    () => riotFetch<string[]>(`/tft/match/v1/matches/by-puuid/${puuid}/ids?count=${count}`, matchRegion),
  )
  setCache(cacheKey, data, ONE_DAY)
  return data
}

export async function fetchMatchDetail(matchId: string, matchRegion: MatchRegion): Promise<MatchDetail> {
  const cacheKey = `match:${matchRegion}:${matchId}`
  const cached = getCache<MatchDetail>(cacheKey)
  if (cached) return cached

  const data = await trySupabase(
    () => fetchMatchDetailSupabase(matchId, matchRegion),
    () => riotFetch<MatchDetail>(`/tft/match/v1/matches/${matchId}`, matchRegion),
  )
  setCache(cacheKey, data, ONE_DAY)
  return data
}

export async function fetchPlayerCard(name: string, region: RiotRegion): Promise<PlayerCard> {
  if (hasSupabase()) {
    try {
      return await fetchPlayerCardSupabase(name, region)
    } catch (err) {
      if (err instanceof SupabaseError && err.code === 'NO_CONFIG') {
        // fall through to direct
      } else {
        throw err
      }
    }
  }

  const summoner = await fetchSummonerByName(name, region)
  const entries = await fetchLeagueEntries(summoner.id, region)
  const ranked = entries.find((e) => e.queueType === 'RANKED_TFT')

  return {
    name: summoner.name,
    puuid: summoner.puuid,
    level: summoner.summonerLevel,
    profileIconId: summoner.profileIconId,
    rank: ranked?.rank ?? null,
    tier: ranked?.tier ?? null,
    lp: ranked?.leaguePoints ?? null,
  }
}

export { regionToMatchRegion }
