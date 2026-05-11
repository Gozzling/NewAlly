import { useState, useEffect } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { fetchPlayerMatchHistory } from '@/services/matchHistoryService'
import type { Match } from '@/types/riot'

/* ─── Design tokens ─── */
const C = {
  bg:         '#181818',
  surface:    '#1f1f1f',
  border:     '#2a2a2a',
  accent:     'var(--color-ally-accent)',
  accentDim:  'color-mix(in srgb, var(--color-ally-accent) 14%, transparent)',
  win:        '#34d399',
  winDim:     'rgba(52,211,153,0.12)',
  loss:       '#ef4444',
  lossDim:    'rgba(239,68,68,0.12)',
  text:       '#ffffff',
  muted:      '#a1a1a1',
  faint:      '#484848',
  gold:       '#f59e0b',
  goldDim:    'rgba(245,158,11,0.12)',
}

/* ─── Helpers ─── */
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

function getPlacementColor(placement: number): { bg: string; border: string; text: string } {
  if (placement === 1) {
    return {
      bg: C.goldDim,
      border: 'rgba(245,158,11,0.4)',
      text: C.gold,
    }
  } else if (placement <= 4) {
    return {
      bg: C.winDim,
      border: 'rgba(52,211,153,0.4)',
      text: C.win,
    }
  } else {
    return {
      bg: C.lossDim,
      border: 'rgba(239,68,68,0.3)',
      text: C.loss,
    }
  }
}

