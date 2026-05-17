import type { EnrichedMatch } from '@ally/shared-types'
import type { Match, MatchDetail, RiotRegion } from '../types/riot'
import { pipelineLegacyRiotMatch, pipelinePersonalMatch, pipelineRiotMatchDetail } from '@/domain/pipeline'
import { canonicalToLegacyMatch } from '@/domain/legacyAdapter'
import { normalizeAugmentDisplayName } from '@/shared/augmentParse'
import { normalizeChampionId, normalizeItemId } from '@/shared/gameEngine'
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

  const unitBuilds = me.units.map((u) => ({
    name: normalizeChampionId(u.character_id || u.name || ''),
    starLevel: u.tier > 0 ? u.tier : null,
    items: (u.itemNames ?? []).map((raw) => normalizeItemId(raw)).filter(Boolean),
  }))
  const unitNames = unitBuilds.map((u) => u.name)

  const traitLines = me.traits
    .filter((t) => t.num_units > 0)
    .sort((a, b) => b.num_units - a.num_units)
    .map((t) => ({
      rawId: t.name,
      numUnits: t.num_units,
      tierCurrent: t.tier_current,
      tierTotal: t.tier_total,
    }))

  const traits = traitLines.map((t) => t.rawId)

  const match = {
    matchId: detail.metadata.match_id,
    placement: me.placement,
    level: me.level,
    date: new Date(info.game_datetime),
    gameLength: info.game_length,
    gameType: info.tft_game_type,
    units: unitNames,
    unitBuilds,
    traitLines,
    augments: (me.augments ?? []).map((a) => normalizeAugmentDisplayName(a)).filter(Boolean),
    traits,
    comp: normalizeCompName(me.traits),
  }
  console.log('[MH] parseMatch returned:', { matchId: match.matchId, placement: match.placement, level: match.level })
  return match
}

// ── Cache Management ───────────────────────────────────────────────────────

/** Must match `storageService` PREFIX — logical keys are `history:*` / `history-enriched:*`. */
const STORAGE_PREFIX = 'tft-ally::'
const LEGACY_HISTORY_KEY_PREFIX = 'history:'
const ENRICHED_HISTORY_KEY_PREFIX = 'history-enriched:'

function isMatchHistoryLogicalKey(key: string): boolean {
  return (
    key.startsWith(LEGACY_HISTORY_KEY_PREFIX) ||
    key.startsWith(ENRICHED_HISTORY_KEY_PREFIX)
  )
}

function listMatchHistoryStorageKeys(): string[] {
  const keys: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const fullKey = localStorage.key(i)
    if (!fullKey?.startsWith(STORAGE_PREFIX)) continue
    const logical = fullKey.slice(STORAGE_PREFIX.length)
    if (isMatchHistoryLogicalKey(logical)) keys.push(fullKey)
  }
  return keys
}

function isPlayerMatchHistoryLogicalKey(
  logicalKey: string,
  region: RiotRegion,
  puuid: string,
): boolean {
  const legacyPrefix = `${LEGACY_HISTORY_KEY_PREFIX}${region}:${puuid}:`
  const enrichedPrefix = `${ENRICHED_HISTORY_KEY_PREFIX}${region}:${puuid}:`
  return logicalKey.startsWith(legacyPrefix) || logicalKey.startsWith(enrichedPrefix)
}

function isValidStoredCacheEntry(raw: string | null): boolean {
  if (!raw) return false
  try {
    const entry = JSON.parse(raw) as { value?: unknown; expiresAt?: number; data?: unknown }
    if (typeof entry.expiresAt === 'number' && Date.now() > entry.expiresAt) return false
    const payload = entry.value ?? entry.data
    return Array.isArray(payload) && payload.length > 0
  } catch {
    return false
  }
}

function bucketForLogicalKey(logicalKey: string): 'legacy' | 'enriched' | null {
  if (logicalKey.startsWith(ENRICHED_HISTORY_KEY_PREFIX)) return 'enriched'
  if (logicalKey.startsWith(LEGACY_HISTORY_KEY_PREFIX)) return 'legacy'
  return null
}

export type MatchHistoryCacheStats = {
  total: number
  valid: number
  invalid: number
  legacy: { total: number; valid: number; invalid: number }
  enriched: { total: number; valid: number; invalid: number }
}

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
  const keys = listMatchHistoryStorageKeys()
  keys.forEach((key) => localStorage.removeItem(key))
  console.log('[MH] Cleared ' + keys.length + ' match history cache entries')
}

