import type { Match, MatchDetail, RiotRegion } from '../types/riot'
import { fetchMatchIds, fetchMatchDetail, regionToMatchRegion, RiotApiError } from './riotApiClient'
import { getCache, setCache, removeCache, ONE_DAY } from './storageService'
import { supabase, hasSupabase } from './supabaseClient'
import type { PersonalMatchRecord } from './indexedDbService'
import { getUnsyncedMatches, markPersonalMatchSynced } from './indexedDbService'

// ── Error Types ───────────────────────────────────────────────────────────────

export class MatchHistoryError extends Error {
  constructor(
    message: string,
    public code: string,
    public retryable: boolean = true,
    public originalError?: Error
  ) {
    super(message)
    this.name = 'MatchHistoryError'
  }
}

export class NetworkError extends MatchHistoryError {
  constructor(message: string, originalError?: Error) {
    super(message, 'NETWORK_ERROR', true, originalError)
    this.name = 'NetworkError'
  }
}

export class RateLimitError extends MatchHistoryError {
  constructor(message: string, public retryAfter?: number) {
    super(message, 'RATE_LIMIT_ERROR', true)
    this.name = 'RateLimitError'
  }
}

export class InvalidPlayerError extends MatchHistoryError {
  constructor(message: string) {
    super(message, 'INVALID_PLAYER', false)
    this.name = 'InvalidPlayerError'
  }
}

export class NoMatchHistoryError extends MatchHistoryError {
  constructor(message: string) {
    super(message, 'NO_MATCH_HISTORY', false)
    this.name = 'NoMatchHistoryError'
  }
}

export class ServiceUnavailableError extends MatchHistoryError {
  constructor(message: string) {
    super(message, 'SERVICE_UNAVAILABLE', true)
    this.name = 'ServiceUnavailableError'
  }
}

// ── Retry Configuration ─────────────────────────────────────────────────────────

interface RetryConfig {
  maxRetries: number
  initialDelay: number
  maxDelay: number
  backoffMultiplier: number
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  logFn?: (msg: string) => void
): Promise<T> {
  const log = logFn ?? console.log
  let lastError: Error | undefined

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // Don't retry non-retryable errors
      if (error instanceof MatchHistoryError && !error.retryable) {
        throw error
      }

      // Don't retry after the last attempt
      if (attempt === config.maxRetries) {
        log(`[MH] Max retries (${config.maxRetries}) reached, giving up`)
        throw lastError
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        config.initialDelay * Math.pow(config.backoffMultiplier, attempt),
        config.maxDelay
      )

      // Handle rate limit retry-after if available
      if (error instanceof RateLimitError && error.retryAfter) {
        const rateLimitDelay = error.retryAfter * 1000
        log(`[MH] Rate limited, waiting ${rateLimitDelay}ms before retry ${attempt + 1}/${config.maxRetries}`)
        await sleep(rateLimitDelay)
      } else {
        log(`[MH] Attempt ${attempt + 1}/${config.maxRetries} failed, retrying in ${delay}ms: ${lastError.message}`)
        await sleep(delay)
      }
    }
  }

  throw lastError || new Error('Unknown error in retryWithBackoff')
}

function normalizeCompName(traits: { name: string; num_units: number }[]): string | null {
  const active = traits.filter((t) => t.num_units > 0).map((t) => t.name)
  if (active.length === 0) return null
  return active.slice(0, 3).join(' / ')
}

