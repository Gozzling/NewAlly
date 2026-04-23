import { useState, useEffect } from 'react'
import type { RiotRegion, Match } from '../types/riot'
import { useAppStore } from '../store/useAppStore'
import { fetchPlayerCard } from '../services/riotApiClient'
import { fetchPlayerMatchHistory } from '../services/matchHistoryService'
import { calculatePlayerStats } from '../services/playerStatsService'
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

  const [query, setQuery] = useState(selectedPlayer?.name ?? '')
  const [region, setRegion] = useState<RiotRegion>(storeRegion)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [_matches, setMatches] = useState<Match[]>([])
  const [stats, setStats] = useState<ReturnType<typeof calculatePlayerStats> | null>(null)

  useEffect(() => {
    setRegion(storeRegion)
  }, [storeRegion])

  useEffect(() => {
    if (selectedPlayer?.name && !query) {
      setQuery(selectedPlayer.name)
    }
  }, [selectedPlayer])

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setError(null)
    setMatches([])
    setStats(null)

    try {
      const card = await fetchPlayerCard(query.trim(), region)
      const history = await fetchPlayerMatchHistory(card.puuid, region, 20)
      setMatches(history)
      setStats(calculatePlayerStats(history))
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
            className="w-full bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder-[#a1a1a1] focus:outline-none focus:border-[#35c3e7]"
          />
        </div>
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value as RiotRegion)}
          className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#35c3e7]"
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
            <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-xl p-4">
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
                      contentStyle={{ background: '#1f1f1f', border: '1px solid #2a2a2a', borderRadius: '8px', fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-[#a1a1a1] text-sm">No comp data available</div>
              )}
            </div>

            {/* Placement timeline */}
            <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-xl p-4">
              <div className="text-[10px] uppercase tracking-widest text-[#a1a1a1] mb-3">Placement Timeline</div>
              {placementLineData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={placementLineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                    <XAxis dataKey="game" stroke="#a1a1a1" tick={{ fontSize: 11 }} />
                    <YAxis domain={[1, 8]} reversed stroke="#a1a1a1" tick={{ fontSize: 11 }} />
                    <ReTooltip
                      contentStyle={{ background: '#1f1f1f', border: '1px solid #2a2a2a', borderRadius: '8px', fontSize: '12px' }}
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
            <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-xl p-4">
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
                      <div className="text-[11px] text-neutral-300 truncate">{a.augment.split('_').pop()}</div>
                      <div className="text-xs text-[#35c3e7] font-semibold mt-1">{a.count}x</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