/* ─── Match Card Component ─── */
function MatchCard({ match }: { match: Match }) {
  const placementColors = getPlacementColor(match.placement)
  const isNonStandard = match.gameType !== 'standard'
  const gameTypeLabel = match.gameType === 'doubleup' ? 'Double Up' : match.gameType

  return (
    <div
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        transition: 'all 0.2s ease',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = C.border
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = C.border
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {/* Header: Placement and Date */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        {/* Placement Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 10,
              background: placementColors.bg,
              border: `2px solid ${placementColors.border}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: placementColors.text,
                fontFamily: 'Rajdhani, sans-serif',
                lineHeight: 1,
              }}
            >
              {match.placement}
            </span>
            <span
              style={{
                fontSize: 9,
                fontWeight: 600,
                color: placementColors.text,
                opacity: 0.8,
                fontFamily: 'Rajdhani, sans-serif',
                textTransform: 'uppercase',
              }}
            >
              {match.placement === 1 ? '1st' : match.placement <= 4 ? 'Top 4' : 'Bot 4'}
            </span>
          </div>

          {/* Game Info */}
          <div>
            <div
              style={{
                fontSize: 12,
                color: C.muted,
                fontFamily: 'Rajdhani, sans-serif',
                marginBottom: 2,
              }}
            >
              {formatTimeAgo(match.date instanceof Date ? match.date.toISOString() : String(match.date))}
            </div>
            <div
              style={{
                fontSize: 11,
                color: C.faint,
                fontFamily: 'Rajdhani, sans-serif',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span>{formatDuration(match.gameLength)}</span>
              <span>·</span>
              <span>Level {match.level}</span>
              {isNonStandard && (
                <>
                  <span>·</span>
                  <span
                    style={{
                      padding: '1px 5px',
                      borderRadius: 3,
                      background: 'rgba(0,212,255,0.15)',
                      border: '1px solid rgba(0,212,255,0.3)',
                      color: C.accent,
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: '0.05em',
                    }}
                  >
                    {gameTypeLabel}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Comp Name */}
      {match.comp && (
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: C.text,
            fontFamily: 'Rajdhani, sans-serif',
            marginBottom: 10,
            letterSpacing: '0.02em',
          }}
        >
          {match.comp}
        </div>
      )}

      {/* Traits */}
      {match.traits && match.traits.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
            marginBottom: 10,
          }}
        >
          {match.traits.slice(0, 5).map((trait, index) => (
            <span
              key={index}
              style={{
                padding: '3px 8px',
                borderRadius: 4,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: C.muted,
                fontSize: 10,
                fontWeight: 600,
                fontFamily: 'Rajdhani, sans-serif',
                letterSpacing: '0.02em',
              }}
            >
              {trait}
            </span>
          ))}
          {match.traits.length > 5 && (
            <span
              style={{
                padding: '3px 8px',
                borderRadius: 4,
                background: 'rgba(255,255,255,0.03)',
                color: C.faint,
                fontSize: 10,
                fontWeight: 600,
                fontFamily: 'Rajdhani, sans-serif',
              }}
            >
              +{match.traits.length - 5}
            </span>
          )}
        </div>
      )}

      {/* Units */}
      {match.units && match.units.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
            marginBottom: 10,
          }}
        >
          {match.units.slice(0, 8).map((unit, index) => (
            <span
              key={index}
              style={{
                padding: '4px 10px',
                borderRadius: 6,
                background: 'rgba(0,212,255,0.08)',
                border: '1px solid rgba(0,212,255,0.2)',
                color: C.accent,
                fontSize: 11,
                fontWeight: 700,
                fontFamily: 'Rajdhani, sans-serif',
                letterSpacing: '0.02em',
              }}
            >
              {unit}
            </span>
          ))}
          {match.units.length > 8 && (
            <span
              style={{
                padding: '4px 10px',
                borderRadius: 6,
                background: 'rgba(255,255,255,0.03)',
                color: C.faint,
                fontSize: 11,
                fontWeight: 600,
                fontFamily: 'Rajdhani, sans-serif',
              }}
            >
              +{match.units.length - 8}
            </span>
          )}
        </div>
      )}

      {/* Augments */}
      {match.augments && match.augments.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
          }}
        >
          {match.augments.slice(0, 3).map((augment, index) => (
            <span
              key={index}
              style={{
                padding: '4px 10px',
                borderRadius: 6,
                background: 'rgba(245,158,11,0.08)',
                border: '1px solid rgba(245,158,11,0.2)',
                color: C.gold,
                fontSize: 10,
                fontWeight: 600,
                fontFamily: 'Rajdhani, sans-serif',
                letterSpacing: '0.01em',
                maxWidth: 200,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {augment}
            </span>
          ))}
          {match.augments.length > 3 && (
            <span
              style={{
                padding: '4px 10px',
                borderRadius: 6,
                background: 'rgba(255,255,255,0.03)',
                color: C.faint,
                fontSize: 10,
                fontWeight: 600,
                fontFamily: 'Rajdhani, sans-serif',
              }}
            >
              +{match.augments.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

/* ─── Skeleton Card ─── */
function MatchCardSkeleton() {
  return (
    <div
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
      }}
    >
      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
        <div
          className="animate-pulse"
          style={{
            width: 48,
            height: 48,
            borderRadius: 10,
            background: C.border,
          }}
        />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div
            className="animate-pulse"
            style={{ width: '60%', height: 12, borderRadius: 4, background: C.border }}
          />
          <div
            className="animate-pulse"
            style={{ width: '40%', height: 10, borderRadius: 4, background: C.border }}
          />
        </div>
      </div>
      <div
        className="animate-pulse"
        style={{ width: '80%', height: 14, borderRadius: 4, background: C.border, marginBottom: 10 }}
      />
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="animate-pulse"
            style={{ width: 60, height: 24, borderRadius: 4, background: C.border }}
          />
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {[1, 2].map((i) => (
          <div
            key={i}
            className="animate-pulse"
            style={{ width: 80, height: 24, borderRadius: 4, background: C.border }}
          />
        ))}
      </div>
    </div>
  )
}

/* ─── RecentMatches Component ─── */
export function RecentMatches() {
  const selectedPlayer = useAppStore((s) => s.selectedPlayer)
  const storeRegion = useAppStore((s) => s.settings.region)

  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)

  const INITIAL_LIMIT = 10
  const LOAD_MORE_LIMIT = 10

  /* ─── Initial Load ─── */
  useEffect(() => {
    async function loadMatches() {
      if (!selectedPlayer?.puuid) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const history = await fetchPlayerMatchHistory(
          selectedPlayer.puuid,
          storeRegion,
          INITIAL_LIMIT,
          0,
          (msg) => console.log(`[RecentMatches] ${msg}`)
        )

        // Reverse to show newest first
        const reversedMatches = [...history].reverse()
        setMatches(reversedMatches)
        setHasMore(history.length === INITIAL_LIMIT)
      } catch (err) {
        console.error('[RecentMatches] Error loading matches:', err)
        setError(err instanceof Error ? err.message : 'Failed to load matches')
      } finally {
        setLoading(false)
      }
    }

    loadMatches()
  }, [selectedPlayer?.puuid, storeRegion])

  /* ─── Load More ─── */
  async function handleLoadMore() {
    if (loadingMore || !hasMore || !selectedPlayer?.puuid) return

    setLoadingMore(true)

    try {
      const offset = matches.length
      const history = await fetchPlayerMatchHistory(
        selectedPlayer.puuid,
        storeRegion,
        LOAD_MORE_LIMIT,
        offset,
        (msg) => console.log(`[RecentMatches] ${msg}`)
      )

      if (history.length === 0) {
        setHasMore(false)
        return
      }

      // Reverse to show newest first
      const reversedMatches = [...history].reverse()
      setMatches((prev) => [...prev, ...reversedMatches])
      setHasMore(history.length === LOAD_MORE_LIMIT)
    } catch (err) {
      console.error('[RecentMatches] Error loading more matches:', err)
      setError(err instanceof Error ? err.message : 'Failed to load more matches')
    } finally {
      setLoadingMore(false)
    }
  }

  /* ─── Guard: No player selected ─── */
  if (!selectedPlayer?.puuid) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          gap: 16,
          padding: 32,
          background: C.bg,
        }}
      >
        <div
          style={{
            color: C.muted,
            fontFamily: 'Rajdhani, sans-serif',
            fontSize: 14,
            textAlign: 'center',
          }}
        >
          Select a player to view their recent matches
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        background: C.bg,
        fontFamily: 'Rajdhani, sans-serif',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: `1px solid ${C.border}`,
          background: C.surface,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: C.text,
            letterSpacing: '0.02em',
          }}
        >
          Recent Matches
        </div>
        <div
          style={{
            fontSize: 11,
            color: C.muted,
            marginTop: 2,
          }}
        >
          {matches.length} {matches.length === 1 ? 'match' : 'matches'} loaded
        </div>
      </div>

      {/* Match List */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
        }}
      >
        {loading ? (
          <>
            {Array.from({ length: 5 }).map((_, i) => (
              <MatchCardSkeleton key={i} />
            ))}
          </>
        ) : error ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: C.loss,
              fontFamily: 'Rajdhani, sans-serif',
              fontSize: 13,
              padding: 32,
            }}
          >
            {error}
          </div>
        ) : matches.length === 0 ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: C.muted,
              fontSize: 13,
              padding: 32,
              opacity: 0.5,
            }}
          >
            No matches found
          </div>
        ) : (
          <>
            {matches.map((match) => (
              <MatchCard key={match.matchId} match={match} />
            ))}

            {/* Load More Button */}
            {hasMore && (
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  marginTop: 8,
                  borderRadius: 8,
                  background: loadingMore ? C.border : C.surface,
                  border: `1px solid ${C.border}`,
                  color: loadingMore ? C.faint : C.accent,
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: 'Rajdhani, sans-serif',
                  letterSpacing: '0.02em',
                  cursor: loadingMore ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
                onMouseEnter={(e) => {
                  if (!loadingMore) {
                    e.currentTarget.style.borderColor = C.accent
                    e.currentTarget.style.background = C.accentDim
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = C.border
                  e.currentTarget.style.background = C.surface
                }}
              >
                {loadingMore ? (
                  <>
                    <span
                      style={{
                        display: 'inline-block',
                        width: 14,
                        height: 14,
                        border: '2px solid currentColor',
                        borderTopColor: 'transparent',
                        borderRadius: '50%',
                        animation: 'spin 0.7s linear infinite',
                      }}
                    />
                    Loading...
                  </>
                ) : (
                  'Load More Matches'
                )}
              </button>
            )}

            {!hasMore && matches.length > 0 && (
              <div
                style={{
                  textAlign: 'center',
                  padding: '16px',
                  color: C.faint,
                  fontSize: 12,
                  fontFamily: 'Rajdhani, sans-serif',
                }}
              >
                All matches loaded
              </div>
            )}
          </>
        )}
      </div>

      {/* Spinner animation */}
      <style>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  )
}
