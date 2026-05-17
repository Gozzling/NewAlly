import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { useAppStore } from '@/store/useAppStore'
import {
  fetchPlayerCard,
  getActiveGame,
  fetchMatchIds,
  fetchMatchDetail,
  regionToMatchRegion,
  RiotApiError,
} from '@/services/riotApiClient'
import type { RiotRegion } from '@/types/riot'
import { SupabaseError } from '@/services/supabaseService'
import { SearchInputWithSuggestions } from '@/components/SearchInputWithSuggestions'
import { useTypewriterPlaceholder } from '@/hooks/useTypewriterPlaceholder'
import { EXAMPLE_SUMMONERS } from '@/data/exampleSummoners'
import { AllySpinner } from '@/components/AllyLoading'

export function getPlacementColor(place: number) {
  if (place === 1) return '#fbbf24'
  if (place <= 4) return '#4ade80'
  return '#ef4444'
}

export function displayNameFromSpectatorParticipant(p: Record<string, unknown>): string {
  const gn = p.riotIdGameName
  const tl = p.riotIdTagLine
  if (typeof gn === 'string' && gn.length > 0) {
    const tag = typeof tl === 'string' && tl.length > 0 ? `#${tl}` : ''
    return `${gn}${tag}`
  }
  if (typeof p.riotId === 'string' && p.riotId.length > 0) return p.riotId
  if (typeof p.summonerName === 'string' && p.summonerName.length > 0) return p.summonerName
  return 'Unknown'
}

export function riotLookupFromParticipant(p: Record<string, unknown>): string | null {
  const gn = p.riotIdGameName
  const tl = p.riotIdTagLine
  if (typeof gn === 'string' && gn.length > 0 && typeof tl === 'string' && tl.length > 0) {
    return `${gn}#${tl}`
  }
  if (typeof p.riotId === 'string' && p.riotId.includes('#')) return p.riotId
  return null
}

export function parseSpectatorGameLengthSeconds(active: Record<string, unknown>): number {
  const gl = active.gameLength
  if (typeof gl === 'number' && gl >= 0) {
    if (gl > 100_000) return Math.floor(gl / 1000)
    return Math.floor(gl)
  }
  const rawStart = active.gameStartTime as number | undefined
  if (typeof rawStart === 'number' && rawStart > 0) {
    const startMs = rawStart > 10_000_000_000 ? rawStart : rawStart * 1000
    return Math.max(0, Math.floor((Date.now() - startMs) / 1000))
  }
  return 0
}

const INGAME_MOCK_PLAYERS: any[] = []

type LiveLobbyPlayer = {
  puuid: string
  name: string
  profileIconId: number
  riotLookup: string | null
  statsStatus: 'pending' | 'loading' | 'done' | 'error'
  tier: string | null
  rank: string | null
  lp: number | null
  recentPlacements: number[]
  statsError?: string
}

