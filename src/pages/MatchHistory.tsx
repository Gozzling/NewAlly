import { useState, useEffect, useMemo, useRef } from 'react'
import { useAppStore } from '@/store/useAppStore'
import {
  fetchPlayerMatchHistory,
  getCachedMatchHistory,
  hasCachedMatchHistory,
  isOnline,
  getUserFriendlyErrorMessage,
  getErrorActionText,
  isRetryableError,
} from '@/services/matchHistoryService'
import { fetchPlayerCard } from '@/services/riotApiClient'
import type { RiotRegion } from '@/types/riot'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
  Area,
} from 'recharts'
import type { Match } from '@/types/riot'

const REGIONS: { label: string; value: RiotRegion }[] = [
  { label: 'NA',  value: 'na1' },
  { label: 'EUW', value: 'euw1' },
  { label: 'EUNE', value: 'eun1' },
  { label: 'KR',  value: 'kr'  },
  { label: 'BR',  value: 'br1' },
  { label: 'JP',  value: 'jp1' },
]

/* ─── Design tokens ─── */
const C = {
  bg:         '#0d0d0d',
  surface:    '#1f1f1f',
  border:     '#1a1a1a',
  accent:     '#00d4ff',
  accentDim:  'rgba(0,212,255,0.12)',
  win:        '#34d399',
  winDim:     'rgba(52,211,153,0.12)',
  loss:       '#ef4444',
  lossDim:    'rgba(239,68,68,0.12)',
  text:       '#ffffff',
  muted:      '#a1a1a1',
  faint:      '#484848',
  chartGreen: '#34d399',
  chartRed:   '#ef4444',
  chartCyan:  '#00d4ff',
}

/* ─── Helpers ─── */
// APPROXIMATE LP DELTA TABLE
// This is a hardcoded approximation of TFT ranked LP changes.
// The Riot API does not return actual LP gain/loss in match details.
// Real LP tracking would require:
// 1) Listening to Overwolf live events during ranked games, OR
// 2) Querying the TFT League API before/after each match to compute delta
// Until then, this table provides a reasonable estimate based on placement.
function placementDelta(placement: number): number {
  switch (placement) {
    case 1: return  100; case 2: return  80; case 3: return  64; case 4: return  50;
    case 5: return -25; case 6: return -50; case 7: return -75; case 8: return -95
    default: return 0
  }
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

// Unit icon URL helper
const unitIconUrl = (name: string) => `/unit-icons/${name}.webp`

function formatTimeAgo(isoStr: string): string {
  const diff = Date.now() - new Date(isoStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function placementColor(p: number): string {
  return p <= 4 ? C.chartGreen : C.chartRed
}

/* ─── Row data shape ─── */
interface MatchRowData {
  matchId: string; placement: number; result: 'win' | 'loss'
  lpChange: number; date: string; duration: number
  rank: string; tier: string; players: number
  comp: string | null; traits: string[]; lpAtEnd: number
  level: number; augments: string[]; gameType: string
  units: string[]
}

/* ─── Build row from Match ─── */
function buildRow(m: Match, lpAtEnd: number): MatchRowData {
  // Use real LP change if available, otherwise fall back to approximation
  const lpChange = m.lpChange ?? placementDelta(m.placement)
  return {
    matchId:   m.matchId,
    placement: m.placement,
    result:    m.placement <= 4 ? 'win' : 'loss',
    lpChange,
    date:      m.date instanceof Date ? m.date.toISOString() : String(m.date),
    duration:  Math.round(m.gameLength),
    rank:      '',
    tier:      '',
    players:   8,
    comp:      m.comp ?? null,
    traits:    m.traits ?? [],
    lpAtEnd,
    level:     m.level,
    augments:  m.augments ?? [],
    gameType: m.gameType ?? 'standard',
    units:     m.units ?? [],
  }
}

/* ─── Liquid LP dot with soft glow ─── */
function LiquidLPDot(props: { cx?: number; cy?: number; payload?: MatchRowData }) {
  const { cx, cy, payload } = props
  if (!cx || !cy || !payload) return null
  const fill = payload.result === 'loss' ? C.chartRed : C.chartGreen
  const glowColor = payload.result === 'loss' ? 'rgba(239,68,68,0.3)' : 'rgba(52,211,153,0.3)'
  return (
    <g>
      <circle cx={cx} cy={cy} r={8} fill={glowColor} opacity={0.5}>
        <animate attributeName="r" values="6;8;6" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.5;0.2;0.5" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx={cx} cy={cy} r={4} fill={fill} stroke={C.surface} strokeWidth={2} />
    </g>
  )
}

/* ─── Chart tooltip ─── */
function ChartTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: MatchRowData }> }) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null
  const date = new Date(d.date)
  const dateLabel = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: 8, padding: '8px 12px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
      fontSize: 12, fontFamily: 'Rajdhani, sans-serif',
    }}>
      <div style={{ color: C.muted, marginBottom: 3 }}>
        {dateLabel} · #{d.placement} · {d.comp ?? d.traits.slice(0, 3).join(' · ')}
      </div>
      <div style={{
        color: d.result === 'loss' ? C.loss : C.win,
        fontWeight: 800, fontSize: 15,
      }}>
        {d.result === 'loss' ? d.lpChange : `+${d.lpChange}`} LP
      </div>
      <div style={{ color: placementColor(d.placement), fontSize: 10, marginTop: 2 }}>
        {d.placement <= 4 ? 'Top 4' : 'Bottom 4'}
      </div>
    </div>
  )
}

