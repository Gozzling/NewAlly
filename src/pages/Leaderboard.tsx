import { useState, useMemo } from 'react'
import { Trophy, Search, Medal, ArrowUpDown } from 'lucide-react'

interface LeaderboardEntry {
  rank: number
  summonerName: string
  region: string
  tier: string
  lp: number
  wins: number
  losses: number
  top4Rate: number
  avgPlacement: number
}

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, summonerName: 'SpaceKing', region: 'NA', tier: 'Challenger', lp: 1240, wins: 142, losses: 58, top4Rate: 78.5, avgPlacement: 3.2 },
  { rank: 2, summonerName: 'BoonMaster', region: 'EUW', tier: 'Challenger', lp: 1195, wins: 138, losses: 62, top4Rate: 76.2, avgPlacement: 3.4 },
  { rank: 3, summonerName: 'MeepleGod', region: 'KR', tier: 'Challenger', lp: 1150, wins: 135, losses: 65, top4Rate: 75.0, avgPlacement: 3.5 },
  { rank: 4, summonerName: 'ArbiterOne', region: 'NA', tier: 'Challenger', lp: 1080, wins: 128, losses: 72, top4Rate: 73.8, avgPlacement: 3.6 },
  { rank: 5, summonerName: 'GrooveSniper', region: 'EUW', tier: 'Challenger', lp: 1020, wins: 125, losses: 75, top4Rate: 72.5, avgPlacement: 3.7 },
  { rank: 6, summonerName: 'DarkStarX', region: 'KR', tier: 'Grandmaster', lp: 980, wins: 118, losses: 82, top4Rate: 70.0, avgPlacement: 3.8 },
  { rank: 7, summonerName: 'MechaPilot', region: 'NA', tier: 'Grandmaster', lp: 940, wins: 115, losses: 85, top4Rate: 68.5, avgPlacement: 3.9 },
  { rank: 8, summonerName: 'PsionWave', region: 'EUW', tier: 'Grandmaster', lp: 900, wins: 110, losses: 90, top4Rate: 67.0, avgPlacement: 4.0 },
  { rank: 9, summonerName: 'NovaStrike', region: 'KR', tier: 'Grandmaster', lp: 860, wins: 108, losses: 92, top4Rate: 65.5, avgPlacement: 4.1 },
  { rank: 10, summonerName: 'Primordial', region: 'NA', tier: 'Grandmaster', lp: 820, wins: 105, losses: 95, top4Rate: 64.0, avgPlacement: 4.2 },
]

type SortKey = 'rank' | 'lp' | 'top4Rate' | 'avgPlacement' | 'wins'

export function Leaderboard() {
  const [query, setQuery] = useState('')
  const [regionFilter, setRegionFilter] = useState('all')
  const [sortBy, setSortBy] = useState<SortKey>('rank')
  const [sortDesc, setSortDesc] = useState(false)

  const filtered = useMemo(() => {
    let list = [...MOCK_LEADERBOARD]
    if (query) list = list.filter(e => e.summonerName.toLowerCase().includes(query.toLowerCase()))
    if (regionFilter !== 'all') list = list.filter(e => e.region === regionFilter)
    list.sort((a, b) => {
      const va = a[sortBy], vb = b[sortBy]
      return sortDesc ? (vb > va ? 1 : -1) : (va > vb ? 1 : -1)
    })
    return list
  }, [query, regionFilter, sortBy, sortDesc])

  const toggleSort = (key: SortKey) => {
    if (sortBy === key) setSortDesc(!sortDesc)
    else { setSortBy(key); setSortDesc(false) }
  }

  const tierColor = (tier: string) => tier === 'Challenger' ? 'text-yellow-400' : 'text-purple-400'
  const rankIcon = (rank: number) => rank <= 3 ? <Medal className={`w-4 h-4 ${rank === 1 ? 'text-yellow-400' : rank === 2 ? 'text-neutral-300' : 'text-amber-600'}`} /> : <span className="text-xs text-neutral-500 w-4 text-center">{rank}</span>

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center gap-2"><Trophy className="w-5 h-5 text-[#35c3e7]" /><h1 className="text-lg font-bold text-white">Leaderboard</h1></div>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search summoner..." className="w-full bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#35c3e7]" /></div>
        <select value={regionFilter} onChange={e => setRegionFilter(e.target.value)} className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#35c3e7]">
          <option value="all">All Regions</option><option value="NA">NA</option><option value="EUW">EUW</option><option value="KR">KR</option>
        </select>
      </div>
      <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-xl overflow-hidden">
        <div className="grid grid-cols-12 gap-2 px-4 py-2 text-[10px] uppercase tracking-wider text-neutral-500 border-b border-[#2a2a2a]">
          <button onClick={() => toggleSort('rank')} className="col-span-1 flex items-center gap-1 hover:text-white">Rank <ArrowUpDown className="w-3 h-3" /></button>
          <div className="col-span-3">Summoner</div>
          <div className="col-span-2">Region</div>
          <button onClick={() => toggleSort('lp')} className="col-span-2 flex items-center gap-1 hover:text-white">LP <ArrowUpDown className="w-3 h-3" /></button>
          <button onClick={() => toggleSort('top4Rate')} className="col-span-2 flex items-center gap-1 hover:text-white">Top4 <ArrowUpDown className="w-3 h-3" /></button>
          <button onClick={() => toggleSort('avgPlacement')} className="col-span-2 flex items-center gap-1 hover:text-white">Avg <ArrowUpDown className="w-3 h-3" /></button>
        </div>
        {filtered.map(e => (
          <div key={e.rank} className="grid grid-cols-12 gap-2 px-4 py-2.5 border-b border-[#2a2a2a] hover:bg-[#252525] transition-colors items-center">
            <div className="col-span-1 flex items-center">{rankIcon(e.rank)}</div>
            <div className="col-span-3"><div className="text-sm font-semibold text-white">{e.summonerName}</div><div className={`text-[11px] font-medium ${tierColor(e.tier)}`}>{e.tier}</div></div>
            <div className="col-span-2 text-xs text-neutral-400">{e.region}</div>
            <div className="col-span-2 text-xs text-white font-medium">{e.lp} <span className="text-neutral-500">LP</span></div>
            <div className="col-span-2 text-xs text-green-400">{e.top4Rate}%</div>
            <div className="col-span-2 text-xs text-[#35c3e7]">{e.avgPlacement}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
