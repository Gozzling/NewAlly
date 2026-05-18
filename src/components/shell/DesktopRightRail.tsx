import { useEffect, useMemo, useState } from 'react'
import { SectionHeader } from '@/components/SectionHeader'
import { QuickTips } from '@/components/QuickTips'
import { Skeleton } from '@/components/Skeleton'
import { getPersonalMatches } from '@/services/indexedDbService'
import { useAppStore } from '@/store/useAppStore'

type ServerStatus = 'online' | 'issues' | 'offline' | 'unknown'

const SIDE_CARD =
  'rounded-lg bg-ally-bg p-3 shadow-card'

function normName(name: string | undefined | null): string {
  if (!name) return ''
  return name.split('#')[0]?.trim().toLowerCase() ?? ''
}

function placementChipClass(place: number): string {
  if (place === 1) {
    return 'border border-ally-placementFirst/40 bg-ally-placementFirst text-black'
  }
  if (place <= 4) {
    return 'border border-ally-placementTop4/35 bg-ally-placementTop4/15 text-ally-placementTop4'
  }
  return 'border border-ally-placementBot4/35 bg-ally-placementBot4/15 text-ally-placementBot4'
}

function serverStatusPillClass(status: ServerStatus): string {
  switch (status) {
    case 'online':
      return 'border-ally-placementTop4/35 bg-ally-placementTop4/10 text-ally-placementTop4 before:bg-ally-placementTop4'
    case 'issues':
      return 'border-ally-warning/35 bg-ally-warning/10 text-ally-warning before:bg-ally-warning'
    case 'offline':
      return 'border-ally-placementBot4/35 bg-ally-placementBot4/10 text-ally-placementBot4 before:bg-ally-placementBot4'
    default:
      return 'border-ally-border bg-ally-hover text-ally-muted before:bg-ally-muted'
  }
}

function serverStatusLabel(status: ServerStatus): string {
  switch (status) {
    case 'online':
      return 'All systems online'
    case 'issues':
      return 'Riot: incidents or maintenance'
    case 'offline':
      return 'Offline'
    default:
      return 'Status unknown'
  }
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
      : (selectedPlayer?.tier ?? null))

  return (
    <aside
      className="custom-scrollbar flex w-[200px] shrink-0 flex-col gap-3 overflow-y-auto bg-ally-card px-3 py-3"
      aria-label="Session sidebar"
    >
      <section className="w-full min-w-0">
        <SectionHeader label="Player" variant="sidebar" />
        <div className={SIDE_CARD}>
          {!selectedPlayer ? (
            <p className="font-sans text-caption leading-snug text-ally-muted">
              Look up a summoner in Match History to show rank and your locally recorded placements here.
            </p>
          ) : (
            <>
              <div className="font-display text-sm font-semibold text-ally-accent">{selectedPlayer.name}</div>
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
                  <p className="font-sans text-[10px] leading-snug text-ally-muted">
                    No placement history in Ally storage yet. Finish TFT games with the app running to build this
                    timeline.
                  </p>
                )}
              </div>
              <div className="mt-3 flex items-center justify-between pt-2">
                <span className="font-mono text-[9px] uppercase tracking-wider text-ally-muted">Avg (local)</span>
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

      <section className="w-full min-w-0">
        <SectionHeader label="Server" variant="sidebar" />
        <div className={SIDE_CARD}>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 font-mono text-[11px] font-medium before:h-1.5 before:w-1.5 before:shrink-0 before:rounded-full before:content-[''] ${serverStatusPillClass(serverStatus)}`}
          >
            {serverStatusLabel(serverStatus)}
          </span>
        </div>
      </section>

      <section className="w-full min-w-0">
        <SectionHeader label="Tips" variant="sidebar" />
        <div className={SIDE_CARD}>
          <QuickTips />
        </div>
      </section>
    </aside>
  )
}

