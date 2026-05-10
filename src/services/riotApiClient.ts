import type { RiotRegion, MatchRegion, Summoner, LeagueEntry, MatchDetail, PlayerCard } from '../types/riot'
import { getCache, setCache, removeCache, ONE_HOUR, ONE_DAY } from './storageService'
import { hasSupabase } from './supabaseClient'
import {
  fetchSummonerByNameSupabase,
  fetchLeagueEntriesSupabase,
  fetchMatchIdsSupabase,
  fetchMatchDetailSupabase,
  fetchPlayerCardSupabase,
  fetchServerStatusSupabase,
  fetchActiveGameSupabase,
  SupabaseError,
} from './supabaseService'

const DEV_KEY_LIMIT = 20 // req/sec (personal dev keys)
let requestTimestamps: number[] = []

/**
 * When true, allows browser → Riot calls using `localStorage['tft-ally::riot-api-key']`.
 * Must stay false for Overwolf / store builds — Riot forbids exposing API keys in distributed clients.
 */
function allowClientRiotKey(): boolean {
  return import.meta.env.VITE_ALLOW_CLIENT_RIOT_KEY === 'true'
}

function backendRequired(): never {
  throw new RiotApiError(
    'Match data is loaded through TFT Ally’s servers. Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, deploy Supabase Edge Functions, and set the RIOT_API_KEY secret there. Developers may use VITE_ALLOW_CLIENT_RIOT_KEY=true plus a personal key in localStorage only for local testing.',
    'BACKEND_REQUIRED',
  )
}

// Retry configuration
const MAX_RETRIES = 3
const INITIAL_RETRY_DELAY = 1000 // 1 second
const REQUEST_TIMEOUT = 60000 // 60 seconds

// Helper function for exponential backoff with jitter
function getRetryDelay(attempt: number): number {
  const baseDelay = INITIAL_RETRY_DELAY * Math.pow(2, attempt)
  const jitter = Math.random() * 0.3 * baseDelay // Add 30% jitter
  return Math.floor(baseDelay + jitter)
}

// Helper function to create a timeout promise
function createTimeoutPromise<T>(timeoutMs: number, errorMessage: string): Promise<T> {
  return new Promise<T>((_, reject) => {
    setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
  })
}

// Helper function to check if error is retryable
// function isRetryableError(error: unknown): boolean {
//   if (error instanceof Error) {
//     // Network errors or timeout errors
//     if (error.message.includes('fetch') || error.message.includes('timeout') || error.message.includes('network')) {
//       return true
//     }
//   }
//   if (error instanceof SupabaseError) {
//     // Retry on server errors (5xx) but not client errors (4xx)
//     return error.code === 'EDGE_FUNCTION_ERROR'
//   }
//   return false
// }

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
  if (!allowClientRiotKey()) {
    throw new RiotApiError('Client-side Riot API access is disabled.', 'BACKEND_REQUIRED')
  }
  const key = localStorage.getItem('tft-ally::riot-api-key')
  if (!key) {
    throw new RiotApiError(
      'Dev only: set localStorage key tft-ally::riot-api-key after enabling VITE_ALLOW_CLIENT_RIOT_KEY.',
      'NO_KEY',
    )
  }
  return key
}

async function riotFetch<T>(url: string, regionPrefix: string, logFn?: (msg: string) => void): Promise<T> {
  const log = logFn ?? console.log
  await waitForRateLimit()
  requestTimestamps.push(Date.now())

  const apiKey = getApiKey()
  log('[RIOT] Making Riot API request:', { url, regionPrefix })

  const fullUrl = `https://${regionPrefix}.api.riotgames.com${url}`

  try {
    const res = await Promise.race([
      fetch(fullUrl, { headers: { 'X-Riot-Token': apiKey } }),
      createTimeoutPromise<Response>(REQUEST_TIMEOUT, `Request timeout after ${REQUEST_TIMEOUT}ms`),
    ])

    if (res.status === 404) {
      log('[RIOT] 404 Not Found:', { url, regionPrefix })
      throw new RiotApiError('Player not found', 'NOT_FOUND')
    }
    if (res.status === 429) {
      log('[RIOT] 429 Rate Limited:', { url, regionPrefix })
      throw new RiotApiError('Rate limited — wait a moment', 'RATE_LIMIT')
    }
    if (res.status === 403) {
      log('[RIOT] 403 Forbidden:', { url, regionPrefix })
      throw new RiotApiError('Invalid API key', 'FORBIDDEN')
    }
    if (!res.ok) {
      log('[RIOT] API Error:', { url, regionPrefix, status: res.status })
      throw new RiotApiError(`Riot API error ${res.status}`, 'API_ERROR')
    }

    const data = await res.json() as Promise<T>
    log('[RIOT] Riot API success:', { url, regionPrefix })
    return data
  } catch (error) {
    if (error instanceof RiotApiError) {
      throw error
    }
    if (error instanceof Error && error.message.includes('timeout')) {
      log('[RIOT] Request timeout:', { url, regionPrefix })
      throw new RiotApiError('Request timeout', 'TIMEOUT')
    }
    log('[RIOT] Network error:', { url, regionPrefix, error: error instanceof Error ? error.message : String(error) })
    throw new RiotApiError('Network error', 'NETWORK_ERROR')
  }
}