export function formatInGameError(err: unknown): string {
  if (err instanceof RiotApiError) {
    if (err.code === 'NOT_FOUND') {
      return 'Player not found. Double-check Riot ID (Name#TAG), region, and that the account exists.'
    }
    if (err.code === 'BACKEND_DOWN') {
      return err.message.trim().length > 0
        ? err.message
        : 'Our servers could not finish that request. Please try again shortly.'
    }
    return err.message
  }
  if (err instanceof SupabaseError) {
    if (err.code === 'NO_CONFIG') {
      return 'Supabase is not configured in this build (missing URL or anon key).'
    }
    if (/Missing ['"]tagLine['"]/i.test(err.message)) {
      return 'Riot lookup needs your full ID: GameName#TAG (example: Doublelift#NA1).'
    }
    return err.message
  }
  return 'Something went wrong. Check your connection and try again.'
}

export function formatGameLength(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function getGameMode(queueId: number) {
  const modes: Record<number, string> = {
    1090: 'Normal',
    1100: 'Ranked',
    1130: 'Hyper Roll',
    1160: 'Double Up',
  }
  return modes[queueId] || 'Unknown'
}

export function InGamePage() {
  const [searchInput, setSearchInput] = useState(
    () => (typeof localStorage !== 'undefined' ? localStorage.getItem('tft-ally::summoner-name') ?? '' : ''),
  )
  const [selectedRegion, setSelectedRegion] = useState<RiotRegion>(() => {
    if (typeof localStorage === 'undefined') {
      return useAppStore.getState().settings.region ?? 'euw1'
    }
    return (
      (localStorage.getItem('tft-ally::region') as RiotRegion | null) ??
      useAppStore.getState().settings.region ??
      'euw1'
    )
  })
  const [isLoading, setIsLoading] = useState(false)
  const [loadingPhase, setLoadingPhase] = useState<'player' | 'lobby' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeGame, setActiveGame] = useState<Record<string, unknown> | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [livePlayers, setLivePlayers] = useState<LiveLobbyPlayer[]>([])
  const [liveTimerSeconds, setLiveTimerSeconds] = useState(0)

  const gameTimerAnchorRef = useRef<{ baseSec: number; atMs: number } | null>(null)
  const gameTimerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const ingameSummonerExamples = useMemo(() => [...EXAMPLE_SUMMONERS], [])
  const { placeholderAnimated: ingameSearchPlaceholder } = useTypewriterPlaceholder(
    ingameSummonerExamples,
    searchInput.length > 0,
  )

  const stopGameTimer = useCallback(() => {
    if (gameTimerIntervalRef.current) {
      clearInterval(gameTimerIntervalRef.current)
      gameTimerIntervalRef.current = null
    }
    gameTimerAnchorRef.current = null
  }, [])

  const startGameTimer = useCallback(
    (game: Record<string, unknown>) => {
      stopGameTimer()
      const baseSec = parseSpectatorGameLengthSeconds(game)
      gameTimerAnchorRef.current = { baseSec, atMs: Date.now() }
      const tick = () => {
        const a = gameTimerAnchorRef.current
        if (!a) return
        setLiveTimerSeconds(a.baseSec + Math.floor((Date.now() - a.atMs) / 1000))
      }
      tick()
      gameTimerIntervalRef.current = setInterval(tick, 1000)
    },
    [stopGameTimer],
  )

  useEffect(() => {
    return () => {
      stopGameTimer()
    }
  }, [stopGameTimer])

  const handleLoadStats = useCallback(
    async (rowIndex: number) => {
      const row = livePlayers[rowIndex]
      if (!row || row.statsStatus === 'loading') return
      if (!row.riotLookup) {
        setLivePlayers((prev) =>
          prev.map((p, i) =>
            i === rowIndex
              ? { ...p, statsStatus: 'error', statsError: 'Riot ID (Name#TAG) not available for this player.' }
              : p,
          ),
        )
        return
      }
      setLivePlayers((prev) => prev.map((p, i) => (i === rowIndex ? { ...p, statsStatus: 'loading', statsError: undefined } : p)))
      try {
        const card = await fetchPlayerCard(row.riotLookup, selectedRegion)
        const matchRegion = regionToMatchRegion(selectedRegion)
        const ids = await fetchMatchIds(card.puuid, selectedRegion, matchRegion, 3, 0)
        const placements: number[] = []
        for (const id of ids.slice(0, 3)) {
          const detail = await fetchMatchDetail(id, matchRegion)
          const part = detail.info.participants.find((pp) => pp.puuid === card.puuid)
          if (part) placements.push(part.placement)
        }
        setLivePlayers((prev) =>
          prev.map((p, i) =>
            i === rowIndex
              ? {
                  ...p,
                  statsStatus: 'done',
                  tier: card.tier,
                  rank: card.rank,
                  lp: card.lp,
                  recentPlacements: placements,
                }
              : p,
          ),
        )
      } catch (err) {
        console.error('[INGAME] Load stats error:', err)
        setLivePlayers((prev) =>
          prev.map((p, i) =>
            i === rowIndex ? { ...p, statsStatus: 'error', statsError: formatInGameError(err) } : p,
          ),
        )
      }
    },
    [livePlayers, selectedRegion],
  )

  const handleSearch = async () => {
    if (!searchInput.trim()) return

    const hashIdx = searchInput.lastIndexOf('#')
    if (hashIdx === -1 || !searchInput.slice(hashIdx + 1).trim()) {
      setHasSearched(true)
      setActiveGame(null)
      setError('Enter a full Riot ID with tag, e.g. Name#NA1 (the #tag is required for lookup).')
      return
    }

    stopGameTimer()
    setIsLoading(true)
    setLoadingPhase('player')
    setHasSearched(true)
    setActiveGame(null)
    setLivePlayers([])
    setLiveTimerSeconds(0)
    setError(null)

    try {
      const card = await fetchPlayerCard(searchInput.trim(), selectedRegion)
      setLoadingPhase('lobby')
      const game = await getActiveGame(card.puuid, selectedRegion)

      if (!game) {
        setActiveGame(null)
        setLivePlayers([])
        setError(null)
        return
      }

      setActiveGame(game)
      const participants = (game.participants as unknown[]) || []
      const parsed: LiveLobbyPlayer[] = participants.map((raw) => {
        const p = raw as Record<string, unknown>
        return {
          puuid: typeof p.puuid === 'string' ? p.puuid : String(p.puuid ?? ''),
          name: displayNameFromSpectatorParticipant(p),
          profileIconId: typeof p.profileIconId === 'number' ? p.profileIconId : 0,
          riotLookup: riotLookupFromParticipant(p),
          statsStatus: 'pending',
          tier: null,
          rank: null,
          lp: null,
          recentPlacements: [],
        }
      })
      setLivePlayers(parsed)
      startGameTimer(game)
    } catch (err) {
      console.error('[INGAME] Search error:', err)
      setActiveGame(null)
      setLivePlayers([])
      setError(formatInGameError(err))
    } finally {
      setIsLoading(false)
      setLoadingPhase(null)
    }
  }

  const onRegionChange = (r: string) => {
    const next = r as RiotRegion
    setSelectedRegion(next)
    if (typeof localStorage !== 'undefined') localStorage.setItem('tft-ally::region', next)
  }

  const rawQueue = activeGame?.gameQueueConfigId
  const queueId = typeof rawQueue === 'number' ? rawQueue : typeof rawQueue === 'string' ? Number(rawQueue) : NaN

  const showDemoGrid = !hasSearched && !isLoading
  const showLiveGrid = Boolean(activeGame && !isLoading)
  const showNotInGame = hasSearched && !isLoading && !activeGame && !error

  return (
    <div className="p-4">
      {showDemoGrid && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2 px-3 text-caption text-yellow-500 mb-3 font-display uppercase tracking-wider">
          Live game detection requires Overwolf. Showing demo data.
        </div>
      )}

      {activeGame && !isLoading && (
        <div className="bg-ally-card border border-ally-border rounded-lg p-3 px-4 mb-4 flex justify-between items-center border-l-4 border-l-ally-accent shadow-card">
          <div className="flex items-center gap-2">
            <span className="text-caption font-bold tracking-widest uppercase text-ally-accent border border-ally-accent rounded-md px-2 py-1 font-display">
              {getGameMode(Number.isFinite(queueId) ? queueId : 0)}
            </span>
          </div>
          <div className="text-body font-bold text-ally-accent font-numbers">
            Live: {formatGameLength(liveTimerSeconds)}
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-4">
        <SearchInputWithSuggestions
          value={searchInput}
          onChange={setSearchInput}
          placeholder={ingameSearchPlaceholder || 'Summoner name…'}
          kinds={['summoner']}
          wrapperClassName="flex-1"
          inputClassName="w-full bg-ally-bg border border-ally-border rounded-lg px-3 py-2 text-body text-ally-text outline-none focus:border-ally-accent transition-colors"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              void handleSearch()
            }
          }}
        />
        <select
          value={selectedRegion}
          onChange={(e) => onRegionChange(e.target.value)}
          className="bg-ally-bg border border-ally-border rounded-lg px-3 py-2 text-body text-ally-text outline-none focus:border-ally-accent transition-colors"
        >
          <option value="na1">NA</option>
          <option value="euw1">EUW</option>
          <option value="kr">KR</option>
          <option value="jp1">JP</option>
        </select>
        <button
          type="button"
          onClick={() => void handleSearch()}
          disabled={isLoading}
          className="bg-ally-accent hover:bg-ally-accentDark disabled:opacity-50 disabled:cursor-not-allowed border-none rounded-lg px-4 py-2 text-body text-ally-bg font-bold font-display uppercase tracking-wider transition-all"
        >
          Search
        </button>
      </div>

      {error && !isLoading && (
        <div
          role="alert"
          className="flex items-start gap-2 bg-ally-error/10 border border-ally-error/20 rounded-lg p-2 px-3 text-caption text-ally-error mb-3"
        >
          <div className="flex-1 min-w-0 font-medium">{error}</div>
          <button
            type="button"
            onClick={() => setError(null)}
            aria-label="Dismiss"
            className="shrink-0 bg-none border-none text-ally-error cursor-pointer text-lg leading-none px-0.5 opacity-80 hover:opacity-100"
          >
            ×
          </button>
        </div>
      )}

      {isLoading ? (
        <>
          <div className="bg-ally-card border border-ally-border rounded-lg p-3 mb-3 shadow-card">
            <div className="mb-1 flex items-center gap-2 text-ally-text font-display font-bold uppercase tracking-wider text-caption">
              <AllySpinner className="text-ally-accent w-4 h-4" />
              <span>
                {loadingPhase === 'player' && 'Resolving player…'}
                {loadingPhase === 'lobby' && 'Fetching live lobby…'}
                {!loadingPhase && 'Loading…'}
              </span>
            </div>
            <div className="text-caption text-ally-muted">
              {loadingPhase === 'player' && 'Looking up account with Riot'}
              {loadingPhase === 'lobby' && 'Spectator API for this region'}
              {!loadingPhase && 'Please wait'}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-[120px] rounded-lg bg-ally-card animate-pulse shadow-card border border-ally-border/50"
              />
            ))}
          </div>
        </>
      ) : showDemoGrid ? (
        <div className="grid grid-cols-2 gap-3">
          {INGAME_MOCK_PLAYERS.length === 0 ? (
            <div className="col-span-2 py-20 text-center text-ally-muted">
              <p>No active lobby detected.</p>
              <p className="text-xs mt-2 opacity-50 text-balance">Once you enter a TFT game, your opponents will appear here automatically.</p>
            </div>
          ) : (
            INGAME_MOCK_PLAYERS.map((player, i) => (
              <div
                key={i}
                className="bg-ally-card border border-ally-border rounded-lg p-3 flex gap-3 items-center hover:border-ally-accent/30 transition-colors shadow-card group"
              >
                <div className="w-8 h-8 rounded-md bg-ally-bg overflow-hidden shrink-0 border border-ally-border group-hover:border-ally-accent/50 transition-colors">
                  <img
                    src={`https://ddragon.leagueoflegends.com/cdn/14.1.1/img/profileicon/${player.profileIconId}.png`}
                    alt={player.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-body font-bold text-ally-text mb-0.5 font-display uppercase tracking-wide truncate">{player.name}</div>
                  <div className="text-caption text-ally-muted mb-1.5 flex items-center gap-1 font-medium">
                    {player.rank}
                    {player.lp > 0 ? <span className="opacity-50">·</span> : null}
                    {player.lp > 0 ? <span className="text-ally-text-dim font-numbers">{player.lp} LP</span> : ''}
                  </div>
                  <div className="flex gap-1 mb-1.5 flex-wrap">
                    {player.recentPlacements.map((place: number, j: number) => (
                      <div
                        key={j}
                        style={{ background: getPlacementColor(place) }}
                        className="w-6 h-6 rounded flex items-center justify-center text-caption font-bold text-white font-numbers shadow-sm"
                      >
                        {place}
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <div className="text-caption text-ally-muted font-display uppercase tracking-tight">
                      Avg:{' '}
                      <span className="text-ally-text font-numbers font-bold">{player.avgPlace > 0 ? player.avgPlace.toFixed(1) : '-'}</span>
                    </div>
                    <div className="text-[10px] text-ally-accent font-bold font-display uppercase truncate max-w-[80px]">{player.predictedComp}</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : showLiveGrid ? (
        <div className="grid grid-cols-2 gap-3">
          {livePlayers.map((player, i) => (
            <div
              key={player.puuid || i}
              className="bg-ally-card border border-ally-border rounded-lg p-3 flex gap-3 items-center hover:border-ally-accent/30 transition-colors shadow-card group"
            >
              <div className="w-8 h-8 rounded-md bg-ally-bg overflow-hidden shrink-0 border border-ally-border group-hover:border-ally-accent/50 transition-colors">
                <img
                  src={`https://ddragon.leagueoflegends.com/cdn/14.1.1/img/profileicon/${player.profileIconId}.png`}
                  alt={player.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-body font-bold text-ally-text mb-0.5 font-display uppercase tracking-wide truncate">{player.name}</div>
                {player.statsStatus === 'pending' && (
                  <div className="text-caption text-ally-muted mb-1.5 animate-pulse italic">Loading stats...</div>
                )}
                {player.statsStatus === 'error' && (
                  <div className="text-[10px] text-ally-error mb-1.5">{player.statsError ?? 'Failed to load'}</div>
                )}
                {player.statsStatus === 'done' && (
                  <>
                    <div className="text-caption text-ally-muted mb-1.5 font-medium">
                      {player.tier && player.rank ? `${player.tier} ${player.rank}` : 'Unranked'}
                      {player.lp != null && player.lp > 0 ? <span className="opacity-50">·</span> : null}
                      {player.lp != null && player.lp > 0 ? <span className="text-ally-text-dim font-numbers">{player.lp} LP</span> : ''}
                    </div>
                    <div className="flex gap-1 mb-1.5 flex-wrap">
                      {player.recentPlacements.length > 0 ? (
                        player.recentPlacements.map((place: number, j: number) => (
                          <div
                            key={j}
                            style={{ background: getPlacementColor(place) }}
                            className="w-6 h-6 rounded flex items-center justify-center text-caption font-bold text-white font-numbers shadow-sm"
                          >
                            {place}
                          </div>
                        ))
                      ) : (
                        <span className="text-[10px] text-ally-muted/50 italic font-display uppercase">No recent matches</span>
                      )}
                    </div>
                  </>
                )}
                <button
                  type="button"
                  disabled={player.statsStatus === 'loading'}
                  onClick={() => void handleLoadStats(i)}
                  className="mt-1 text-[10px] font-bold font-display uppercase tracking-wider px-2.5 py-1 rounded-md border border-ally-accent bg-transparent text-ally-accent hover:bg-ally-accent hover:text-ally-bg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {player.statsStatus === 'loading' ? 'Loading…' : player.statsStatus === 'done' ? 'Refresh' : 'Load Stats'}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : showNotInGame ? (
        <div className="flex items-center justify-center min-h-[200px] text-center px-3 py-4 text-body text-ally-muted">
          Not currently in a TFT game
        </div>
      ) : hasSearched && error ? (
        <div className="flex items-center justify-center min-h-[120px] text-center px-3 py-4 text-caption text-ally-muted">
          Fix the issue above and try again.
        </div>
      ) : null}

      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  )
}
