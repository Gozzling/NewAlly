import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { subscribeToStateSnapshots } from '@/services/ipcService';
import {
  getServerStatus,
  fetchPlayerCard,
  getActiveGame,
  fetchMatchIds,
  fetchMatchDetail,
  regionToMatchRegion,
  RiotApiError,
} from '@/services/riotApiClient';
import type { RiotRegion } from '@/types/riot';
import {
  globalHistoryToSuggestions,
  pushGlobalSearchHistory,
  readGlobalSearchHistory,
} from '@/utils/searchHistoryStorage';
import { SupabaseError } from '@/services/supabaseService';
import { HomeDashboard } from '@/pages/HomeDashboard';
import { TeamBuilder } from '@/pages/TeamBuilder';
import { CompCard } from '@/components/CompCard';
import { MatchHistory } from '@/pages/MatchHistory';
import { UnitGuide } from '@/pages/UnitGuide';
import { SynergyGuide } from '@/pages/SynergyGuide';
import { ItemsGuide } from '@/pages/ItemsGuide';
import { AugmentGuide } from '@/pages/AugmentGuide';
import { Settings } from '@/pages/Settings';
import { DataErrorBoundary } from '@/components/DataErrorBoundary';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ToastHost } from '@/components/ToastHost';
import { AllySpinner } from '@/components/AllyLoading';
import { SearchInputWithSuggestions } from '@/components/SearchInputWithSuggestions';
import { useTypewriterPlaceholder } from '@/hooks/useTypewriterPlaceholder';
import { BUNDLED_SET_DATA, getSetData } from '@/services/cdnDataService';
import { CURRENT_TFT_SET_NUMBER } from '@/meta/tftCurrentSet';
import { invalidateSearchCorpus } from '@/utils/searchSuggestions';
import { ITEM_RECIPES } from '@/data/itemRecipes';
import { EXAMPLE_SUMMONERS } from '@/data/exampleSummoners';
import type { SearchSuggestion } from '@/utils/searchSuggestions';

import { META_COMPS } from '@/data/metaComps';
import { getPersonalMatches } from '@/services/indexedDbService';

function getCurrentWindowId(): Promise<string> {
  return new Promise((resolve) => {
    overwolf.windows.getCurrentWindow((r: any) => {
      if (r.status === 'success') resolve(r.window.id);
    });
  });
}

const NAV_TABS = [
  {
    id: 'home',
    label: 'Home',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    id: 'in-game',
    label: 'In Game',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <line x1="6" y1="12" x2="10" y2="12" />
        <line x1="8" y1="10" x2="8" y2="14" />
        <line x1="15" y1="13" x2="15.01" y2="13" />
        <line x1="18" y1="11" x2="18.01" y2="11" />
        <rect x="2" y="6" width="20" height="12" rx="2" />
      </svg>
    ),
  },
  {
    id: 'comps',
    label: 'Comps',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    id: 'items',
    label: 'Items',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M14.5 17.5L3 6V3h3l11.5 11.5" />
        <path d="M13 19l6-6" />
        <path d="M16 16l4 4" />
        <path d="M19 21l2-2" />
      </svg>
    ),
  },
  {
    id: 'units',
    label: 'Units',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    id: 'traits',
    label: 'Traits',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
  {
    id: 'augments',
    label: 'Augments',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
  },
  {
    id: 'team-builder',
    label: 'Team Builder',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <line x1="3" y1="9" x2="21" y2="9" />
        <line x1="9" y1="21" x2="9" y2="9" />
      </svg>
    ),
  },
  {
    id: 'match-history',
    label: 'Match History',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
];

/* ─── Quick Tips Component ─── */
function QuickTips() {
  const [currentTip, setCurrentTip] = useState(0)
  const [fadeState, setFadeState] = useState<'in' | 'out'>('in')

  const TIPS = [
    "Position your units to maximize trait synergies",
    "Reroll at level 5 for 1-2 cost carries, level 7 for 3 costs",
    "Save gold early to hit interest thresholds (10/20/30/40/50)",
    "Losing streaks give bonus gold — don't panic sell",
    "Position your tank in front of your backline carry",
    "Check opponent boards each round to predict their comp",
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setFadeState('out')
      setTimeout(() => {
        setCurrentTip((prev) => (prev + 1) % TIPS.length)
        setFadeState('in')
      }, 300)
    }, 8000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div
      className={`text-caption text-ally-muted leading-tight min-h-[42px] flex items-center transition-opacity duration-300 ${fadeState === 'in' ? 'opacity-100' : 'opacity-0'}`}
    >
      {TIPS[currentTip]}
    </div>
  )
}