export class RiotApiError extends Error {
  code: string
  constructor(message: string, code: string) {
    super(message)
    this.code = code
    this.name = 'RiotApiError'
  }
}

async function trySupabase<T>(
  supabaseFn: () => Promise<T>,
  fallback: () => Promise<T>,
  logFn?: (msg: string) => void
): Promise<T> {
  const log = logFn ?? console.log

  if (!hasSupabase()) {
    if (allowClientRiotKey()) {
      log('[RIOT] Supabase not configured; using direct Riot (dev-only)')
      return fallback()
    }
    backendRequired()
  }

  let lastError: Error | null = null

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      log(`[SUPABASE] Attempt ${attempt + 1}/${MAX_RETRIES + 1} to call Supabase edge function`)
      const result = await supabaseFn()
      log('[SUPABASE] Supabase edge function succeeded')
      return result
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))

      if (err instanceof SupabaseError) {
        if (err.code === 'NO_CONFIG') {
          if (allowClientRiotKey()) {
            log('[FALLBACK] Supabase not configured, using direct Riot (dev-only)')
            return fallback()
          }
          backendRequired()
        }

        if (err.code === 'EDGE_CLIENT_ERROR') {
          if (allowClientRiotKey()) {
            log(`[FALLBACK] Supabase client error (${err.message}), using direct Riot (dev-only)`)
            return fallback()
          }
          throw err
        }

        if (attempt < MAX_RETRIES) {
          const delay = getRetryDelay(attempt)
          log(`[SUPABASE] Server error, retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`)
          await new Promise(resolve => setTimeout(resolve, delay))
          continue
        }

        log(`[SUPABASE] Failed after ${MAX_RETRIES + 1} attempts: ${lastError.message}`)
        if (allowClientRiotKey()) {
          log('[FALLBACK] Using direct Riot after Supabase errors (dev-only)')
          return fallback()
        }
        throw new RiotApiError(
          'TFT Ally servers could not complete this request. Try again shortly.',
          'BACKEND_DOWN',
        )
      }

      throw err
    }
  }

  throw lastError || new Error('Unknown error in trySupabase')
}
export async function fetchSummonerByName(name: string, region: RiotRegion, logFn?: (msg: string) => void): Promise<Summoner> {
  const log = logFn ?? console.log
  log('[RIOT] fetchSummonerByName called:', { name, region })
  const cacheKey = `summoner:${region}:${name.toLowerCase()}`
  const cached = getCache<Summoner>(cacheKey)
  if (cached) {
    log('[RIOT] Returning cached summoner:', { name: cached.name, id: cached.id })
    return cached
  }

  const data = await trySupabase(
    () => fetchSummonerByNameSupabase(name, region),
    () => riotFetch<Summoner>(`/tft/summoner/v1/summoners/by-name/${encodeURIComponent(name)}`, region, log),
    log
  )
  log('[RIOT] fetchSummonerByName returned:', { name: data.name, id: data.id, puuid: data.puuid })
  setCache(cacheKey, data, ONE_HOUR)
  return data
}

export async function fetchLeagueEntries(summonerId: string, region: RiotRegion): Promise<LeagueEntry[]> {
  const cacheKey = `league:${region}:${summonerId}`
  const cached = getCache<LeagueEntry[]>(cacheKey)
  if (cached) {
    return cached
  }

  const data = await trySupabase(
    () => fetchLeagueEntriesSupabase(summonerId, region),
    () => riotFetch<LeagueEntry[]>(`/tft/league/v1/entries/by-puuid/${encodeURIComponent(summonerId)}`, region),
  )
  setCache(cacheKey, data, ONE_HOUR)
  return data
}