/* ─── Error Display Component ─── */
function ErrorDisplay({ error, onRetry, onLoadCached, isRetrying }: {
  error: ErrorState
  onRetry: () => void
  onLoadCached: () => void
  isRetrying: boolean
}) {
  if (!error) return null

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
      gap: 16,
    }}>
      {/* Error Icon */}
      <div style={{
        width: 64,
        height: 64,
        borderRadius: '50%',
        background: 'rgba(239,68,68,0.1)',
        border: '2px solid rgba(239,68,68,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <svg viewBox="0 0 24 24" fill="none" stroke={C.loss} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width: 32, height: 32 }}>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>

      {/* Error Message */}
      <div style={{
        textAlign: 'center',
        maxWidth: 400,
      }}>
        <div style={{
          color: C.text,
          fontFamily: 'Rajdhani, sans-serif',
          fontSize: 16,
          fontWeight: 700,
          marginBottom: 8,
        }}>
          {error.isOffline && 'You appear to be offline'}
          {!error.isOffline && 'Unable to load match history'}
        </div>
        <div style={{
          color: C.muted,
          fontFamily: 'Rajdhani, sans-serif',
          fontSize: 13,
          marginBottom: 4,
        }}>
          {error.message}
        </div>
        <div style={{
          color: C.faint,
          fontFamily: 'Rajdhani, sans-serif',
          fontSize: 11,
        }}>
          {error.action}
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        {error.retryable && (
          <button
            onClick={onRetry}
            disabled={isRetrying}
            style={{
              padding: '8px 20px',
              borderRadius: 6,
              background: C.accent,
              border: 'none',
              color: '#000',
              fontSize: 13,
              fontFamily: 'Rajdhani, sans-serif',
              fontWeight: 700,
              cursor: isRetrying ? 'not-allowed' : 'pointer',
              opacity: isRetrying ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            {isRetrying ? (
              <>
                <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid #000', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                Retrying...
              </>
            ) : (
              'Try Again'
            )}
          </button>
        )}

        {error.hasCachedData && (
          <button
            onClick={onLoadCached}
            style={{
              padding: '8px 20px',
              borderRadius: 6,
              background: 'transparent',
              border: `1px solid ${C.border}`,
              color: C.muted,
              fontSize: 13,
              fontFamily: 'Rajdhani, sans-serif',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.muted; e.currentTarget.style.color = C.text }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted }}
          >
            View Cached Data
          </button>
        )}
      </div>

      {/* Offline Indicator */}
      {error.isOffline && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 12px',
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 4,
          marginTop: 8,
        }}>
          <div style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: C.loss,
            animation: 'pulse 2s infinite',
          }} />
          <span style={{
            color: C.loss,
            fontFamily: 'Rajdhani, sans-serif',
            fontSize: 11,
            fontWeight: 600,
          }}>
            Offline Mode
          </span>
        </div>
      )}
    </div>
  )
}

/* ─── Empty State Component ─── */
function EmptyState({ message }: { message: string }) {
  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
      gap: 16,
    }}>
      <div style={{
        width: 64,
        height: 64,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.05)',
        border: '2px solid rgba(255,255,255,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <svg viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width: 32, height: 32 }}>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      </div>
      <div style={{
        color: C.muted,
        fontFamily: 'Rajdhani, sans-serif',
        fontSize: 14,
        textAlign: 'center',
      }}>
        {message}
      </div>
    </div>
  )
}
function RowSkeleton() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      padding: '16px',
    }}>
      {[1,2,3,4,5].map(i => (
        <div
          key={i}
          style={{
            height: '80px',
            borderRadius: '8px',
            background: 'linear-gradient(90deg, #111827 25%, #1f2937 50%, #111827 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
          }}
        />
      ))}
    </div>
  )
}

