import { useState, useEffect, useMemo, useRef } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { fetchPlayerMatchHistory } from '@/services/matchHistoryService'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import type { Match } from '@/types/riot'

/* ─── Design tokens ─── */
const C = {
  bg:         '#181818',
  surface:    '#1f1f1f',
  border:     '#2a2a2a',
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

const TIER_COLORS: Record<string, string> = {
  iron:        '#6b7280',
  bronze:      '#cd7f32',
  silver:      '#9ca3af',
  gold:        '#f59e0b',
  platinum:    '#06b6d4',
  emerald:     '#10b981',
  diamond:     '#60a5fa',
  master:      '#c084fc',
  grandmaster: '#f97316',
  challenger:  '#f43f5e',
}

const RANGE_OPTIONS = [
  { label: 'Last 30',  value: 30  },
  { label: 'Last 100', value: 100 },
  { label: 'All',      value: -1  },
] as const
type RangeLimit = 30 | 100 | -1

/* ─── Helpers ─── */
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
}

/* ─── Build row from Match ─── */
function buildRow(m: Match, lpAtEnd: number): MatchRowData {
  return {
    matchId:   m.matchId,
    placement: m.placement,
    result:    m.placement <= 4 ? 'win' : 'loss',
    lpChange:  placementDelta(m.placement),
    date:      m.date instanceof Date ? m.date.toISOString() : String(m.date),
    duration:  Math.round(m.gameLength),
    rank:      '',
    tier:      '',
    players:   8,
    comp:      m.comp ?? null,
    traits:    m.traits ?? [],
    lpAtEnd,
  }
}

/* ─── LP dot per win/loss ─── */
function LPDot(props: { cx?: number; cy?: number; payload?: MatchRowData }) {
  const { cx, cy, payload } = props
  if (!cx || !cy || !payload) return null
  const fill = payload.result === 'loss' ? C.chartRed : C.chartGreen
  return <circle cx={cx} cy={cy} r={4} fill={fill} stroke={C.surface} strokeWidth={2} />
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

/* ─── Tier badge ─── */
function TierBadge({ tier, rank, lp }: {
  tier: string | null; rank: string | null; lp: number | null
}) {
  const col = TIER_COLORS[(tier ?? 'iron').toLowerCase()] ?? C.muted
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {tier && (
        <div style={{
          padding: '2px 9px', borderRadius: 5,
          background: `${col}20`, border: `1px solid ${col}55`,
          color: col, fontSize: 11, fontWeight: 700,
          fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}>
          {tier} {rank}
        </div>
      )}
      {lp != null && (
        <span style={{ color: C.accent, fontFamily: 'Rajdhani, sans-serif', fontSize: 13, fontWeight: 600 }}>
          {lp} LP
        </span>
      )}
    </div>
  )
}

/* ─── Skeleton row ─── */
function RowSkeleton() {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '32px 1fr 70px 70px 90px',
      gap: 10, padding: '8px 12px',
      borderBottom: `1px solid ${C.border}`,
    }}>
      {[1,2,3,4,5].map(i => (
        <div
          key={i}
          className="animate-pulse"
          style={{ height: 8, borderRadius: 4, background: C.border }}
        />
      ))}
    </div>
  )
}