export async function fetchMatchIds(
  puuid: string,
  riotRegion: RiotRegion,
  matchRegion: MatchRegion,
  count = 20,
  offset = 0,
  logFn?: (msg: string) => void
): Promise<string[]> {
  const log = logFn ?? console.log
  log('[RIOT] fetchMatchIds called: ' + JSON.stringify({ puuid, riotRegion, matchRegion, count, offset }))
  const cacheKey = `match-ids:${matchRegion}:${puuid}:${count}:${offset}`
  removeCache(cacheKey) // temporary: remove after first successful load
  const cached = getCache<string[]>(cacheKey)
  if (cached && cached.length > 0) {
    log('[RIOT] Returning cached match IDs: ' + cached.length)
    return cached
  }

  const url = `/tft/match/v1/matches/by-puuid/${puuid}/ids?count=${count}&start=${offset}`
  log(`[MH] fetchMatchIds URL: ${url}`)

  const data = await trySupabase(
    () => fetchMatchIdsSupabase(puuid, riotRegion, count, offset, log),
    async () => {
      log('[FALLBACK] Using direct Riot API')
      const fullUrl = `https://${matchRegion}.api.riotgames.com${url}`
      log(`[MH] Full URL: ${fullUrl}`)
      const apiKey = getApiKey()

      try {
        const response = await Promise.race([
          fetch(fullUrl, { headers: { 'X-Riot-Token': apiKey } }),
          createTimeoutPromise<Response>(REQUEST_TIMEOUT, `Request timeout after ${REQUEST_TIMEOUT}ms`),
        ])

        log(`[MH] fetchMatchIds status: ${response.status}`)

        if (!response.ok) {
          const text = await response.text()
          log(`[MH] fetchMatchIds error response: ${text.slice(0, 300)}`)
          throw new RiotApiError(`Riot API error ${response.status}`, 'API_ERROR')
        }

        const text = await response.text()
        log(`[MH] fetchMatchIds raw response: ${text.slice(0, 300)}`)
        const result = JSON.parse(text) as string[]

        log('[FALLBACK] Direct Riot API succeeded, returned ' + result.length + ' match IDs')
        return result
      } catch (error) {
        log('[FALLBACK] Direct Riot API failed: ' + (error instanceof Error ? error.message : String(error)))
        throw error
      }
    },
    log
  )

  log('[RIOT] fetchMatchIds returned: ' + JSON.stringify({ count: data.length, matchIds: data }))
  if (data.length > 0) setCache(cacheKey, data, ONE_DAY)
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
      const card = await fetchPlayerCardSupabase(name, region)

      // Check if Supabase card has league data, if not try to fetch it
      if (!card.tier && !card.rank && !card.lp) {
        try {
          const entries = await fetchLeagueEntries(card.puuid, region)
          const ranked = entries.find((e) => e.queueType === 'RANKED_TFT')
          return {
            ...card,
            rank: ranked?.rank ?? null,
            tier: ranked?.tier ?? null,
            lp: ranked?.leaguePoints ?? null,
          }
        } catch {
          // League fetch failed, return card without league data
          return card
        }
      }

      return card
    } catch (err) {
      if (err instanceof SupabaseError && err.code === 'NO_CONFIG') {
        // Supabase not configured — fall through to direct
      } else if (err instanceof SupabaseError) {
        // Edge fn returned non-2xx — fall through to direct
      } else {
        throw err
      }
    }
  }

  const summoner = await fetchSummonerByName(name, region)
  const entries = await fetchLeagueEntries(summoner.puuid, region)
  const ranked = entries.find((e) => e.queueType === 'RANKED_TFT')

  const card = {
    name: summoner.name,
    puuid: summoner.puuid,
    level: summoner.summonerLevel,
    profileIconId: summoner.profileIconId,
    rank: ranked?.rank ?? null,
    tier: ranked?.tier ?? null,
    lp: ranked?.leaguePoints ?? null,
  }
  return card
}

export async function getServerStatus(region: RiotRegion): Promise<Record<string, unknown>> {
  return await trySupabase(
    () => fetchServerStatusSupabase(region),
    () => riotFetch<Record<string, unknown>>('/tft/status/v1/platform-data', region),
  )
}

export async function getActiveGame(puuid: string, region: RiotRegion): Promise<Record<string, unknown> | null> {
  return await trySupabase(
    () => fetchActiveGameSupabase(puuid, region),
    async () => {
      try {
        return await riotFetch<Record<string, unknown>>(
          `/lol/spectator/v5/active-games/by-summoner/${encodeURIComponent(puuid)}`,
          region,
        )
      } catch (e) {
        if (e instanceof RiotApiError && e.code === 'NOT_FOUND') return null
        throw e
      }
    },
  )
}

export { regionToMatchRegion }