function displayNameFromSpectatorParticipant(p: Record<string, unknown>): string {
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

function riotLookupFromParticipant(p: Record<string, unknown>): string | null {
  const gn = p.riotIdGameName
  const tl = p.riotIdTagLine
  if (typeof gn === 'string' && gn.length > 0 && typeof tl === 'string' && tl.length > 0) {
    return `${gn}#${tl}`
  }
  if (typeof p.riotId === 'string' && p.riotId.includes('#')) return p.riotId
  return null
}

const getPlacementColor = (place: number) => {
  if (place === 1) return '#fbbf24'
  if (place <= 4) return '#4ade80'
  return '#ef4444'
}

function parseSpectatorGameLengthSeconds(active: Record<string, unknown>): number {
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

function formatInGameError(err: unknown): string {
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

/* ─── In Game Page ─── */
function InGamePage() {
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


  const formatGameLength = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const getGameMode = (queueId: number) => {
    const modes: Record<number, string> = {
      1090: 'Normal',
      1100: 'Ranked',
      1130: 'Hyper Roll',
      1160: 'Double Up',
    }
    return modes[queueId] || 'Unknown'
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
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '200px',
            color: '#a1a1a1',
            fontSize: '14px',
            textAlign: 'center',
            padding: '16px 12px',
          }}
        >
          Not currently in a TFT game
        </div>
      ) : hasSearched && error ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '120px',
            color: '#a1a1a1',
            fontSize: '13px',
            textAlign: 'center',
            padding: '16px 12px',
          }}
        >
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