function parseMatch(detail: MatchDetail, puuid: string): Match {
  console.log('[MH] parseMatch called:', { matchId: detail.metadata.match_id, puuid })
  const info = detail.info
  const me = info.participants.find((p) => p.puuid === puuid)
  if (!me) {
    console.warn('[MH] Participant not found in match:', { matchId: detail.metadata.match_id, puuid })
    return {
      matchId: detail.metadata.match_id,
      placement: 0,
      level: 0,
      date: new Date(info.game_datetime),
      gameLength: info.game_length,
      gameType: info.tft_game_type,
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

  const match = {
    matchId: detail.metadata.match_id,
    placement: me.placement,
    level: me.level,
    date: new Date(info.game_datetime),
    gameLength: info.game_length,
    gameType: info.tft_game_type,
    units: unitNames,
    augments: me.augments,
    traits,
    comp: normalizeCompName(me.traits),
  }
  console.log('[MH] parseMatch returned:', { matchId: match.matchId, placement: match.placement, level: match.level })
  return match
}

// ── Cache Management ───────────────────────────────────────────────────────

function validateCacheEntry(matches: Match[]): boolean {
  if (!matches || matches.length === 0) {
    return false
  }

  // Validate each match has required fields
  return matches.every(m =>
    m.matchId &&
    m.placement !== undefined &&
    m.date instanceof Date &&
    !isNaN(m.date.getTime())
  )
}

function clearAllMatchHistoryCache(): void {
  // Clear all match history cache entries
  const keys = Object.keys(localStorage).filter(key => key.startsWith('history:'))
  keys.forEach(key => localStorage.removeItem(key))
  console.log('[MH] Cleared ' + keys.length + ' match history cache entries')
}

function getCacheStats(): { total: number; valid: number; invalid: number } {
  const keys = Object.keys(localStorage).filter(key => key.startsWith('history:'))
  let valid = 0
  let invalid = 0

  keys.forEach(key => {
    try {
      const cached = localStorage.getItem(key)
      if (cached) {
        const parsed = JSON.parse(cached)
        if (parsed.data && parsed.data.length > 0) {
          valid++
        } else {
          invalid++
        }
      }
    } catch {
      invalid++
    }
  })

  return { total: keys.length, valid, invalid }
}

export async function fetchPlayerMatchHistory(
  puuid: string,
  region: RiotRegion,
  count = 20,
  offset = 0,
  logFn?: (msg: string) => void,
  options: { forceRefresh?: boolean; offlineMode?: boolean } = {}
): Promise<Match[]> {
  const log = logFn ?? console.log
  const { forceRefresh = false, offlineMode = false } = options

  log('[MH] fetchPlayerMatchHistory called: ' + JSON.stringify({ puuid, region, count, offset, forceRefresh, offlineMode }))
  const cacheKey = `history:${region}:${puuid}:${count}:${offset}`

  // Try to get cached data first (unless force refresh)
  if (!forceRefresh) {
    const cached = getCache<Match[]>(cacheKey)
    if (cached && cached.length > 0 && validateCacheEntry(cached)) {
      log('[MH] Returning cached matches: ' + cached.length)
      return cached.map((m) => ({ ...m, date: new Date(m.date) }))
    } else if (cached) {
      log('[MH] Found cached matches but validation failed, will refetch')
    }
  }

  // If offline mode is enabled and we have no valid cache, return empty
  if (offlineMode) {
    log('[MH] Offline mode enabled, no valid cache available')
    throw new NetworkError('No cached data available. You appear to be offline.')
  }

  // Clear cache before fetching to avoid stale/failed results
  removeCache(cacheKey)
  log('[MH] Cache cleared for key: ' + cacheKey)

  try {
    const matchRegion = regionToMatchRegion(region)
    log('[MH] Region mapping: ' + JSON.stringify({ region, matchRegion }))

    // Fetch match IDs with retry logic
    const matchIds = await retryWithBackoff(
      () => fetchMatchIds(puuid, region, matchRegion, count, offset, log),
      DEFAULT_RETRY_CONFIG,
      log
    )
    log('[MH] fetchMatchIds returned: ' + JSON.stringify({ count: matchIds.length, matchIds }))

    // If the API returns fewer than requested, we've reached the end
    if (matchIds.length === 0) {
      log('[MH] No match IDs found')
      if (offset === 0) {
        throw new NoMatchHistoryError('No match history found for this player')
      }
      return []
    }

    // Implement concurrency control to avoid overwhelming the rate limiter
    const CONCURRENCY_LIMIT = 10
    const details: (MatchDetail | null)[] = []

    for (let i = 0; i < matchIds.length; i += CONCURRENCY_LIMIT) {
      const batch = matchIds.slice(i, i + CONCURRENCY_LIMIT)
      log(`[MH] Fetching batch ${Math.floor(i / CONCURRENCY_LIMIT) + 1}/${Math.ceil(matchIds.length / CONCURRENCY_LIMIT)}: ${batch.length} matches`)

      const batchDetails = await Promise.all(
        batch.map(async (id) => {
          try {
            return await retryWithBackoff(
              () => fetchMatchDetail(id, matchRegion),
              DEFAULT_RETRY_CONFIG,
              log
            )
          } catch (err) {
            log(`[MH] Failed to fetch match ${id}: ` + (err instanceof Error ? err.message : String(err)))
            return null
          }
        }),
      )

      details.push(...batchDetails)
    }

    const matches = details
      .filter((d): d is MatchDetail => d !== null)
      .map((d) => parseMatch(d, puuid))

    log('[MH] Parsed matches: ' + JSON.stringify({ total: matches.length, successful: matches.length, failed: details.length - matches.length }))

    // Only cache non-empty results to avoid persisting failed fetches
    if (matches.length > 0) {
      setCache(cacheKey, matches, ONE_DAY)
      log('[MH] Cached ' + matches.length + ' matches for ' + ONE_DAY / (1000 * 60 * 60) + ' hours')
    } else {
      log('[MH] Not caching empty result')
    }

    return matches
  } catch (error) {
    if (error instanceof RiotApiError) {
      if (error.code === 'BACKEND_REQUIRED') {
        throw new MatchHistoryError(error.message, 'BACKEND_REQUIRED', false, error)
      }
      if (error.code === 'BACKEND_DOWN') {
        throw new ServiceUnavailableError(error.message)
      }
      if (error.code === 'NOT_FOUND') {
        throw new InvalidPlayerError('Player not found. Please check the summoner name and region.')
      }
    }

    // Enhance error messages based on error type
    if (error instanceof Error) {
      // Check for network-related errors
      if (error.message.includes('fetch') || error.message.includes('network') || error.message.includes('ENOTFOUND')) {
        throw new NetworkError('Unable to connect to Riot servers. Please check your internet connection.', error)
      }

      // Check for rate limiting
      if (error.message.includes('429') || error.message.includes('rate limit')) {
        throw new RateLimitError('Rate limit exceeded. Please wait a moment before trying again.')
      }

      // Check for invalid player
      if (error.message.includes('404') || error.message.includes('not found')) {
        throw new InvalidPlayerError('Player not found. Please check the summoner name and region.')
      }

      // Check for service unavailable
      if (error.message.includes('503') || error.message.includes('service unavailable')) {
        throw new ServiceUnavailableError('Riot servers are temporarily unavailable. Please try again later.')
      }

      // Re-throw our custom errors
      if (error instanceof MatchHistoryError) {
        throw error
      }

      // Generic error
      throw new MatchHistoryError(`Failed to load match history: ${error.message}`, 'UNKNOWN_ERROR', true, error)
    }

    throw new MatchHistoryError('An unknown error occurred while fetching match history', 'UNKNOWN_ERROR', true)
  }
}

export function toRiotMatchFromPersonal(record: PersonalMatchRecord): Match {
  return {
    matchId: record.id,
    placement: record.placement ?? 0,
    level: 0,
    date: new Date(record.createdAt),
    gameLength: record.duration ?? 0,
    gameType: 'standard',
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

// ── Cache Management Exports ─────────────────────────────────────────────────

export { clearAllMatchHistoryCache, getCacheStats }

// ── Offline Mode Support ─────────────────────────────────────────────────────

export function getCachedMatchHistory(
  puuid: string,
  region: RiotRegion,
  count = 20,
  offset = 0
): Match[] | null {
  const cacheKey = `history:${region}:${puuid}:${count}:${offset}`
  const cached = getCache<Match[]>(cacheKey)

  if (cached && cached.length > 0 && validateCacheEntry(cached)) {
    return cached.map((m) => ({ ...m, date: new Date(m.date) }))
  }

  return null
}

export function hasCachedMatchHistory(
  puuid: string,
  region: RiotRegion
): boolean {
  // Check if we have any cached data for this player
  const keys = Object.keys(localStorage).filter(key =>
    key.startsWith(`history:${region}:${puuid}:`)
  )

  return keys.length > 0
}

export function isOnline(): boolean {
  return navigator.onLine
}

export function getUserFriendlyErrorMessage(error: Error): string {
  if (error instanceof NetworkError) {
    return error.message
  }

  if (error instanceof RateLimitError) {
    return error.message
  }

  if (error instanceof InvalidPlayerError) {
    return error.message
  }

  if (error instanceof NoMatchHistoryError) {
    return error.message
  }

  if (error instanceof ServiceUnavailableError) {
    return error.message
  }

  if (error instanceof MatchHistoryError) {
    return error.message
  }

  if (error instanceof RiotApiError) {
    return error.message
  }

  // Generic fallback
  return 'An unexpected error occurred. Please try again.'
}

export function getErrorActionText(error: Error): string {
  if (error instanceof NetworkError) {
    return 'Check your internet connection and try again'
  }

  if (error instanceof RateLimitError) {
    return 'Please wait a moment before trying again'
  }

  if (error instanceof InvalidPlayerError) {
    return 'Please check the summoner name and region'
  }

  if (error instanceof NoMatchHistoryError) {
    return 'This player has no match history yet'
  }

  if (error instanceof ServiceUnavailableError) {
    return 'Riot servers are temporarily unavailable'
  }

  if (error instanceof MatchHistoryError && error.code === 'BACKEND_REQUIRED') {
    return 'Use the production build with Supabase configured, or enable the developer Riot key flag only for local testing'
  }

  return 'Try refreshing the page'
}

export function isRetryableError(error: Error): boolean {
  if (error instanceof MatchHistoryError) {
    if (error.code === 'BACKEND_REQUIRED') return false
    return error.retryable
  }
  return true
}