/* ─── Match row ─── */
function MatchRow({ match }: { match: MatchRowData }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '32px 1fr 70px 70px 90px',
        gap: 10, alignItems: 'center',
        padding: '7px 12px',
        borderBottom: `1px solid ${C.border}`,
        transition: 'background 0.1s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
    >
      {/* Placement */}
      <div style={{
        width: 28, height: 28, borderRadius: 6,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
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
      }}>
        {match.placement}
      </div>

      {/* Meta */}
      <div>
        <div style={{ fontSize: 10, color: C.muted, marginBottom: 1 }}>
          {formatTimeAgo(match.date)} · {formatDuration(match.duration)}
        </div>
        <div style={{
          fontSize: 11, color: C.text, fontWeight: 700,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          fontFamily: 'Rajdhani, sans-serif',
        }}>
          {match.comp ?? match.traits.slice(0, 3).join(' · ')}
        </div>
        {match.traits.length > 0 && (
          <div style={{
            fontSize: 9, color: C.faint, overflow: 'hidden',
            textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            fontFamily: 'Rajdhani, sans-serif',
          }}>
            {match.traits.slice(0, 4).join(' · ')}
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

      {/* Result pill */}
      <div style={{
        borderRadius: 4, textAlign: 'center', padding: '2px 0',
        background: match.result === 'win' ? C.winDim : C.lossDim,
        border: `1px solid ${match.result === 'win' ? 'rgba(52,211,153,0.3)' : 'rgba(239,68,68,0.2)'}`,
        fontFamily: 'Rajdhani, sans-serif',
        fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
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

/* ═══════════════════════════════════════════════════════════════
   MatchHistory
═══════════════════════════════════════════════════════════════ */
export function MatchHistory() {
  const selectedPlayer = useAppStore(s => s.selectedPlayer)
  const storeRegion    = useAppStore(s => s.settings.region)

  const [matches, setMatches]       = useState<MatchRowData[]>([])
  const [loading, setLoading]         = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [range, setRange]             = useState<RangeLimit>(30)
  const [hasMore, setHasMore]          = useState(true)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  const LIMIT = 30

  /* ─── Initial load ─── */
  async function initialLoad() {
    if (!selectedPlayer?.puuid) { setLoading(false); return }
    setLoading(true); setError(null)
    try {
      const history    = await fetchPlayerMatchHistory(selectedPlayer.puuid, storeRegion, LIMIT)
      const startLp    = (selectedPlayer.lp ?? 0) as number
      // Reverse to get oldest → newest order
      const oldestFirst = [...history].reverse()
      // Initial LP before the oldest match in this page
      let running = startLp - oldestFirst.reduce((s, m) => s + placementDelta(m.placement), 0)
      const computedRows: MatchRowData[] = oldestFirst.map(m => {
        running += placementDelta(m.placement)
        return { ...buildRow(m, running), rank: selectedPlayer?.rank ?? '', tier: selectedPlayer?.tier ?? '' }
      })
      setMatches(computedRows)
      setHasMore(history.length === LIMIT)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load matches')
    } finally {
      setLoading(false)
    }
  }

  /* ─── Load more (pagination) ─── */
  async function loadMore() {
    if (loadingMore || !hasMore || !selectedPlayer?.puuid) return
    setLoadingMore(true)
    try {
      const history = await fetchPlayerMatchHistory(selectedPlayer.puuid, storeRegion, LIMIT)
      if (history.length === 0) { setHasMore(false); return }
      const oldestFirst = [...history].reverse()
      const baseLPSet = matches.length > 0 ? (matches[matches.length - 1]?.lpAtEnd ?? 0) : (selectedPlayer.lp ?? 0)
      let running = baseLPSet - oldestFirst.reduce((s, m) => s + placementDelta(m.placement), 0)
      const newRows: MatchRowData[] = oldestFirst.map(m => {
        running += placementDelta(m.placement)
        return { ...buildRow(m, running), rank: selectedPlayer?.rank ?? '', tier: selectedPlayer?.tier ?? '' }
      })
      setMatches(prev => [...prev, ...newRows])
      setHasMore(history.length === LIMIT)
    } finally {
      setLoadingMore(false)
    }
  }

  useEffect(() => { initialLoad() }, [selectedPlayer?.puuid, storeRegion])
  useScrollSentinel(loadMoreRef, loadMore)

  /* ─── LP chart data ─── */
  const chartData = useMemo((): Array<MatchRowData & { game: string }> => {
    const visible = range === -1 ? matches : matches.slice(-range)
    if (!visible.length) return []
    return visible.map(m => ({ ...m, game: m.matchId.slice(-4) }))
  }, [matches, range])

  /* ─── Guard: no player selected ─── */
  if (!selectedPlayer?.puuid) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '100%', gap: 12, padding: 32,
        background: C.bg,
      }}>
        <svg viewBox="0 0 24 24" fill="none" stroke={C.faint} strokeWidth="1.5"
          className="w-12 h-12" style={{ opacity: 0.5 }}>
          <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
        </svg>
        <p style={{ color: C.muted, fontFamily: 'Rajdhani, sans-serif', fontSize: 14 }}>
          Search for a summoner to view match history
        </p>
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100%', overflow: 'hidden',
      background: C.bg, fontFamily: 'Rajdhani, sans-serif',
    }}>

      {/* Header */}
      <div style={{
        padding: '9px 16px',
        borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', gap: 10,
        background: C.surface, flexShrink: 0,
      }}>
        <span style={{ color: C.text, fontSize: 14, fontWeight: 700, letterSpacing: '0.02em' }}>
          {selectedPlayer.name}
        </span>
        <TierBadge
          tier={selectedPlayer.tier}
          rank={selectedPlayer.rank}
          lp={selectedPlayer.lp}
        />
        <div style={{ flex: 1 }} />
        {/* Range selector */}
        <div style={{ display: 'flex', gap: 4 }}>
          {RANGE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setRange(opt.value as RangeLimit)}
              style={{
                padding: '3px 11px', borderRadius: 5, fontSize: 10, fontWeight: 700,
                border: `1px solid ${range === opt.value ? C.accent : C.border}`,
                background: range === opt.value ? C.accentDim : 'transparent',
                color: range === opt.value ? C.accent : C.muted,
                cursor: 'pointer', transition: 'all 0.12s',
                fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.04em',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div>{Array.from({ length: 8 }).map((_, i) => <RowSkeleton key={i} />)}</div>
      ) : error ? (
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: C.loss, fontFamily: 'Rajdhani, sans-serif', fontSize: 13,
        }}>
          {error}
        </div>
      ) : matches.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, fontSize: 13, opacity: 0.5 }}>
          No matches found
        </div>
      ) : (
        <>
          {/* LP Chart */}
          <div style={{ borderBottom: `1px solid ${C.border}`, padding: '10px 0 6px', flexShrink: 0 }}>
            <div style={{
              padding: '0 16px',
              fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
              textTransform: 'uppercase', color: C.muted, marginBottom: 6,
            }}>
              LP Progression · {chartData.length} games
            </div>
            {chartData.length > 1 ? (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={chartData} margin={{ top: 4, right: 12, bottom: 0, left: -16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                  <XAxis
                    dataKey="game"
                    tick={{ fontSize: 9, fill: C.muted, fontFamily: 'Rajdhani, sans-serif' }}
                    tickLine={false} axisLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 9, fill: C.muted, fontFamily: 'Rajdhani, sans-serif' }}
                    tickLine={false} axisLine={false} width={38}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <ReferenceLine y={0} stroke={C.border} strokeDasharray="2 2" />
                  <Line
                    type="monotone"
                    dataKey="lpAtEnd"
                    stroke={C.chartCyan}
                    strokeWidth={2}
                    dot={<LPDot />}
                    activeDot={{ r: 5, fill: C.accent }}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{
                height: 180, display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: C.muted, fontSize: 12,
              }}>
                Not enough data for graph
              </div>
            )}
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

            {matches.map(m => <MatchRow key={m.matchId} match={m} />)}

            {/* Infinite scroll sentinel */}
            <div ref={loadMoreRef} style={{ padding: '12px', textAlign: 'center' }}>
              {loadingMore && (
                <span style={{ color: C.muted, fontSize: 11 }}>Loading more…</span>
              )}
              {!hasMore && matches.length > 0 && (
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
      `}</style>
    </div>
  )
}