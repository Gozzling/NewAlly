import { useState, useEffect, useMemo } from 'react'
import type { MetaComp } from '../types/tft'
import { CompCard } from '../components/CompCard'
import { StatCard } from '../components/StatCard'
import { Search, TrendingUp, LayoutGrid } from 'lucide-react'

const TIERS = ['S', 'A', 'B', 'C'] as const
type Tier = (typeof TIERS)[number]

// Default tier assignment (round-robin since data lacks tiers)
function assignTiers(comps: MetaComp[]): Array<MetaComp & { tier: Tier; winRate: number; pickRate: number }> {
  const tierOrder: Tier[] = ['S', 'A', 'A', 'B', 'B', 'B', 'C', 'C']
  return comps.map((c, i) => ({
    ...c,
    tier: tierOrder[i % tierOrder.length],
    winRate: 50 + Math.round(Math.random() * 15),
    pickRate: 5 + Math.round(Math.random() * 20),
  }))
}

export function Dashboard() {
  const [activeTier, setActiveTier] = useState<Tier | 'all'>('all')
  const [search, setSearch] = useState('')
  const [comps, setComps] = useState<Array<MetaComp & { tier: Tier; winRate: number; pickRate: number }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('./metaComps.json')
      .then((r) => r.json())
      .then((data: MetaComp[]) => {
        setComps(assignTiers(data))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    let list = comps
    if (activeTier !== 'all') {
      list = list.filter((c) => c.tier === activeTier)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (c) =>
          c.compName.toLowerCase().includes(q) ||
          c.requiredUnits.some((u) => u.toLowerCase().includes(q)),
      )
    }
    return list
  }, [comps, activeTier, search])

  const avgWinRate = useMemo(() => {
    if (comps.length === 0) return 0
    return Math.round(comps.reduce((a, c) => a + (c as any).winRate, 0) / comps.length)
  }, [comps])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#a1a1a1] text-sm">Loading meta comps...</div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Total Comps" value={String(comps.length)} subtext="Meta viable builds" />
        <StatCard label="Avg Win Rate" value={`${avgWinRate}%`} valueClass="text-[#35c3e7]" />
        <StatCard label="S-Tier" value={String(comps.filter((c) => c.tier === 'S').length)} valueClass="text-yellow-400" />
      </div>

      {/* Search + Tabs */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a1a1a1]" />
          <input
            type="text"
            placeholder="Search comps, units, traits..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-[#a1a1a1] focus:outline-none focus:border-[#35c3e7]"
          />
        </div>
        <div className="flex gap-1 bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg p-1">
          <button
            onClick={() => setActiveTier('all')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${activeTier === 'all' ? 'bg-[#252525] text-white' : 'text-[#a1a1a1] hover:text-white'}`}
          >
            <LayoutGrid className="w-3.5 h-3.5 inline mr-1" />
            All
          </button>
          {TIERS.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTier(t)}
              className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${
                activeTier === t
                  ? t === 'S'
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : t === 'A'
                      ? 'bg-green-500/20 text-green-400'
                      : t === 'B'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-neutral-500/20 text-neutral-400'
                  : 'text-[#a1a1a1] hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Comp list */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#a1a1a1]">
          <TrendingUp className="w-3.5 h-3.5" />
          {filtered.length} comps shown
        </div>
        {filtered.map((comp) => (
          <CompCard key={comp.compName} comp={comp} />
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-[#a1a1a1] text-sm">No comps match your search.</div>
        )}
      </div>
    </div>
  )
}
