import { useState, useMemo } from 'react'
import { SYNERGIES } from '../data/synergies'
import { Search, Shield, Swords, Zap, Hexagon, ChevronDown, ChevronUp } from 'lucide-react'

const TYPE_ICONS: Record<string, React.ReactNode> = {
  offense: <Swords className="w-3.5 h-3.5" />,
  defense: <Shield className="w-3.5 h-3.5" />,
  utility: <Zap className="w-3.5 h-3.5" />,
  hybrid: <Hexagon className="w-3.5 h-3.5" />,
}

const TYPE_COLORS: Record<string, string> = {
  offense: 'text-red-400 bg-red-500/10 border-red-500/20',
  defense: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  utility: 'text-green-400 bg-green-500/10 border-green-500/20',
  hybrid: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
}

function SynergyCard({ synergy }: { synergy: (typeof SYNERGIES)[0] }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-xl overflow-hidden">
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center gap-3 p-3 text-left hover:bg-[#252525] transition-colors">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${TYPE_COLORS[synergy.type]}`}>{TYPE_ICONS[synergy.type]}</div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-white truncate">{synergy.name}</div>
          <div className="text-[11px] text-neutral-400 truncate">{synergy.description}</div>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-neutral-500 shrink-0" /> : <ChevronDown className="w-4 h-4 text-neutral-500 shrink-0" />}
      </button>
      {expanded && (
        <div className="px-3 pb-3 pt-0 border-t border-[#2a2a2a]">
          <div className="mt-2 space-y-1.5">
            {synergy.thresholds.map((t) => (
              <div key={t.count} className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-[#35c3e7]/10 text-[#35c3e7] flex items-center justify-center text-[10px] font-bold">{t.count}</div>
                <div className="text-xs text-neutral-300">{t.effect}</div>
              </div>
            ))}
          </div>
          <div className="mt-3">
            <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1">Best Units</div>
            <div className="flex flex-wrap gap-1">
              {synergy.bestUnits.map((u) => <span key={u} className="px-1.5 py-0.5 bg-[#35c3e7]/10 rounded text-[10px] text-[#35c3e7]">{u}</span>)}
            </div>
          </div>
          <div className="mt-2">
            <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1">Best Comps</div>
            <div className="flex flex-wrap gap-1">
              {synergy.bestComps.map((c) => <span key={c} className="px-1.5 py-0.5 bg-yellow-500/10 rounded text-[10px] text-yellow-400">{c}</span>)}
            </div>
          </div>
          {synergy.counters.length > 0 && (
            <div className="mt-2">
              <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1">Counters</div>
              <div className="flex flex-wrap gap-1">
                {synergy.counters.map((c) => <span key={c} className="px-1.5 py-0.5 bg-red-500/10 rounded text-[10px] text-red-400">{c}</span>)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function SynergyGuide() {
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  const filtered = useMemo(() => {
    let list = query ? SYNERGIES.filter((s) => s.name.toLowerCase().includes(query.toLowerCase()) || s.bestUnits.some((u) => u.toLowerCase().includes(query.toLowerCase()))) : SYNERGIES
    if (typeFilter !== 'all') list = list.filter((s) => s.type === typeFilter)
    return list
  }, [query, typeFilter])

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center gap-2"><Hexagon className="w-5 h-5 text-[#35c3e7]" /><h1 className="text-lg font-bold text-white">Synergy Guide</h1></div>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search synergies or units..." className="w-full bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#35c3e7]" />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#35c3e7]">
          <option value="all">All Types</option>
          <option value="offense">Offense</option>
          <option value="defense">Defense</option>
          <option value="utility">Utility</option>
          <option value="hybrid">Hybrid</option>
        </select>
      </div>
      <div className="space-y-2">{filtered.map((s) => <SynergyCard key={s.id} synergy={s} />)}</div>
    </div>
  )
}