export function DesktopApp() {
  const state = useAppStore((s: any) => s.gameState);
  const gameData = useAppStore((s) => s.gameData);
  const accentColor = useAppStore((s: any) => s.settings.accentColor) ?? '#35c3e7';
  const settingsRegion = useAppStore((s: any) => s.settings.region as string | undefined);
  const setStoreSettings = useAppStore((s: any) => s.setSettings);
  const lastRawRef = useRef<string>('');
  const [activePage, setActivePage] = useState<string>('home');
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedTraitId, setSelectedTraitId] = useState<string | null>(null);
  const [selectedAugmentId, setSelectedAugmentId] = useState<string | null>(null);
  const [headerSearch, setHeaderSearch] = useState('');
  const [globalSearchHistTick, setGlobalSearchHistTick] = useState(0);
  const headerSearchInputRef = useRef<HTMLInputElement>(null);
  const [matchHistorySummonerPrefill, setMatchHistorySummonerPrefill] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [serverStatus, setServerStatus] = useState<'online'|'issues'|'offline'|'unknown'|'error'>('unknown');

  // Unit Guide filters
  const [unitQuery, setUnitQuery] = useState('');
  const [unitCostFilter, setUnitCostFilter] = useState<number | 'all'>('all');
  const [unitTierFilter, setUnitTierFilter] = useState('all');

  // Synergy Guide filters
  const [synergyQuery, setSynergyQuery] = useState('');
  const [synergyTypeFilter, setSynergyTypeFilter] = useState('all');

  // Items Guide filters
  const [itemQuery, setItemQuery] = useState('');
  const [itemCategoryFilter, setItemCategoryFilter] = useState<'all' | 'core' | 'emblem' | 'psionic' | 'artifact' | 'divine' | 'anima'>('all');
  const [itemTagFilter, setItemTagFilter] = useState('all');
  const [itemTierFilter, setItemTierFilter] = useState('all');

  // Augment Guide filters
  const [augmentQuery, setAugmentQuery] = useState('');
  const [augmentTierFilter, setAugmentTierFilter] = useState('all');
  const [augmentTagFilter, setAugmentTagFilter] = useState('all');
  const sortedMetaComps = useMemo(() => {
    return META_COMPS.map((comp, index) => {
      const tier = index < 2 ? 'S' : index < 6 ? 'A' : index < 8 ? 'B' : index < 9 ? 'C' : 'D';
      return {
        ...comp,
        tier,
        winRate: Math.round(50 + Math.random() * 20),
        top4Rate: Math.round(40 + Math.random() * 20),
        pickRate: Math.round(5 + Math.random() * 15),
        avgPlace: Math.round(1 + Math.random() * 9),
      };
    });
  }, []);

  const headerTypewriterWords = useMemo(() => {
    const items = Object.keys(ITEM_RECIPES)
    const summoners = [...EXAMPLE_SUMMONERS]
    const out: string[] = []
    const champs = gameData.champions
    const augList = gameData.augments
    const rounds = Math.max(
      items.length,
      champs.length > 0 ? champs.length : BUNDLED_SET_DATA.champions.length,
      augList.length > 0 ? augList.length : BUNDLED_SET_DATA.augments.length,
      summoners.length,
    )
    for (let i = 0; i < rounds; i++) {
      out.push(items[i % items.length])
      const roster = champs.length > 0 ? champs : BUNDLED_SET_DATA.champions
      const augs = augList.length > 0 ? augList : BUNDLED_SET_DATA.augments
      out.push(roster[i % roster.length].name)
      out.push(augs[i % augs.length].name)
      out.push(summoners[i % summoners.length])
    }
    return out
  }, [gameData.champions, gameData.augments])

  const { placeholderAnimated: headerPlaceholderAnimated } = useTypewriterPlaceholder(
    headerTypewriterWords,
    headerSearch.length > 0,
  )

  const globalSearchPrepend = useMemo(
    () => globalHistoryToSuggestions(readGlobalSearchHistory()),
    [globalSearchHistTick],
  )

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && settingsOpen) {
        setSettingsOpen(false);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        const t = e.target as HTMLElement | null;
        if (t?.closest?.('[data-no-global-search-focus="true"]')) return;
        e.preventDefault();
        headerSearchInputRef.current?.focus();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [settingsOpen]);

  const clearMatchHistorySummonerPrefill = useCallback(() => {
    setMatchHistorySummonerPrefill(null)
  }, [])

  function handleGlobalSearchPick(s: SearchSuggestion) {
    const region = settingsRegion as RiotRegion | undefined;
    pushGlobalSearchHistory(
      s.kind === 'summoner'
        ? { ...s, region: s.region ?? region ?? 'euw1' }
        : s,
    );
    setGlobalSearchHistTick((n) => n + 1);
    if (s.kind === 'summoner' && s.region) {
      setStoreSettings({ region: s.region });
    }
    setSelectedUnitId(null)
    setSelectedItemId(null)
    setSelectedTraitId(null)
    setSelectedAugmentId(null)
    switch (s.kind) {
      case 'unit': {
        setActivePage('units')
        const roster = gameData.champions.length > 0 ? gameData.champions : BUNDLED_SET_DATA.champions
        const u = roster.find((x) => x.name === s.label)
        setSelectedUnitId(u ? u.name : s.label)
        setUnitQuery(s.label)
        break
      }
      case 'item':
        setActivePage('items')
        setItemQuery(s.label)
        setSelectedItemId(s.label)
        break
      case 'trait':
        setActivePage('traits')
        setSynergyQuery(s.label)
        setSelectedTraitId(s.label)
        break
      case 'augment':
        setActivePage('augments')
        setAugmentQuery(s.label)
        setSelectedAugmentId(s.label)
        break
      case 'summoner':
        setActivePage('match-history')
        setMatchHistorySummonerPrefill(s.label)
        break
    }
    setHeaderSearch('')
  }

  useEffect(() => {
    return subscribeToStateSnapshots();
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadGameData() {
      const { setGameData, setGameDataLoading } = useAppStore.getState();
      setGameDataLoading(true);
      try {
        const { data, source } = await getSetData();
        if (cancelled) return;
        setGameData(data, source);
      } catch (err) {
        if (cancelled) return;
        console.warn('[APP] CDN failed, using bundled data:', err);
        setGameData(
          {
            setNumber: CURRENT_TFT_SET_NUMBER,
            champions: BUNDLED_SET_DATA.champions,
            traits: BUNDLED_SET_DATA.traits,
            items: BUNDLED_SET_DATA.items,
            augments: BUNDLED_SET_DATA.augments,
          },
          'bundled',
        );
      } finally {
        if (!cancelled) {
          invalidateSearchCorpus();
          useAppStore.getState().setGameDataLoading(false);
        }
      }
    }
    void loadGameData();
    return () => {
      cancelled = true;
    };
  }, []);

  const setPersonalMatches = useAppStore((s) => s.setPersonalMatches);
  useEffect(() => {
    let cancelled = false;
    void getPersonalMatches(80).then((rows) => {
      if (!cancelled) setPersonalMatches(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [setPersonalMatches]);

  useEffect(() => {
    let cancelled = false
    const region = settingsRegion ?? 'euw1'
    setServerStatus('unknown')
    getServerStatus(region as any)
      .then((data) => {
        if (cancelled) return
        if (!data) {
          setServerStatus('unknown')
          return
        }
        const hasIssues = (data as any).incidents?.length > 0 || (data as any).maintenances?.length > 0
        setServerStatus(hasIssues ? 'issues' : 'online')
      })
      .catch(() => {
        if (!cancelled) setServerStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [settingsRegion])

  async function handleMinimize() {
    overwolf.windows.minimize(await getCurrentWindowId(), () => {});
  }
  async function handleClose() {
    overwolf.windows.close(await getCurrentWindowId(), () => {});
  }

  async function handleMaximize() {
    overwolf.windows.maximize(await getCurrentWindowId(), () => {});
  }

  const rawJson = state
    ? JSON.stringify(state.raw, null, 2)
    : 'Waiting for data...';
  if (rawJson !== lastRawRef.current) lastRawRef.current = rawJson;

  if (gameData.isLoading) {
    return (
      <ThemeProvider>
        <div className="flex h-screen w-full flex-col items-center justify-center bg-ally-bg font-sans text-ally-text">
          <AllySpinner />
          <p className="mt-4 text-sm text-ally-muted">Loading game data…</p>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <style>{`
        html { scroll-behavior: smooth; }

        .custom-scrollbar {
          direction: ltr;
          scrollbar-gutter: stable;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #0e0e0e;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #2a2a2a;
          border-radius: 4px;
          border: 1px solid #1a1a1a;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #35c3e7;
        }
        .filter-sidebar-enter {
          animation: slideInLeft 250ms cubic-bezier(0.25, 1, 0.5, 1);
        }
        .smooth-scroll { scroll-behavior: smooth; }
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <DataErrorBoundary>
      <div className="w-full h-full flex flex-col bg-[#0d0d0d] text-white font-sans smooth-scroll" style={{ '--color-ally-accent': accentColor } as React.CSSProperties}>
      {/* Top Bar */}
      <div
        className="h-12 bg-[#1f1f1f] flex items-center px-4 flex-shrink-0 relative z-20 overflow-visible"
        style={{ WebkitAppRegion: 'drag', boxShadow: 'inset 0 -1px 2px rgba(0,0,0,0.3)' } as Record<string, string>}
      >
        {/* Left: ALLY Logo */}
        <div className="absolute" style={{ left: '19px', WebkitAppRegion: 'no-drag' } as Record<string, string>}>
          <svg viewBox="0 0 70 70" fill="none" className="h-5 w-auto">
            <path d="M35 0L67 62.5H49.5L37 30L17 62.5H2" stroke="#35c3e7" strokeWidth="8" strokeLinejoin="round" strokeLinecap="round" />
            <line x1="12" y1="43.75" x2="49.5" y2="43.75" stroke="#35c3e7" strokeWidth="7" />
          </svg>
        </div>

        {/* Center: Search Bar */}
        <div className="flex-1 flex justify-center overflow-visible relative z-30" style={{ WebkitAppRegion: 'no-drag' } as Record<string, string>}>
          <SearchInputWithSuggestions
            value={headerSearch}
            onChange={setHeaderSearch}
            placeholder={headerPlaceholderAnimated || 'Search… (Ctrl+K)'}
            kinds="all"
            maxSuggestions={10}
            prependWhenEmpty
            prependSuggestions={globalSearchPrepend}
            onSuggestionPick={handleGlobalSearchPick}
            listZIndex={200}
            wrapperClassName="w-64"
            inputRef={headerSearchInputRef}
            inputClassName="bg-[#1a1a1a] border-none rounded-lg px-3 py-1.5 text-[13px] text-white placeholder:text-[#555] outline-none w-full transition-colors focus-visible:ring-2 focus-visible:ring-[#35c3e7]"
            inputStyle={{ boxShadow: 'inset 1px 1px 2px rgba(0,0,0,0.5), inset -1px -1px 2px rgba(255,255,255,0.05)' }}
          />
        </div>

        {/* Right: Icons + Window Controls */}
        <div className="ml-auto flex items-center gap-1" style={{ WebkitAppRegion: 'no-drag' } as Record<string, string>}>
          {/* Discord */}
          <button className="w-8 h-8 rounded-lg flex items-center justify-center text-white hover:bg-[#1a1a1a] hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-[#35c3e7] transition-all duration-200">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.878.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.927 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.878.076.076 0 0 0-.04.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.069-2.157-2.38 0-1.312.956-2.38 2.157-2.38 1.21 0 2.176 1.068 2.157 2.38 0 1.312-.956 2.38-2.157 2.38zm7.975 0c-1.183 0-2.157-1.069-2.157-2.38 0-1.312.955-2.38 2.157-2.38 1.21 0 2.176 1.068 2.157 2.38 0 1.312-.946 2.38-2.157 2.38z"/>
            </svg>
          </button>

          {/* Notifications */}
          <button className="w-8 h-8 rounded-lg flex items-center justify-center text-white hover:bg-[#1a1a1a] hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-[#35c3e7] transition-all duration-200">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
          </button>

          {/* Settings */}
          <div className="relative">
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
className="w-8 h-8 rounded-lg flex items-center justify-center text-white hover:bg-[#1a1a1a] hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-[#35c3e7] transition-all duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>

            {/* Settings Dropdown */}
            {settingsOpen && (
              <div className="ally-dropdown-surface absolute right-0 top-10 z-50 w-56 rounded-lg bg-[#1a1a1a] p-4" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.5), inset 1px 1px 2px rgba(255,255,255,0.03), inset -1px -1px 2px rgba(0,0,0,0.3)' }}>
                <div className="text-white text-sm">Settings</div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="w-px h-5 bg-[#1a1a1a] mx-1" />

          {/* Window Controls */}
          <button onClick={handleMinimize} className="w-8 h-8 rounded-lg flex items-center justify-center text-white hover:bg-[#1a1a1a] hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-[#35c3e7] transition-all duration-200">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
          <button onClick={handleMaximize} className="w-8 h-8 rounded-lg flex items-center justify-center text-white hover:bg-[#1a1a1a] hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-[#35c3e7] transition-all duration-200">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            </svg>
          </button>
          <button onClick={handleClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-white hover:bg-red-500/20 hover:text-red-400 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Icon Sidebar */}
        <div className="w-14 bg-[#1f1f1f] flex flex-col items-center py-3 gap-1 flex-shrink-0" style={{ boxShadow: 'inset -1px 0 2px rgba(0,0,0,0.3)' }}>
          {NAV_TABS.map((tab) => (
            <div key={tab.id} className="relative group">
              <button
                onClick={() => {
                  setActivePage(tab.id)
                  setSelectedUnitId(null)
                  setSelectedItemId(null)
                  setSelectedTraitId(null)
                  setSelectedAugmentId(null)
                }}
                className={`ally-transition-filter w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 ease-out focus-visible:ring-2 focus-visible:ring-ally-accent hover:shadow-lg ${
                  activePage === tab.id
                    ? 'bg-[#1a1a1a] text-ally-accent'
                    : 'text-[#555] hover:bg-[#1a1a1a] hover:text-white hover:scale-105'
                }`}
              >
                {tab.icon}
              </button>
              <div className="absolute left-12 top-1/2 z-50 -translate-y-1/2 rounded-lg bg-[#1a1a1a] px-4 py-2 text-[12px] text-white whitespace-nowrap opacity-0 transition-opacity duration-200 pointer-events-none group-hover:opacity-100" style={{ boxShadow: 'inset 1px 1px 2px rgba(255,255,255,0.05), inset -1px -1px 2px rgba(0,0,0,0.4)' }}>
                {tab.label}
              </div>
            </div>
          ))}
          <div className="flex-1" />
          {/* Settings */}
          <div className="relative group">
            <button
              onClick={() => setActivePage('settings')}
              className={`ally-transition-filter w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 ease-out focus-visible:ring-2 focus-visible:ring-ally-accent hover:shadow-lg ${
                activePage === 'settings'
                  ? 'bg-[#1a1a1a] text-ally-accent'
                  : 'text-[#555] hover:bg-[#1a1a1a] hover:text-white hover:scale-105'
              }`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06-.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </button>
            <div className="absolute left-12 top-1/2 z-50 -translate-y-1/2 rounded-lg bg-[#1a1a1a] px-4 py-2 text-[12px] text-white whitespace-nowrap opacity-0 transition-opacity duration-200 pointer-events-none group-hover:opacity-100" style={{ boxShadow: 'inset 1px 1px 2px rgba(255,255,255,0.05), inset -1px -1px 2px rgba(0,0,0,0.4)' }}>
              Settings
            </div>
          </div>
          {/* Profile */}
          <div className="relative group">
            <button className="w-10 h-10 rounded-lg flex items-center justify-center text-[#555] hover:bg-[#1a1a1a] hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </button>
            <div className="absolute left-12 top-1/2 -translate-y-1/2 bg-[#1a1a1a] text-white text-[12px] px-4 py-2 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50" style={{ boxShadow: 'inset 1px 1px 2px rgba(255,255,255,0.05), inset -1px -1px 2px rgba(0,0,0,0.4)' }}>
              Profile
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div key={activePage} className={`ally-page-surface flex-1 min-h-0 h-full overflow-y-auto bg-[#0d0d0d] custom-scrollbar ${
          ['units','traits','items','augments','team-builder','match-history'].includes(activePage)
            ? ''
            : 'px-8 py-6'
        }`}>
          {activePage === 'home' ? (
            <HomeDashboard onNavigate={setActivePage} />
          ) : activePage === 'in-game' ? (
            <InGamePage />
          ) : activePage === 'comps' ? (
            <div className="flex flex-col gap-2">
              <div className="text-[11px] uppercase tracking-widest text-white mb-4">Meta Comps</div>
              <div className="grid grid-cols-1 gap-3">
                {sortedMetaComps.map((comp) => (
                  <CompCard
                    key={comp.compName}
                    comp={comp}
                  />
                ))}
              </div>
            </div>
          ) : activePage === 'items' ? (
            <ItemsGuide
              query={itemQuery}
              setQuery={setItemQuery}
              categoryFilter={itemCategoryFilter}
              setCategoryFilter={setItemCategoryFilter}
              tagFilter={itemTagFilter}
              setTagFilter={setItemTagFilter}
              tierFilter={itemTierFilter}
              setTierFilter={setItemTierFilter}
              onItemSelect={(itemName) => console.log('Selected item:', itemName)}
              initialItem={selectedItemId}
            />
          ) : activePage === 'team-builder' ? (
            <TeamBuilder onNavigate={(page, id) => {
              setActivePage(page)
              if (page === 'units' && id) setSelectedUnitId(id)
            }} />
          ) : activePage === 'match-history' ? (
            <MatchHistory
              summonerSearchPrefill={matchHistorySummonerPrefill}
              onSummonerSearchPrefillApplied={clearMatchHistorySummonerPrefill}
            />
          ) : activePage === 'units' ? (
            <UnitGuide
              query={unitQuery}
              setQuery={setUnitQuery}
              costFilter={unitCostFilter}
              setCostFilter={setUnitCostFilter}
              tierFilter={unitTierFilter}
              setTierFilter={setUnitTierFilter}
              onUnitSelect={(unitId) => console.log('Selected unit:', unitId)}
              initialUnit={selectedUnitId}
            />
          ) : activePage === 'traits' ? (
            <SynergyGuide
              query={synergyQuery}
              setQuery={setSynergyQuery}
              typeFilter={synergyTypeFilter}
              setTypeFilter={setSynergyTypeFilter}
              onSynergySelect={(synergyId) => console.log('Selected synergy:', synergyId)}
              initialTrait={selectedTraitId}
            />
          ) : activePage === 'augments' ? (
            <AugmentGuide
              query={augmentQuery}
              setQuery={setAugmentQuery}
              tierFilter={augmentTierFilter}
              setTierFilter={setAugmentTierFilter}
              tagFilter={augmentTagFilter}
              setTagFilter={setAugmentTagFilter}
              onAugmentSelect={(augmentId) => console.log('Selected augment:', augmentId)}
              initialAugment={selectedAugmentId}
            />
          ) : activePage === 'settings' ? (
            <Settings />
          ) : (
            <div className="flex items-center justify-center h-full">
              <span className="text-white text-sm capitalize">{activePage.replace('-', ' ')}</span>
            </div>
          )}
        </div>

        {/* Right Sidebar (fixed) - always visible */}
        <div className="w-[180px] bg-ally-bg flex-shrink-0 px-3 py-4 flex flex-col gap-6 items-center overflow-y-auto border-l border-ally-border shadow-inner">
          {/* Player Card Section */}
          <div className="w-full">
            <div className="text-[9px] font-display font-bold uppercase tracking-widest text-ally-muted mb-2">
              Summoner
            </div>
            <div className="bg-ally-card border border-ally-border rounded-lg p-3 shadow-card">
              <div className="text-body font-bold text-ally-accent mb-0.5 font-display uppercase tracking-wide truncate">
                {state.gameName || 'Unknown'}
              </div>
              <div className="text-caption text-ally-muted mb-3 font-medium">
                {state.region?.toUpperCase() || 'NA'}
              </div>
              <div className="flex flex-wrap gap-1 mb-3">
                {[1,2,3,4,5,6,7,8,1,2].map((place, i) => (
                  <div
                    key={i}
                    style={{ background: getPlacementColor(place) }}
                    className={`w-4 h-4 rounded-sm flex items-center justify-center text-[9px] font-bold text-white font-numbers ${place === 1 ? 'ring-1 ring-yellow-400' : ''}`}
                  >
                    {place}
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-ally-border/50">
                <div className="text-caption text-ally-muted font-display uppercase font-semibold">Avg Place</div>
                <div className="text-heading font-bold text-ally-text font-numbers">3.2</div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="w-full h-px bg-ally-border" />

          {/* Server Status */}
          <div className="w-full">
            <div className="text-[9px] font-display font-bold uppercase tracking-widest text-ally-muted mb-2">Platform Status</div>
            <div className="flex items-center gap-2 bg-ally-card/50 border border-ally-border p-2 rounded-md">
              <div className={`w-2 h-2 rounded-full shadow-[0_0_8px] ${
                serverStatus === 'online' ? 'bg-ally-success shadow-ally-success/50' :
                serverStatus === 'issues' ? 'bg-ally-warning shadow-ally-warning/50' :
                serverStatus === 'error' ? 'bg-orange-500 shadow-orange-500/50' :
                'bg-ally-error shadow-ally-error/50'
              }`} />
              <span className={`text-[11px] font-display font-bold uppercase tracking-tight ${
                serverStatus === 'online' ? 'text-ally-success' :
                serverStatus === 'issues' ? 'text-ally-warning' :
                serverStatus === 'error' ? 'text-orange-500' :
                'text-ally-error'
              }`}>
                {serverStatus === 'online' ? 'Operational' :
                 serverStatus === 'issues' ? 'Interrupted' :
                 serverStatus === 'error' ? 'Unknown' : 'Offline'}
              </span>
            </div>
          </div>

          {/* Divider */}
          <div className="w-full h-px bg-ally-border" />

          {/* Quick Tips Section */}
          <div className="w-full">
            <div className="text-[9px] font-display font-bold uppercase tracking-widest text-ally-muted mb-2">
              Tactical Tips
            </div>
            <div className="bg-ally-card/30 border border-ally-border/50 rounded-lg p-2">
              <QuickTips />
            </div>
          </div>
        </div>
      </div>
      </div>
      <ToastHost />
      </DataErrorBoundary>
    </ThemeProvider>
  );
}