/* ─── Match row ─── */
function MatchRow({ match, index }: { match: MatchRowData; index: number }) {
  const isNonStandard = match.gameType !== 'standard'
  const gameTypeLabel = match.gameType === 'doubleup' ? 'Double Up' : match.gameType

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '32px 1fr 70px 70px 90px',
        gap: 10, alignItems: 'center',
        padding: '7px 12px',
        borderBottom: `1px solid ${C.border}`,
        borderLeft: `3px solid ${
          match.placement === 1 ? '#f59e0b'
          : match.placement <= 4 ? '#34d399'
          : '#ef4444'
        }`,
        transition: 'background 0.1s',
        animation: `fadeSlideUp 0.3s ease-out ${0.1 + index * 0.03}s both`,
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
    >
      {/* Placement */}
      <div style={{
        width: 28, height: 28, borderRadius: 6,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Rajdhani, sans-serif', fontSize: 12, fontWeight: 800,
        color:  match.placement === 1 ? '#f59e0b'
           : match.placement <= 4 ? C.chartGreen
           : C.chartRed,
        background: match.placement === 1 ? 'rgba(245,158,11,0.1)'
           : match.placement <= 4 ? C.winDim
           : C.lossDim,
        border: `1px solid ${
          match.placement === 1 ? 'rgba(245,158,11,0.3)'
          : match.placement <= 4 ? 'rgba(52,211,153,0.3)'
          : 'rgba(239,68,68,0.2)'
        }`,
        transition: 'transform 0.15s ease',
        cursor: 'pointer',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.15)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
      >
        <span>{match.placement}</span>
        <span style={{ fontSize: 8, fontWeight: 600, opacity: 0.7 }}>Lv.{match.level}</span>
      </div>

      {/* Meta */}
      <div>
        <div style={{ fontSize: 10, color: C.muted, marginBottom: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>{formatTimeAgo(match.date)} · {formatDuration(match.duration)}</span>
          {isNonStandard && (
            <span style={{
              padding: '1px 5px', borderRadius: 3,
              background: 'rgba(0,212,255,0.15)', border: '1px solid rgba(0,212,255,0.3)',
              color: C.accent, fontSize: 8, fontWeight: 700, letterSpacing: '0.05em',
            }}>
              {gameTypeLabel}
            </span>
          )}
        </div>
        {match.augments.length > 0 && (
          <div style={{
            display: 'flex', gap: 4, marginTop: 2,
            overflow: 'hidden', flexWrap: 'nowrap',
          }}>
            {match.augments.slice(0, 3).map((aug, i) => (
              <span
                key={i}
                style={{
                  padding: '1px 5px', borderRadius: 3,
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  color: C.muted, fontSize: 8, fontWeight: 600,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  fontFamily: 'Rajdhani, sans-serif',
                }}
              >
                {aug}
              </span>
            ))}
            {match.augments.length > 3 && (
              <span style={{ fontSize: 8, color: C.faint }}>+{match.augments.length - 3}</span>
            )}
          </div>
        )}
        {match.traits.length > 0 && (
          <div style={{display:'flex', gap:'3px', flexWrap:'wrap', marginTop:'4px'}}>
            {match.traits.slice(0, 4).map(trait => {
              const clean = trait.replace(/^TFT\d+_/, '').replace(/([A-Z])/g, ' $1').trim()
              return (
                <div key={trait} title={clean} style={{
                  display:'flex', alignItems:'center', gap:'3px',
                  padding:'2px 6px', borderRadius:'4px',
                  background:'#1a1a2e', border:'1px solid #2a2a50',
                  fontSize:'10px', color:'#aaa'
                }}>
                  {clean}
                </div>
              )
            })}
          </div>
        )}
        {match.units.length > 0 && (
          <div style={{display:'flex', gap:'3px', flexWrap:'wrap', marginTop:'6px'}}>
            {match.units.slice(0, 8).map(name => (
              <div key={name} style={{position:'relative'}}>
                <img
                  src={unitIconUrl(name)}
                  alt={name}
                  title={name}
                  style={{
                    width:'32px', height:'32px',
                    borderRadius:'6px',
                    objectFit:'cover',
                    border:'1px solid #2a2a2a',
                    display:'block'
                  }}
                  onError={(e) => { e.currentTarget.style.display='none' }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* LP delta */}
      <div style={{
        fontFamily: 'Rajdhani, sans-serif', fontSize: 15, fontWeight: 900,
        color: match.result === 'loss' ? C.loss : C.win, textAlign: 'center',
        letterSpacing: '-0.01em',
      }}>
        {match.result === 'loss' ? `${match.lpChange}` : `+${match.lpChange}`}
      </div>

      {/* Cumulative LP */}
      <div style={{
        fontFamily: 'Rajdhani, sans-serif', fontSize: 11,
        color: C.muted, textAlign: 'right',
      }}>
        {match.lpAtEnd} LP
      </div>

      {/* Result text */}
      <div style={{
        textAlign: 'center',
        fontFamily: 'Rajdhani, sans-serif',
        fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
        color: match.result === 'win' ? C.win : C.loss,
      }}>
        {match.result === 'win' ? 'TOP 4' : 'BOT 4'}
      </div>
    </div>
  )
}

/* ─── Infinite scroll sentinel ─── */
function useScrollSentinel(ref: React.RefObject<HTMLDivElement | null>, onIntersect: () => void) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) onIntersect() },
      { threshold: 0.1 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [ref, onIntersect])
}

/* ─── Error State Types ─── */
type ErrorState = {
  message: string
  action: string
  retryable: boolean
  isOffline: boolean
  hasCachedData: boolean
} | null

/* ═══════════════════════════════════════════════════════════════
   MatchHistory
═══════════════════════════════════════════════════════════════ */
export function MatchHistory() {
  const selectedPlayer = useAppStore(s => s.selectedPlayer)
  const storeRegion     = useAppStore(s => s.settings.region)
  const setSelectedPlayer = useAppStore(s => s.setSelectedPlayer)

  const [matches, setMatches]       = useState<MatchRowData[]>([])
  const [loading, setLoading]         = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError]             = useState<ErrorState>(null)
  const [hasMore, setHasMore]          = useState(true)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const [searchQuery, setSearchQuery]    = useState('')
  const [searchRegion, setSearchRegion]  = useState<RiotRegion>(storeRegion)
  const [searching, setSearching]        = useState(false)
  const [searchErr, setSearchErr]        = useState<string | null>(null)
  const [isRetrying, setIsRetrying]      = useState(false)
  const [isShowingCached, setIsShowingCached] = useState(false)

  useEffect(() => { setSearchRegion(storeRegion) }, [storeRegion])

  /* ─── Search ─── */
  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!searchQuery.trim()) return
    setSearching(true); setSearchErr(null)
    console.log('[MH] handleSearch called:', { searchQuery: searchQuery.trim(), searchRegion })
    try {
      const card = await fetchPlayerCard(searchQuery.trim(), searchRegion)
      console.log('[DEBUG] playerCard:', JSON.stringify(card))
      console.log('[MH] fetchPlayerCard returned:', card)
      setSelectedPlayer(card)
    } catch (err) {
      console.error('[MH] handleSearch error:', err)
      setSearchErr(err instanceof Error ? err.message : 'Player not found')
    } finally {
      setSearching(false)
    }
  }

  const LIMIT = 30

  /* ─── Error Handler ─── */
  function handleError(err: unknown): ErrorState {
    const error = err instanceof Error ? err : new Error(String(err))
    const message = getUserFriendlyErrorMessage(error)
    const action = getErrorActionText(error)
    const retryable = isRetryableError(error)
    const isOffline = !isOnline()
    const hasCachedData = selectedPlayer?.puuid
      ? hasCachedMatchHistory(selectedPlayer.puuid, storeRegion)
      : false

    return {
      message,
      action,
      retryable,
      isOffline,
      hasCachedData,
    }
  }

  /* ─── Retry Handler ─── */
  async function handleRetry() {
    if (!selectedPlayer?.puuid) return

    setIsRetrying(true)
    setError(null)

    try {
      await initialLoad()
    } catch (err) {
      setError(handleError(err))
    } finally {
      setIsRetrying(false)
    }
  }

  /* ─── Load Cached Data ─── */
  function loadCachedData() {
    if (!selectedPlayer?.puuid) return

    const cached = getCachedMatchHistory(selectedPlayer.puuid, storeRegion, LIMIT, 0)

    if (cached && cached.length > 0) {
      const startLp = (selectedPlayer.lp ?? 0) as number
      const oldestFirst = [...cached].reverse()
      let running = startLp - oldestFirst.reduce((s, m) => s + (m.lpChange ?? placementDelta(m.placement)), 0)
      const computedRows: MatchRowData[] = oldestFirst.map(m => {
        running += (m.lpChange ?? placementDelta(m.placement))
        return { ...buildRow(m, running), rank: selectedPlayer?.rank ?? '', tier: selectedPlayer?.tier ?? '' }
      })
      setMatches(computedRows)
      setHasMore(false) // Can't load more from cache
      setError(null)
      setIsShowingCached(true)
    } else {
      setError({
        message: 'No cached data available',
        action: 'Please connect to the internet to load match history',
        retryable: true,
        isOffline: true,
        hasCachedData: false,
      })
    }
  }

  /* ─── Initial load ─── */
  async function initialLoad() {
    if (!selectedPlayer?.puuid) { setLoading(false); return }
    setLoading(true); setError(null)
    try {
      const history = await fetchPlayerMatchHistory(
        selectedPlayer.puuid,
        storeRegion,
        LIMIT,
        0,
        () => {}, // no-op log function
        { forceRefresh: false, offlineMode: false }
      )
      const startLp    = (selectedPlayer.lp ?? 0) as number
      // Reverse to get oldest → newest order
      const oldestFirst = [...history].reverse()
      // Initial LP before the oldest match in this page
      // Use real lpChange if available, otherwise fall back to approximation
      let running = startLp - oldestFirst.reduce((s, m) => s + (m.lpChange ?? placementDelta(m.placement)), 0)
      const computedRows: MatchRowData[] = oldestFirst.map(m => {
        running += (m.lpChange ?? placementDelta(m.placement))
        return { ...buildRow(m, running), rank: selectedPlayer?.rank ?? '', tier: selectedPlayer?.tier ?? '' }
      })
      setMatches(computedRows)
      setHasMore(history.length === LIMIT)
      setIsShowingCached(false) // Reset cached flag on successful load
    } catch (err) {
      setError(handleError(err))

      // Try to load cached data if available
      if (selectedPlayer?.puuid && hasCachedMatchHistory(selectedPlayer.puuid, storeRegion)) {
        loadCachedData()
      }
    } finally {
      setLoading(false)
    }
  }

  /* ─── Load more (pagination) ─── */
  async function loadMore() {
    if (loadingMore || !hasMore || !selectedPlayer?.puuid) return
    setLoadingMore(true)
    try {
      const offset = matches.length
      const history = await fetchPlayerMatchHistory(
        selectedPlayer.puuid,
        storeRegion,
        LIMIT,
        offset,
        () => {}, // no-op log function
        { forceRefresh: false, offlineMode: false }
      )
      if (history.length === 0) { setHasMore(false); return }
      const oldestFirst = [...history].reverse()
      const baseLPSet = matches.length > 0 ? (matches[matches.length - 1]?.lpAtEnd ?? 0) : (selectedPlayer.lp ?? 0)
      // Use real lpChange if available, otherwise fall back to approximation
      let running = baseLPSet - oldestFirst.reduce((s, m) => s + (m.lpChange ?? placementDelta(m.placement)), 0)
      const newRows: MatchRowData[] = oldestFirst.map(m => {
        running += (m.lpChange ?? placementDelta(m.placement))
        return { ...buildRow(m, running), rank: selectedPlayer?.rank ?? '', tier: selectedPlayer?.tier ?? '' }
      })
      setMatches(prev => [...prev, ...newRows])
      setHasMore(history.length === LIMIT)
    } catch (err) {
      // Don't set error state for loadMore failures, just stop loading
      setHasMore(false)
    } finally {
      setLoadingMore(false)
    }
  }

  useEffect(() => { initialLoad() }, [selectedPlayer?.puuid, storeRegion])
  useScrollSentinel(loadMoreRef, loadMore)

  /* ─── Queue filter tabs ─── */
  const QUEUE_FILTERS = ['All', 'Ranked', 'Normal', 'Hyper Roll', 'Double Up'] as const
  const [queueFilter, setQueueFilter] = useState<typeof QUEUE_FILTERS[number]>('All')

  /* ─── Filtered matches ─── */
  const filteredMatches = useMemo(() => {
    if (queueFilter === 'All') return matches
    return matches.filter(m => {
      const gameType = m.gameType.toLowerCase()
      switch (queueFilter) {
        case 'Ranked': return gameType === 'standard'
        case 'Normal': return gameType === 'normal'
        case 'Hyper Roll': return gameType === 'hyperroll'
        case 'Double Up': return gameType === 'doubleup'
        default: return true
      }
    })
  }, [matches, queueFilter])

  /* ─── Stats calculations ─── */
  const stats = useMemo(() => {
    if (filteredMatches.length === 0) {
      return { avgPlace: 0, top4Rate: 0, winRate: 0 }
    }
    const total = filteredMatches.length
    const avgPlace = filteredMatches.reduce((sum, m) => sum + m.placement, 0) / total
    const top4Count = filteredMatches.filter(m => m.placement <= 4).length
    const winCount = filteredMatches.filter(m => m.placement === 1).length
    return {
      avgPlace: Math.round(avgPlace * 10) / 10,
      top4Rate: Math.round((top4Count / total) * 100),
      winRate: Math.round((winCount / total) * 100),
    }
  }, [filteredMatches])

  /* ─── Placement badge color ─── */
  function getPlacementBadgeColor(placement: number): string {
    if (placement === 1) return '#f0b429' // gold
    if (placement === 2) return '#ffd700' // yellow
    if (placement <= 4) return '#1dc93d' // green
    return '#ef4444' // red
  }

  /* ─── Placement distribution data ─── */
  const placementDistribution = useMemo(() => {
    const distribution = Array.from({ length: 8 }, (_, i) => ({
      placement: i + 1,
      count: filteredMatches.filter(m => m.placement === i + 1).length,
    }))
    return distribution
  }, [filteredMatches])

  /* ─── Rank abbreviation helper ─── */
  function formatRankAbbreviation(tier: string, rank: string): string {
    if (!tier || !rank) return ''
    const tierMap: Record<string, string> = {
      'Challenger': 'C',
      'Grandmaster': 'GM',
      'Master': 'M',
      'Diamond': 'D',
      'Platinum': 'P',
      'Gold': 'G',
      'Silver': 'S',
      'Bronze': 'B',
      'Iron': 'I',
    }
    const tierAbbr = tierMap[tier] || tier.charAt(0)
    return `${tierAbbr}${rank}`
  }

  /* ─── LP chart data ─── */
  const chartData = useMemo((): Array<MatchRowData & { x: string; label: string; rankAbbr: string }> => {
    if (!matches.length) return []
    return matches.map((m, i) => ({
      ...m,
      x: m.date,
      label: new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      rankAbbr: formatRankAbbreviation(m.tier, m.rank)
    }))
  }, [matches])

  /* ─── Guard: no player selected ─── */
  if (!selectedPlayer?.puuid) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '100%', gap: 20, padding: 32,
        background: C.bg,
      }}>
        {/* Title */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={{ color: C.text, fontFamily: 'Rajdhani, sans-serif', fontSize: 22, fontWeight: 800, letterSpacing: '0.05em' }}>
            MATCH HISTORY
          </div>
          <div style={{ color: C.muted, fontFamily: 'Rajdhani, sans-serif', fontSize: 12, letterSpacing: '0.08em' }}>
            Search a summoner to view LP progression
          </div>
        </div>

        {/* Search form */}
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, width: '100%', maxWidth: 460 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }}
              viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className="w-4 h-4">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Summoner name..."
              style={{
                width: '100%', background: C.surface, border: `1px solid ${C.border}`,
                borderRadius: 8, padding: '9px 12px 9px 34px',
                color: C.text, fontSize: 13, fontFamily: 'Rajdhani, sans-serif',
                outline: 'none', transition: 'border-color 0.15s',
              }}
              onFocus={e => { e.target.style.borderColor = C.accent }}
              onBlur={e => { e.target.style.borderColor = C.border }}
            />
          </div>
          <select
            value={searchRegion}
            onChange={e => setSearchRegion(e.target.value as RiotRegion)}
            style={{
              background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8,
              padding: '0 10px', color: C.text, fontSize: 13, fontFamily: 'Rajdhani, sans-serif',
              outline: 'none', cursor: 'pointer',
            }}
          >
            {REGIONS.map(r => (
              <option key={r.value} value={r.value} style={{ background: C.surface }}>{r.label}</option>
            ))}
          </select>
          <button
            type="submit"
            disabled={searching}
            style={{
              background: C.accent, border: 'none', borderRadius: 8,
              padding: '0 16px', color: '#000', fontSize: 13,
              fontFamily: 'Rajdhani, sans-serif', fontWeight: 800, letterSpacing: '0.04em',
              cursor: 'pointer', opacity: searching ? 0.6 : 1, transition: 'opacity 0.15s',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            {searching ? (
              <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid #000', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            ) : (
              'Search'
            )}
          </button>
        </form>

        {searchErr && (
          <div style={{
            color: C.loss, fontFamily: 'Rajdhani, sans-serif', fontSize: 12,
            padding: '6px 14px', background: 'rgba(239,68,68,0.1)', border: `1px solid rgba(239,68,68,0.25)`,
            borderRadius: 6,
          }}>
            {searchErr}
          </div>
        )}

        {/* Spinner keyframes */}
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      background: C.bg, fontFamily: 'Rajdhani, sans-serif',
    }}>
      {/* Two-column header */}
      <div style={{
        display: 'flex',
        borderBottom: `1px solid ${C.border}`,
        background: C.surface,
        flexShrink: 0,
      }}>
        {/* LEFT PANEL - Player Profile */}
        <div style={{
          width: 220,
          padding: '16px',
          borderRight: `1px solid ${C.border}`,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}>
          {/* Avatar */}
          <div style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: '#1a1a2e',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `2px solid ${C.border}`,
            animation: 'glow 3s infinite',
          }}>
            {selectedPlayer.profileIconId ? (
              <img
                src={`https://ddragon.leagueoflegends.com/cdn/14.1.1/img/profileicon/${selectedPlayer.profileIconId}.png`}
                style={{width:'80px', height:'80px', borderRadius:'50%', objectFit:'cover', border:'2px solid #35c3e740'}}
                onError={(e) => { e.currentTarget.style.display='none' }}
              />
            ) : (
              <span style={{ color: C.muted, fontSize: 24, fontWeight: 700 }}>
                {selectedPlayer.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          {/* Player name */}
          <div style={{ textAlign: 'center' }}>
            <div style={{
              color: C.text,
              fontSize: 18,
              fontWeight: 800,
              letterSpacing: '0.02em',
              marginBottom: 2,
            }}>
              {selectedPlayer.name}
            </div>
            <div style={{ color: C.muted, fontSize: 11 }}>
              {selectedPlayer.tier && selectedPlayer.rank ? `${selectedPlayer.tier} ${selectedPlayer.rank}` : 'Unranked'}
            </div>
          </div>

          {/* Rank display - clean text */}
          <div style={{ textAlign: 'center' }}>
            <div style={{
              color: '#35c3e7',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: 2,
            }}>
              {selectedPlayer.tier || 'Unranked'} {selectedPlayer.rank || ''}
            </div>
            <div style={{ color: '#888', fontSize: 11 }}>
              {selectedPlayer.lp ?? 0} LP
            </div>
          </div>

          {/* Region badge */}
          <div style={{
            padding: '3px 10px',
            borderRadius: 4,
            background: 'rgba(255,255,255,0.05)',
            border: `1px solid ${C.border}`,
            color: C.muted,
            fontSize: 10,
            fontWeight: 600,
            textAlign: 'center',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}>
            {REGIONS.find(r => r.value === storeRegion)?.label || storeRegion}
          </div>

          {/* Summary stats */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-around',
            padding: '8px 0',
            borderTop: `1px solid ${C.border}`,
            borderBottom: `1px solid ${C.border}`,
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#f59e0b', fontSize: 28, fontWeight: 700 }}>
                {stats.avgPlace}
              </div>
              <div style={{ color: '#555', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                AVG PLACE
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: C.accent, fontSize: 28, fontWeight: 700 }}>
                {stats.top4Rate}%
              </div>
              <div style={{ color: '#555', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                TOP 4%
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: C.win, fontSize: 28, fontWeight: 700 }}>
                {stats.winRate}%
              </div>
              <div style={{ color: '#555', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                WIN%
              </div>
            </div>
          </div>

          {/* "Last X Games" label */}
          <div style={{
            color: C.faint,
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            textAlign: 'center',
          }}>
            Last {filteredMatches.length} Games
          </div>
        </div>

        {/* RIGHT PANEL - Stats & Charts */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: '16px',
          gap: 16,
        }}>
          {/* Queue filter tabs */}
          <div style={{ display: 'flex', gap: 6 }}>
            {QUEUE_FILTERS.map(filter => (
              <button
                key={filter}
                onClick={() => setQueueFilter(filter)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 0,
                  fontSize: 11,
                  fontWeight: 700,
                  border: 'none',
                  background: 'transparent',
                  color: queueFilter === filter ? '#35c3e7' : '#555',
                  cursor: 'pointer',
                  transition: 'all 0.12s',
                  fontFamily: 'Rajdhani, sans-serif',
                  letterSpacing: '0.04em',
                  borderBottom: queueFilter === filter ? '2px solid #35c3e7' : '2px solid transparent',
                }}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* LP History chart */}
          <div style={{
            borderBottom: `1px solid ${C.border}`,
            paddingBottom: 12,
          }}>
            <div style={{
              fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
              textTransform: 'uppercase', color: C.muted, marginBottom: 8,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span>LP Progression · {chartData.length} games</span>
              {isShowingCached && (
                <span style={{
                  padding: '2px 6px',
                  background: 'rgba(255,193,7,0.1)',
                  border: '1px solid rgba(255,193,7,0.3)',
                  color: '#ffc107',
                  borderRadius: 3,
                  fontSize: 8,
                  fontWeight: 600,
                }}>
                  CACHED DATA
                </span>
              )}
            </div>
            {chartData.length > 1 ? (
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={chartData} margin={{ top: 4, right: 12, bottom: 0, left: -16 }}>
                  <defs>
                    <linearGradient id="liquidGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={C.chartCyan} stopOpacity="0.3" />
                      <stop offset="50%" stopColor="#00d4ff" stopOpacity="0.15" />
                      <stop offset="100%" stopColor={C.chartCyan} stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor={C.chartCyan} />
                      <stop offset="50%" stopColor="#00d4ff" />
                      <stop offset="100%" stopColor={C.chartCyan} />
                    </linearGradient>
                    <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} opacity={0.3} />
                  <XAxis
                    dataKey="x"
                    tick={{ fontSize: 9, fill: '#555', fontFamily: 'Rajdhani, sans-serif' }}
                    tickLine={false} axisLine={false}
                    tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 9, fill: C.muted, fontFamily: 'Rajdhani, sans-serif' }}
                    tickLine={false} axisLine={false} width={38}
                    tickFormatter={(v) => {
                      const match = chartData.find(m => m.lpAtEnd === v)
                      return match?.rankAbbr || ''
                    }}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <ReferenceLine y={0} stroke={C.border} strokeDasharray="2 2" opacity={0.5} />
                  <Area
                    type="monotone"
                    dataKey="lpAtEnd"
                    stroke="none"
                    fill="url(#liquidGradient)"
                    animationDuration={800}
                    animationEasing="ease-in-out"
                  />
                  <Line
                    type="monotone"
                    dataKey="lpAtEnd"
                    stroke="url(#lineGradient)"
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    dot={<LiquidLPDot />}
                    activeDot={{ r: 6, fill: C.accent, stroke: C.chartCyan, strokeWidth: 2 }}
                    animationDuration={800}
                    animationEasing="ease-in-out"
                    filter="url(#softGlow)"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{
                height: 140, display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: C.muted, fontSize: 12,
              }}>
                Not enough data for graph
              </div>
            )}
          </div>

          {/* Last 20 Games placement badge grid */}
          <div>
            <div style={{
              fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
              textTransform: 'uppercase', color: C.muted, marginBottom: 8,
            }}>
              Last 20 Games
            </div>
            <div style={{
              display: 'flex',
              gap: 4,
              flexWrap: 'wrap',
            }}>
              {filteredMatches.slice(-20).reverse().map((match, idx) => (
                <div
                  key={match.matchId}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 4,
                    background: getPlacementBadgeColor(match.placement) + '20',
                    border: `1px solid ${getPlacementBadgeColor(match.placement)}60`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 800,
                    color: getPlacementBadgeColor(match.placement),
                    fontFamily: 'Rajdhani, sans-serif',
                  }}
                >
                  {match.placement}
                </div>
              ))}
            </div>
          </div>

          {/* Stat pills */}
          <div style={{
            display: 'flex',
            gap: 12,
            justifyContent: 'center',
          }}>
            <div style={{
              padding: '6px 16px',
              borderRadius: 20,
              background: 'rgba(245,158,11,0.1)',
              border: '1px solid rgba(245,158,11,0.3)',
              color: '#f59e0b',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.04em',
              transition: 'box-shadow 0.15s ease',
              cursor: 'default',
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 12px #f59e0b' }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none' }}
            >
              Avg Place · {stats.avgPlace}
            </div>
            <div style={{
              padding: '6px 16px',
              borderRadius: 20,
              background: C.accentDim,
              border: `1px solid ${C.accent}40`,
              color: C.accent,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.04em',
              transition: 'box-shadow 0.15s ease',
              cursor: 'default',
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 12px #00d4ff' }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none' }}
            >
              Top 4 Rate · {stats.top4Rate}%
            </div>
            <div style={{
              padding: '6px 16px',
              borderRadius: 20,
              background: C.winDim,
              border: '1px solid rgba(52,211,153,0.3)',
              color: C.win,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.04em',
              transition: 'box-shadow 0.15s ease',
              cursor: 'default',
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 12px #34d399' }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none' }}
            >
              Win Rate · {stats.winRate}%
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div>{Array.from({ length: 8 }).map((_, i) => <RowSkeleton key={i} />)}</div>
      ) : error ? (
        <ErrorDisplay
          error={error}
          onRetry={handleRetry}
          onLoadCached={loadCachedData}
          isRetrying={isRetrying}
        />
      ) : filteredMatches.length === 0 ? (
        <EmptyState message="No matches found for this player" />
      ) : (
        <>
          {/* Placement distribution chart */}
          <div style={{
            padding: '12px 16px',
            borderBottom: `1px solid ${C.border}`,
            background: C.surface,
            borderRadius: 8,
          }}>
            <div style={{
              fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
              textTransform: 'uppercase', color: C.muted, marginBottom: 8,
            }}>
              Placement Distribution
            </div>
            <div style={{display:'flex', alignItems:'flex-end', gap:'6px', height:'80px', padding:'0 4px'}}>
              {[1,2,3,4,5,6,7,8].map(p => {
                const entry = placementDistribution.find(d => d.placement === p)
                const count = entry?.count ?? 0
                const maxCount = Math.max(...placementDistribution.map(d => d.count), 1)
                const height = count > 0 ? Math.min((count / maxCount) * 80, 80) : 0
                let color = C.faint // gray for 5-8
                if (p === 1) color = C.accent // cyan for 1st
                else if (p === 2) color = C.chartCyan // lighter cyan for 2nd
                else if (p <= 4) color = C.win // green for 3-4
                return (
                  <div
                    key={p}
                    style={{
                      width: '40px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <div style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: color,
                    }}>
                      {count}
                    </div>
                    <div
                      style={{
                        width: '100%',
                        height: `${height}px`,
                        background: color,
                        borderRadius: '3px 3px 0 0',
                        minHeight: count > 0 ? 4 : 0,
                      }}
                    />
                    <div style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: C.muted,
                    }}>
                      {p}{p === 1 ? 'st' : p === 2 ? 'nd' : p === 3 ? 'rd' : 'th'}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Match list */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {/* Column header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '32px 1fr 70px 70px 90px',
              gap: 10, padding: '5px 12px',
              borderBottom: `1px solid ${C.border}`,
              fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
              textTransform: 'uppercase', fontFamily: 'Rajdhani, sans-serif',
              color: C.faint, position: 'sticky', top: 0,
              background: C.surface, zIndex: 1,
            }}>
              <span>#</span>
              <span>Game</span>
              <span style={{ textAlign: 'center' }}>LP</span>
              <span style={{ textAlign: 'right' }}>Total</span>
              <span style={{ textAlign: 'center' }}>Result</span>
            </div>

            {filteredMatches.map((m, idx) => <MatchRow key={m.matchId} match={m} index={idx} />)}

            {/* Infinite scroll sentinel */}
            <div ref={loadMoreRef} style={{ padding: '12px', textAlign: 'center' }}>
              {loadingMore && (
                <span style={{ color: C.muted, fontSize: 11 }}>Loading more…</span>
              )}
              {!hasMore && filteredMatches.length > 0 && (
                <span style={{ color: C.faint, fontSize: 11 }}>All games loaded</span>
              )}
            </div>
          </div>
        </>
      )}

      <style>{`
        .scroll-memo ::-webkit-scrollbar { width: 4px; }
        .scroll-memo ::-webkit-scrollbar-track { background: transparent; }
        .scroll-memo ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 8px #35c3e740; }
          50% { box-shadow: 0 0 20px #35c3e7aa; }
        }
        @keyframes liquidWave {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        @keyframes softBloom {
          0% { transform: scale(0.8); opacity: 0; }
          50% { transform: scale(1.1); opacity: 0.8; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes ripple {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  )
}