import { useState, useEffect, useMemo } from 'react'
import type { EnrichedMatch } from '@ally/shared-types'
import type { RiotRegion } from '../types/riot'
import { useAppStore } from '../store/useAppStore'
import { fetchPlayerCard } from '../services/riotApiClient'
import { fetchEnrichedPlayerMatchHistory } from '../services/matchHistoryService'
import { canonicalToLegacyMatch } from '@/domain/legacyAdapter'
import { resolveAugmentDisplayName } from '@/lib/augmentResolver'
import { useEnrichedPersonalMatches } from '../hooks/useEnrichedPersonalMatches'
import { PersonalMatchList } from '@/components/PersonalMatchList'
import { getPersonalMatches } from '../services/indexedDbService'
import { calculatePlayerStats } from '../services/playerStatsService'
import { usePersonalTopComps } from '../hooks/usePersonalTopComps'
import { StatCard } from '../components/StatCard'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as ReTooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Search, Loader2, AlertCircle } from 'lucide-react'

const REGIONS: { label: string; value: RiotRegion }[] = [
  { label: 'NA', value: 'na1' },
  { label: 'EUW', value: 'euw1' },
  { label: 'EUNE', value: 'eun1' },
  { label: 'KR', value: 'kr' },
  { label: 'BR', value: 'br1' },
  { label: 'JP', value: 'jp1' },
]

const COLORS = ['#35c3e7', '#4caf50', '#ff9800', '#f44336', '#9c27b0', '#e91e63', '#00bcd4', '#8bc34a']

