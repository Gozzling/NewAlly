import { useState, useEffect } from 'react'
import type { RiotRegion, PlayerCard, Match } from '../types/riot'
import { useAppStore } from '../store/useAppStore'
import { fetchPlayerCard } from '../services/riotApiClient'
import { fetchPlayerMatchHistory } from '../services/matchHistoryService'
import { calculatePlayerStats } from '../services/playerStatsService'
import { StatCard } from '../components/StatCard'
import { MatchTable } from '../components/MatchTable'
import { Search, User, AlertCircle, Loader2, Clock } from 'lucide-react'

const REGIONS: { label: string; value: RiotRegion }[] = [
  { label: 'NA', value: 'na1' },
  { label: 'EUW', value: 'euw1' },
  { label: 'EUNE', value: 'eun1' },
  { label: 'KR', value: 'kr' },
  { label: 'BR', value: 'br1' },
  { label: 'JP', value: 'jp1' },
  { label: 'LAN', value: 'la1' },
  { label: 'LAS', value: 'la2' },
  { label: 'OCE', value: 'oc1' },
]

export function PlayerSearch() {
  const storeRegion = useAppStore((s) => s.settings.region)
  const setSelectedPlayer = useAppStore((s) => s.setSelectedPlayer)
  const addRecentSearch = useAppStore((s) => s.addRecentSearch)
  const recentSearches = useAppStore((s) => s.recentSearches)

  const [query, setQuery] = useState('')
  const [region, setRegion] = useState<RiotRegion>(storeRegion)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [player, setPlayer] = useState<PlayerCard | null>(null)
  const [matches, setMatches] = useState<Match[]>([])
  const [stats, setStats] = useState<ReturnType<typeof calculatePlayerStats> | null>(null)

  useEffect(() => {
    setRegion(storeRegion)
  }, [storeRegion])

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setError(null)
    setPlayer(null)
    setMatches([])
    setStats(null)

    try {
      const card = await fetchPlayerCard(query.trim(), region)
      setPlayer(card)
      setSelectedPlayer(card)
      addRecentSearch({ name: card.name, region, date: Date.now() })
      const history = await fetchPlayerMatchHistory(card.puuid, region, 20)
      setMatches(history)
      setStats(calculatePlayerStats(history))
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Unknown error')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a1a1a1]" />
          <input
            type="text"
            placeholder="Summoner name (e.g. Doublelift)"
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
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Search
        </button>
      </form>

      {recentSearches.length > 0 && !player && (
        <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-xl p-4">
          <div className="text-[10px] uppercase tracking-widest text-[#a1a1a1] mb-2 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Recent Searches
          </div>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((r) => (
              <button
                key={`${r.name}-${r.date}`}
                onClick={() => { setQuery(r.name); setRegion(r.region as RiotRegion); }}
                className="px-3 py-1.5 bg-[#181818] border border-[#2a2a2a] rounded-lg text-[11px] text-neutral-300 hover:border-[#35c3e7]/50 transition-colors"
              >
                {r.name} <span className="text-[#a1a1a1]">({r.region.toUpperCase()})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 bg-red-950/30 border border-red-900/40 rounded-lg px-4 py-3 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {player && stats && (
        <>
          {/* Player card */}
          <div className="flex items-center gap-4 bg-[#1f1f1f] border border-[#2a2a2a] rounded-xl p-4">
            <div className="w-12 h-12 bg-[#181818] rounded-full flex items-center justify-center border border-[#2a2a2a]">
              <User className="w-6 h-6 text-[#a1a1a1]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-lg font-bold text-white">{player.name}</div>
              <div className="text-sm text-[#a1a1a1]">
                Level {player.level}
                {player.tier && player.rank && (
                  <span className="ml-2">
                    · {player.tier} {player.rank}
                    {player.lp !== null && ` · ${player.lp} LP`}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Total Games" value={String(stats.totalMatches)} />
            <StatCard label="Top-4 Rate" value={`${stats.top4Rate}%`} valueClass="text-green-400" />
            <StatCard label="Avg Placement" value={String(stats.avgPlacement)} valueClass="text-[#35c3e7]" />
            <StatCard label="Win Rate" value={`${stats.winRate}%`} valueClass="text-yellow-400" />
          </div>

          {/* Most played comps */}
          {stats.mostPlayedComps.length > 0 && (
            <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-xl p-4">
              <div className="text-[10px] uppercase tracking-widest text-[#a1a1a1] mb-3">Most Played Comps</div>
              <div className="space-y-2">
                {stats.mostPlayedComps.map((c) => (
                  <div key={c.comp} className="flex items-center justify-between text-sm">
                    <span className="text-neutral-300">{c.comp}</span>
                    <div className="flex items-center gap-3 text-[11px] text-[#a1a1a1]">
                      <span>{c.count} games</span>
                      <span className="text-green-400">{c.top4Rate}% top-4</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Match history */}
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[#a1a1a1] mb-2">Match History</div>
            <MatchTable matches={matches} />
          </div>
        </>
      )}
    </div>
  )
}
