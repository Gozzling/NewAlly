import { useEffect, useMemo, useState } from 'react'
import { SectionHeader } from '@/components/SectionHeader'
import { QuickTips } from '@/components/QuickTips'
import { Skeleton } from '@/components/Skeleton'
import { getPersonalMatches } from '@/services/indexedDbService'
import { useAppStore } from '@/store/useAppStore'

type ServerStatus = 'online' | 'issues' | 'offline' | 'unknown'

function normName(name: string | undefined | null): string {
  if (!name) return ''
  return name.split('#')[0]?.trim().toLowerCase() ?? ''
}

function placementChipClass(place: number): string {
  if (place === 1) return 'bg-ally-placementFirst text-black'
  if (place <= 4) return 'bg-ally-placementTop4 text-white'
  return 'bg-ally-placementBot4 text-white'
}

export function DesktopRightRail({ serverStatus }: { serverStatus: ServerStatus }) {
  const selectedPlayer = useAppStore((s) => s.selectedPlayer)
  const personalMatches = useAppStore((s) => s.personalMatches)
  const setPersonalMatches = useAppStore((s) => s.setPersonalMatches)
  const [idbLoading, setIdbLoading] = useState(true)

  useEffect(() => {
    let live = true
    getPersonalMatches(120)
      .then((rows) => {
        if (live) setPersonalMatches(rows)
      })
      .finally(() => {
        if (live) setIdbLoading(false)
      })
    return () => {
      live = false
    }
  }, [setPersonalMatches])

  const { recentPlacements, avgPlacement } = useMemo(() => {
    if (!selectedPlayer?.name) {
      return { recentPlacements: [] as number[], avgPlacement: null as number | null }
    }
    const want = normName(selectedPlayer.name)
    const relevant = personalMatches.filter((m) => normName(m.summonerName) === want)
    const placements = relevant
      .map((m) => m.placement)
      .filter((p): p is number => typeof p === 'number' && p >= 1 && p <= 8)
    const recentPlacements = placements.slice(0, 10)
    const avgPlacement =
      placements.length > 0
        ? Math.round((placements.reduce((a, b) => a + b, 0) / placements.length) * 10) / 10
        : null
    return { recentPlacements, avgPlacement }
  }, [personalMatches, selectedPlayer])

  const rankLine =
    selectedPlayer?.rank ??
    (selectedPlayer?.tier != null && selectedPlayer?.lp != null
      ? `${selectedPlayer.tier} · ${selectedPlayer.lp} LP`
      : selectedPlayer?.tier ?? null)

  const statusDot =
    serverStatus === 'online'
      ? 'bg-ally-placementTop4 shadow-[0_0_6px_rgba(var(--color-placement-top4-rgb),0.45)]'
      : serverStatus === 'issues'
        ? 'bg-ally-warning shadow-[0_0_6px_rgba(245,158,11,0.45)]'
        : 'bg-ally-placementBot4 shadow-[0_0_6px_rgba(var(--color-placement-bot4-rgb),0.45)]'

  const statusLabel =
    serverStatus === 'online'
      ? 'All systems online'
      : serverStatus === 'issues'
        ? 'Riot: incidents or maintenance'
        : serverStatus === 'offline'
          ? 'Offline'
          : 'Status unknown'

  return (
    <aside
      className="flex w-[200px] shrink-0 flex-col gap-3 overflow-y-auto border-l border-ally-border bg-ally-surface1 px-3 py-3"
      aria-label="Session sidebar"
    >
      <section className="w-full min-w-0">
        <SectionHeader label="Player" variant="sidebar" />
        <div className="rounded-lg border border-ally-border bg-ally-surface0 p-2.5">
          {!selectedPlayer ? (
            <p className="font-mono text-[11px] leading-snug text-ally-muted">
              Look up a summoner in Match History to show rank and your locally recorded placements here.
            </p>
          ) : (
            <>
              <div className="font-display text-xs font-bold text-ally-accent">{selectedPlayer.name}</div>
              {rankLine ? (
                <div className="mt-1 font-mono text-[10px] text-ally-muted">{rankLine}</div>
              ) : (
                <div className="mt-1 font-mono text-[10px] text-ally-muted">Rank not loaded</div>
              )}
              <div className="mt-3">
                <div className="mb-1.5 font-mono text-[9px] font-semibold uppercase tracking-widest text-ally-muted">
                  Recent places (local)
                </div>
                {idbLoading ? (
                  <div className="flex flex-wrap gap-0.5">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <Skeleton key={i} className="h-4 w-4 rounded-[3px]" />
                    ))}
                  </div>
                ) : recentPlacements.length > 0 ? (
                  <div className="flex flex-wrap gap-0.5">
                    {recentPlacements.map((place, i) => (
                      <div
                        key={`${place}-${i}`}
                        className={`flex h-4 min-w-[16px] items-center justify-center rounded-[3px] px-0.5 font-mono text-[9px] font-semibold tabular-nums ${placementChipClass(place)}`}
                      >
                        {place}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="font-mono text-[10px] leading-snug text-ally-muted">
                    No placement history in Ally storage yet. Finish TFT games with the app running to build this timeline.
                  </p>
                )}
              </div>
              <div className="mt-3 flex items-end justify-between border-t border-ally-border pt-2">
                <span className="font-mono text-[9px] text-ally-muted">Avg (local)</span>
                {idbLoading ? (
                  <Skeleton className="h-5 w-10 rounded" />
                ) : avgPlacement != null ? (
                  <span className="font-display text-base font-bold tabular-nums text-ally-text">{avgPlacement}</span>
                ) : (
                  <span className="font-display text-base font-bold tabular-nums text-ally-muted">—</span>
                )}
              </div>
            </>
          )}
        </div>
      </section>

      <div className="h-px w-full bg-ally-border" />

      <section className="mb-1">
        <SectionHeader label="Server" variant="sidebar" />
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 shrink-0 rounded-full ${statusDot}`} aria-hidden />
          <span
            className={`font-mono text-xs font-medium ${
              serverStatus === 'online'
                ? 'text-ally-placementTop4'
                : serverStatus === 'issues'
                  ? 'text-ally-warning'
                  : 'text-ally-placementBot4'
            }`}
          >
            {statusLabel}
          </span>
        </div>
      </section>

      <div className="h-px w-full bg-ally-border" />

      <section className="w-full min-w-0">
        <SectionHeader label="Tips" variant="sidebar" />
        <QuickTips />
      </section>
    </aside>
  )
}