export function PlayerAnalytics() {
  const selectedPlayer = useAppStore((s) => s.selectedPlayer)
  const storeRegion = useAppStore((s) => s.settings.region)
  const personalMatches = useAppStore((s) => s.personalMatches)
  const setPersonalMatches = useAppStore((s) => s.setPersonalMatches)

  const [query, setQuery] = useState(selectedPlayer?.name ?? '')
  const [region, setRegion] = useState<RiotRegion>(storeRegion)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [enrichedRiot, setEnrichedRiot] = useState<EnrichedMatch[]>([])
  const [stats, setStats] = useState<ReturnType<typeof calculatePlayerStats> | null>(null)
  const enrichedPersonal = useEnrichedPersonalMatches(personalMatches, selectedPlayer?.name ?? null)
  const personalLegacyMatches = useMemo(
    () => enrichedPersonal.map((e) => canonicalToLegacyMatch(e.match)),
    [enrichedPersonal],
  )
  const personalStats = useMemo(
    () => (personalLegacyMatches.length > 0 ? calculatePlayerStats(personalLegacyMatches) : null),
    [personalLegacyMatches],
  )
  const incompletePersonalCount = useMemo(
    () => enrichedPersonal.filter((e) => !e.validation.valid).length,
    [enrichedPersonal],
  )
  const incompleteRiotCount = useMemo(
    () => enrichedRiot.filter((e) => !e.validation.valid).length,
    [enrichedRiot],
  )
  const personalTopComps = usePersonalTopComps(personalMatches, {
    summonerName: selectedPlayer?.name ?? null,
    minGames: 2,
    windowSize: 60,
  })

  useEffect(() => {
    setRegion(storeRegion)
  }, [storeRegion])

  useEffect(() => {
    if (selectedPlayer?.name && !query) {
      setQuery(selectedPlayer.name)
    }
  }, [selectedPlayer])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const rows = await getPersonalMatches(50)
        if (mounted) setPersonalMatches(rows)
      } catch (err) {
        console.warn('[PlayerAnalytics] failed to load personal matches', err)
      }
    })()
    return () => { mounted = false }
  }, [setPersonalMatches])

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setError(null)
    setEnrichedRiot([])
    setStats(null)

    try {
      const card = await fetchPlayerCard(query.trim(), region)
      const history = await fetchEnrichedPlayerMatchHistory(card.puuid, region, 20)
      setEnrichedRiot(history)
      setStats(calculatePlayerStats(history.map((e) => canonicalToLegacyMatch(e.match))))
    } catch (err) {
      if (err instanceof Error) setError(err.message)
      else setError('Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const compPieData = stats
    ? Object.entries(stats.winRateByComp)
        .map(([name, rate]) => ({ name, rate }))
        .filter((d) => d.name !== 'Unknown')
        .slice(0, 6)
    : []

  const placementLineData = stats
    ? stats.placements.map((p, i) => ({ game: i + 1, placement: p }))
    : []

  return (
    <div className="space-y-5">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a1a1a1]" />
          <input
            type="text"
            placeholder="Search summoner for analytics..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-ally-card border border-[#2a2a2a] rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder-[#a1a1a1] focus:outline-none focus:border-[#35c3e7]"
          />
        </div>
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value as RiotRegion)}
          className="bg-ally-card border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#35c3e7]"
        >
          {REGIONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={loading}
          className="bg-[#35c3e7] hover:bg-[#2aa8c8] text-black font-semibold px-4 py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50 flex items-center gap-1.5"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Analyze'}
        </button>
      </form>

      {error && (
        <div className="flex items-center gap-2 bg-red-950/30 border border-red-900/40 rounded-lg px-4 py-3 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {stats && (
        <>
          {incompleteRiotCount > 0 && (
            <div className="font-mono text-[10px] text-ally-warning">
              {incompleteRiotCount} of {enrichedRiot.length} searched matches have incomplete data
            </div>
          )}
          {/* Summary stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Matches" value={String(stats.totalMatches)} />
            <StatCard label="Top-4 %" value={`${stats.top4Rate}%`} valueClass="text-green-400" />
            <StatCard label="Avg Placement" value={String(stats.avgPlacement)} valueClass="text-[#35c3e7]" />
            <StatCard label="Wins" value={String(stats.winCount)} valueClass="text-yellow-400" />
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Win rate by comp */}
            <div className="bg-ally-card border border-[#2a2a2a] rounded-xl p-4">
              <div className="text-[10px] uppercase tracking-widest text-[#a1a1a1] mb-3">Win Rate by Comp</div>
              {compPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={compPieData}
                      dataKey="rate"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={(props: any) => `${props.name}: ${props.rate}%`}
                      labelLine={false}
                    >
                      {compPieData.map((_, i) => (
                        <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <ReTooltip
                      contentStyle={{ background: 'var(--color-ally-card)', border: '1px solid #2a2a2a', borderRadius: '8px', fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-[#a1a1a1] text-sm">No comp data available</div>
              )}
            </div>

            {/* Placement timeline */}
            <div className="bg-ally-card border border-[#2a2a2a] rounded-xl p-4">
              <div className="text-[10px] uppercase tracking-widest text-[#a1a1a1] mb-3">Placement Timeline</div>
              {placementLineData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={placementLineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                    <XAxis dataKey="game" stroke="#a1a1a1" tick={{ fontSize: 11 }} />
                    <YAxis domain={[1, 8]} reversed stroke="#a1a1a1" tick={{ fontSize: 11 }} />
                    <ReTooltip
                      contentStyle={{ background: 'var(--color-ally-card)', border: '1px solid #2a2a2a', borderRadius: '8px', fontSize: '12px' }}
                    />
                    <Line type="monotone" dataKey="placement" stroke="#35c3e7" strokeWidth={2} dot={{ r: 3, fill: '#35c3e7' }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-[#a1a1a1] text-sm">No placement data</div>
              )}
            </div>
          </div>

          {/* Augment heatmap */}
          {stats.mostPickedAugments.length > 0 && (
            <div className="bg-ally-card border border-[#2a2a2a] rounded-xl p-4">
              <div className="text-[10px] uppercase tracking-widest text-[#a1a1a1] mb-3">Top Augments</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {stats.mostPickedAugments.map((a) => {
                  const maxCount = stats.mostPickedAugments[0].count
                  const intensity = a.count / maxCount
                  return (
                    <div
                      key={a.augment}
                      className="bg-[#181818] border border-[#2a2a2a] rounded-lg p-2.5 text-center"
                      style={{ borderColor: `rgba(53,195,231,${0.2 + intensity * 0.5})` }}
                    >
                      <div className="text-[11px] text-neutral-300 truncate">{resolveAugmentDisplayName(a.augment)}</div>
                      <div className="text-xs text-[#35c3e7] font-semibold mt-1">{a.count}x</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Your top comps (from cached GEP matches) */}
      <div className="bg-ally-card border border-[#2a2a2a] rounded-xl p-4">
        <div className="text-[10px] uppercase tracking-widest text-[#a1a1a1] mb-3">Your Top Comps (evolving)</div>
        {personalMatches.length === 0 ? (
          <div className="text-sm text-[#a1a1a1]">
            Play games with Ally running — match-end snapshots build your personal comp list.
          </div>
        ) : personalTopComps.length === 0 ? (
          <div className="text-sm text-[#a1a1a1]">
            Need at least 2 logged games on the same comp line to rank a build.
          </div>
        ) : (
          <div className="space-y-3">
            {personalTopComps.slice(0, 6).map((comp) => (
              <div key={comp.compKey} className="bg-[#181818] border border-[#2a2a2a] rounded-lg p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm font-semibold text-white">{comp.displayName}</div>
                  <div className="font-mono text-[10px] text-[#35c3e7] shrink-0">score {comp.score}</div>
                </div>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 font-mono text-[10px] text-[#a1a1a1]">
                  <span>{comp.games} games</span>
                  <span>avg {comp.avgPlacement}</span>
                  <span>top4 {comp.top4Rate}%</span>
                  <span>wins {comp.winRate}%</span>
                </div>
                {comp.coreUnits.length > 0 && (
                  <div className="mt-2 text-[11px] text-neutral-400">
                    Core:{' '}
                    {comp.coreUnits
                      .slice(0, 6)
                      .map((u) => `${u.name} (${u.rate}%)`)
                      .join(' · ')}
                  </div>
                )}
                {comp.itemBuilds.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {comp.itemBuilds.map((build) => (
                      <div key={build.unit} className="text-[11px] text-neutral-400">
                        <span className="text-neutral-300">{build.unit}</span>
                        {': '}
                        {build.items.map((i) => `${i.name} (${i.rate}%)`).join(', ')}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Your Matches */}
      <div className="bg-ally-card border border-[#2a2a2a] rounded-xl p-4">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="text-[10px] uppercase tracking-widest text-[#a1a1a1]">Your Matches</div>
          {incompletePersonalCount > 0 && (
            <span className="font-mono text-[10px] text-ally-warning">
              {incompletePersonalCount} incomplete
            </span>
          )}
        </div>
        {personalMatches.length === 0 ? (
          <div className="text-sm text-[#a1a1a1]">No personal matches logged yet.</div>
        ) : (
          <>
            {personalStats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <StatCard label="Games" value={String(personalLegacyMatches.length)} />
                <StatCard label="Avg Place" value={personalStats.avgPlacement.toFixed(2)} />
                <StatCard label="Top 4" value={`${personalStats.top4Rate.toFixed(1)}%`} />
                <StatCard label="Win Rate" value={`${personalStats.winRate.toFixed(1)}%`} />
              </div>
            )}
            <PersonalMatchList rows={enrichedPersonal} />
          </>
        )}
      </div>
    </div>
  )
}
