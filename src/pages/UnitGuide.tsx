import { useState, useMemo } from 'react'
import { UNITS } from '../data/units'
import { Search, Swords, Heart, Zap, Target, TrendingUp } from 'lucide-react'

const TIER_COLORS: Record<string, string> = {
  S: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  A: 'text-green-400 bg-green-500/10 border-green-500/30',
  B: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  C: 'text-neutral-400 bg-neutral-500/10 border-neutral-500/30',
  D: 'text-red-400 bg-red-500/10 border-red-500/30',
}

function UnitCard({ unit }: { unit: (typeof UNITS)[0] }) {
  const [expanded, setExpanded] = useState(false)
  const tierCls = TIER_COLORS[unit.tier] ?? TIER_COLORS.C
  const costColors: Record<number, string> = { 1: 'text-neutral-400', 2: 'text-green-400', 3: 'text-blue-400', 4: 'text-purple-400', 5: 'text-yellow-400' }

  return (
    <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-xl overflow-hidden">
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center gap-3 p-3 text-left hover:bg-[#252525] transition-colors">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold border ${tierCls}`}>{unit.tier}</div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-white truncate">{unit.name}</div>
          <div className="text-[11px] text-neutral-400 truncate">{unit.traits.join(' / ')}</div>
        </div>
        <div className={`text-sm font-bold ${costColors[unit.cost]}`}>{unit.cost}g</div>
        {expanded ? <TrendingUp className="w-4 h-4 text-neutral-500 shrink-0 rotate-180" /> : <TrendingUp className="w-4 h-4 text-neutral-500 shrink-0" />}
      </button>
      {expanded && (
        <div className="px-3 pb-3 pt-0 border-t border-[#2a2a2a]">
          <div className="mt-3">
            <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1">Ability</div>
            <div className="text-xs font-semibold text-[#35c3e7]">{unit.ability.name}</div>
            <div className="text-[11px] text-neutral-300 mt-0.5">{unit.ability.description}</div>
            <div className="text-[11px] text-neutral-400 mt-1">{unit.ability.damage}</div>
          </div>
          <div className="grid grid-cols-4 gap-2 mt-3">
            <div className="text-center"><div className="text-xs text-white">{unit.stats.hp}</div><div className="text-[10px] text-neutral-500">HP</div></div>
            <div className="text-center"><div className="text-xs text-white">{unit.stats.ad}</div><div className="text-[10px] text-neutral-500">AD</div></div>
            <div className="text-center"><div className="text-xs text-white">{unit.stats.ap}</div><div className="text-[10px] text-neutral-500">AP</div></div>
            <div className="text-center"><div className="text-xs text-white">{unit.stats.atkSpeed}</div><div className="text-[10px] text-neutral-500">AS</div></div>
          </div>
          <div className="mt-3">
            <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1">Best Items</div>
            <div className="flex flex-wrap gap-1">
              {unit.bestItems.map((i) => (
                <span key={i} className="px-1.5 py-0.5 bg-yellow-500/10 border border-yellow-500/20 rounded text-[10px] text-yellow-400">{i}</span>
              ))}
            </div>
          </div>
          <div className="mt-2">
            <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1">Best Comps</div>
            <div className="flex flex-wrap gap-1">
              {unit.bestComps.map((c) => (
                <span key={c} className="px-1.5 py-0.5 bg-[#35c3e7]/10 rounded text-[10px] text-[#35c3e7]">{c}</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function UnitGuide() {
  const [query, setQuery] = useState('')
  const [costFilter, setCostFilter] = useState<number | 'all'>('all')
  const [tierFilter, setTierFilter] = useState<string>('all')

  const filtered = useMemo(() => {
    let list = query ? UNITS.filter((u) => u.name.toLowerCase().includes(query.toLowerCase()) || u.traits.some((t) => t.toLowerCase().includes(query.toLowerCase()))) : UNITS
    if (costFilter !== 'all') list = list.filter((u) => u.cost === costFilter)
    if (tierFilter !== 'all') list = list.filter((u) => u.tier === tierFilter)
    return list.sort((a, b) => b.cost - a.cost)
  }, [query, costFilter, tierFilter])

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center gap-2"><Swords className="w-5 h-5 text-[#35c3e7]" /><h1 className="text-lg font-bold text-white">Unit Guide</h1></div>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search units or traits..." className="w-full bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#35c3e7]" />
        </div>
        <select value={costFilter} onChange={(e) => setCostFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))} className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#35c3e7]">
          <option value="all">All Costs</option>
          {[1, 2, 3, 4, 5].map((c) => <option key={c} value={c}>{c}g</option>)}
        </select>
        <select value={tierFilter} onChange={(e) => setTierFilter(e.target.value)} className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#35c3e7]">
          <option value="all">All Tiers</option>
          {['S', 'A', 'B', 'C', 'D'].map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div className="space-y-2">{filtered.map((u) => <UnitCard key={u.id} unit={u} />)}</div>
    </div>
  )
}