function getCacheStats(): MatchHistoryCacheStats {
  const emptyBucket = { total: 0, valid: 0, invalid: 0 }
  const stats: MatchHistoryCacheStats = {
    total: 0,
    valid: 0,
    invalid: 0,
    legacy: { ...emptyBucket },
    enriched: { ...emptyBucket },
  }

  for (const fullKey of listMatchHistoryStorageKeys()) {
    const logical = fullKey.slice(STORAGE_PREFIX.length)
    const bucket = bucketForLogicalKey(logical)
    if (!bucket) continue

    stats.total++
    stats[bucket].total++

    if (isValidStoredCacheEntry(localStorage.getItem(fullKey))) {
      stats.valid++
      stats[bucket].valid++
    } else {
      stats.invalid++
      stats[bucket].invalid++
    }
  }

  return stats
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

const SET_HISTORY_PAGE_SIZE = 100
const SET_HISTORY_MAX_PAGES = 30

function matchSetNumber(m: Match): number {
  return m.setNumber ?? 0
}

/** True when every match on the page is from an older TFT set than `targetSet` (none match target). */
function pageEntirelyOlderSets(pageMatches: Match[], targetSet: number): boolean {
  if (pageMatches.length === 0) return false
  const known = pageMatches.filter((m) => matchSetNumber(m) > 0)
  if (known.length === 0) return false
  if (known.some((m) => matchSetNumber(m) === targetSet)) return false
  return known.every((m) => matchSetNumber(m) < targetSet)
}

/**
 * Paginates match-v5 history and returns every game played on `targetSetNumber`
 * (e.g. current set from static meta), up to {@link SET_HISTORY_MAX_PAGES} × page size ID slots.
 */
export async function fetchPlayerMatchHistoryForSet(
  puuid: string,
  region: RiotRegion,
  targetSetNumber: number,
  logFn?: (msg: string) => void,
  options: { pageSize?: number; maxPages?: number; offlineMode?: boolean } = {},
): Promise<Match[]> {
  const log = logFn ?? console.log
  const pageSize = Math.min(options.pageSize ?? SET_HISTORY_PAGE_SIZE, 100)
  const maxPages = options.maxPages ?? SET_HISTORY_MAX_PAGES

  if (options.offlineMode) {
    log('[MH] fetchPlayerMatchHistoryForSet: offline mode, skipping')
    return []
  }

  const matchRegion = regionToMatchRegion(region)
  const collected: Match[] = []

  try {
    for (let page = 0; page < maxPages; page++) {
      const offset = page * pageSize
      const matchIds = await retryWithBackoff(
        () => fetchMatchIds(puuid, region, matchRegion, pageSize, offset, log),
        DEFAULT_RETRY_CONFIG,
        log,
      )

      if (matchIds.length === 0) {
        if (page === 0) {
          throw new NoMatchHistoryError('No match history found for this player')
        }
        break
      }

      const CONCURRENCY_LIMIT = 10
      const details: (MatchDetail | null)[] = []

      for (let i = 0; i < matchIds.length; i += CONCURRENCY_LIMIT) {
        const batch = matchIds.slice(i, i + CONCURRENCY_LIMIT)
        const batchDetails = await Promise.all(
          batch.map(async (id) => {
            try {
              return await retryWithBackoff(
                () => fetchMatchDetail(id, matchRegion),
                DEFAULT_RETRY_CONFIG,
                log,
              )
            } catch (err) {
              log(`[MH] Failed to fetch match ${id}: ` + (err instanceof Error ? err.message : String(err)))
              return null
            }
          }),
        )
        details.push(...batchDetails)
      }

      const pageMatches = details
        .filter((d): d is MatchDetail => d !== null)
        .map((d) => parseMatch(d, puuid))

      for (const m of pageMatches) {
        if (matchSetNumber(m) === targetSetNumber && m.placement > 0) {
          collected.push(m)
        }
      }

      log(
        `[MH] fetchPlayerMatchHistoryForSet page ${page + 1}: +${pageMatches.filter((m) => matchSetNumber(m) === targetSetNumber).length} for set ${targetSetNumber} (total ${collected.length})`,
      )

      if (matchIds.length < pageSize) break
      if (pageEntirelyOlderSets(pageMatches, targetSetNumber)) {
        log('[MH] fetchPlayerMatchHistoryForSet: stopping — reached older TFT sets only')
        break
      }
    }
  } catch (error) {
    if (error instanceof MatchHistoryError || error instanceof RiotApiError) throw error
    if (error instanceof Error) {
      throw new MatchHistoryError(
        `Failed to load set-scoped match history: ${error.message}`,
        'UNKNOWN_ERROR',
        true,
        error,
      )
    }
    throw error
  }

  collected.sort((a, b) => b.date.getTime() - a.date.getTime())
  return collected
}

/** Riot match history via normalize → enrich → validate pipeline (canonical shape for UI). */
export async function fetchEnrichedPlayerMatchHistory(
  puuid: string,
  region: RiotRegion,
  count = 20,
  offset = 0,
  logFn?: (msg: string) => void,
  options: { forceRefresh?: boolean; offlineMode?: boolean } = {},
): Promise<EnrichedMatch[]> {
  const log = logFn ?? console.log
  const { forceRefresh = false, offlineMode = false } = options
  const cacheKey = `history-enriched:${region}:${puuid}:${count}:${offset}`

  if (!forceRefresh) {
    const cached = getCache<EnrichedMatch[]>(cacheKey)
    if (cached && cached.length > 0) {
      log('[MH] Returning cached enriched matches: ' + cached.length)
      return cached
    }
  }

  if (offlineMode) {
    throw new NetworkError('No cached enriched history available. You appear to be offline.')
  }

  removeCache(cacheKey)

  const matchRegion = regionToMatchRegion(region)
  const matchIds = await retryWithBackoff(
    () => fetchMatchIds(puuid, region, matchRegion, count, offset, log),
    DEFAULT_RETRY_CONFIG,
    log,
  )

  if (matchIds.length === 0) {
    if (offset === 0) {
      throw new NoMatchHistoryError('No match history found for this player')
    }
    return []
  }

  const CONCURRENCY_LIMIT = 10
  const details: (MatchDetail | null)[] = []

  for (let i = 0; i < matchIds.length; i += CONCURRENCY_LIMIT) {
    const batch = matchIds.slice(i, i + CONCURRENCY_LIMIT)
    const batchDetails = await Promise.all(
      batch.map(async (id) => {
        try {
          return await retryWithBackoff(
            () => fetchMatchDetail(id, matchRegion),
            DEFAULT_RETRY_CONFIG,
            log,
          )
        } catch {
          return null
        }
      }),
    )
    details.push(...batchDetails)
  }

  const enriched = details
    .filter((d): d is MatchDetail => d !== null)
    .map((d) => pipelineRiotMatchDetail(d, puuid))

  if (enriched.length > 0) {
    setCache(cacheKey, enriched, ONE_DAY)
  }

  return enriched
}

/**
 * Legacy `Match[]` API backed by the canonical pipeline (normalize → enrich → validate).
 * Prefer this over `fetchPlayerMatchHistory` for pages that still render `Match` / `MatchTable`.
 */
export async function fetchPlayerMatchHistoryViaPipeline(
  puuid: string,
  region: RiotRegion,
  count = 20,
  offset = 0,
  logFn?: (msg: string) => void,
  options: { forceRefresh?: boolean; offlineMode?: boolean } = {},
): Promise<Match[]> {
  const enriched = await fetchEnrichedPlayerMatchHistory(
    puuid,
    region,
    count,
    offset,
    logFn,
    options,
  )
  return enriched.map((e) => canonicalToLegacyMatch(e.match))
}

/** Read cached history as enriched rows (enriched cache first, then legacy cache upgraded). */
export function getCachedEnrichedMatchHistory(
  puuid: string,
  region: RiotRegion,
  count = 20,
  offset = 0,
): EnrichedMatch[] | null {
  const enrichedKey = `${ENRICHED_HISTORY_KEY_PREFIX}${region}:${puuid}:${count}:${offset}`
  const cached = getCache<EnrichedMatch[]>(enrichedKey)
  if (cached && cached.length > 0) return cached

  const legacy = getCachedMatchHistory(puuid, region, count, offset)
  if (legacy && legacy.length > 0) return enrichCachedLegacyMatches(legacy)

  return null
}

/** Legacy `Match[]` from cache (enriched bucket first, then legacy `history:` keys). */
export function getCachedMatchHistoryViaPipeline(
  puuid: string,
  region: RiotRegion,
  count = 20,
  offset = 0,
): Match[] | null {
  const enriched = getCachedEnrichedMatchHistory(puuid, region, count, offset)
  if (enriched?.length) {
    return enriched.map((e) => canonicalToLegacyMatch(e.match))
  }
  return null
}

/** Convert cached legacy `Match[]` rows to enriched canonical matches. */
export function enrichCachedLegacyMatches(matches: Match[]): EnrichedMatch[] {
  return matches.map((m) => pipelineLegacyRiotMatch(m))
}

export function toRiotMatchFromPersonal(record: PersonalMatchRecord): Match {
  return canonicalToLegacyMatch(pipelinePersonalMatch(record).match)
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
    items: record.items ?? [],
    unit_builds: record.unitBuilds ?? null,
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
  for (const fullKey of listMatchHistoryStorageKeys()) {
    const logical = fullKey.slice(STORAGE_PREFIX.length)
    if (!isPlayerMatchHistoryLogicalKey(logical, region, puuid)) continue
    if (isValidStoredCacheEntry(localStorage.getItem(fullKey))) return true
  }
  return false
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

  return 'Try refreshing the page'
}

export function isRetryableError(error: Error): boolean {
  if (error instanceof MatchHistoryError) {
    return error.retryable
  }
  return true
}
