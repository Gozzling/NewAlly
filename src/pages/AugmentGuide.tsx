import { useState, useMemo } from 'react'
import { AUGMENTS, AUGMENT_TIERS, type Augment } from '../data/augments'
import { getAugmentTierColor, getAugmentTierBg, searchAugments } from '../services/augmentAdvisorService'
import { Search, Zap, TrendingUp, ChevronDown, ChevronUp, Swords, Package } from 'lucide-react'

const TAG_ICONS: Record<string, React.ReactNode> = {
  combat: <Swords className="w-3 h-3" />,
  item: <Package className="w-3 h-3" />,
  econ: <TrendingUp className="w-3 h-3" />,
}

function AugmentCard({ augment }: { augment: Augment }) {
  const [expanded, setExpanded] = useState(false)
  const tierColor = getAugmentTierColor(augment.tier)
  const tierBg = getAugmentTierBg(augment.tier)

  return (
    <div className={`rounded-xl border overflow-hidden ${tierBg}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-3 text-left hover:bg-white/5 transition-colors"
      >
        <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${tierBg} ${tierColor}`}>
          {augment.tier}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-white truncate">{augment.name}</div>
          <div className="text-[11px] text-neutral-400 truncate">{augment.effect}</div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-xs text-green-400">{augment.winRate}% WR</div>
          <div className="text-[10px] text-neutral-500">{augment.avgPlacement} avg</div>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-neutral-500 shrink-0" /> : <ChevronDown className="w-4 h-4 text-neutral-500 shrink-0" />}
      </button>
      {expanded && (
        <div className="px-3 pb-3 pt-0 border-t border-white/5">
          <div className="mt-2 text-xs text-neutral-300 leading-relaxed">{augment.description}</div>
          <div className="flex flex-wrap gap-1 mt-2">
            {augment.tags.map((tag) => (
              <span key={tag} className="px-1.5 py-0.5 bg-black/20 rounded text-[10px] text-neutral-400 flex items-center gap-1">
                {TAG_ICONS[tag] ?? <Zap className="w-3 h-3" />}{tag}
              </span>
            ))}
          </div>
          {augment.bestComps.length > 0 && (
            <div className="mt-2">
              <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1">Best Comps</div>
              <div className="flex flex-wrap gap-1">
                {augment.bestComps.map((c) => (
                  <span key={c} className="px-1.5 py-0.5 bg-[#35c3e7]/10 rounded text-[10px] text-[#35c3e7]">{c}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function AugmentGuide() {
  const [query, setQuery] = useState('')
  const [tierFilter, setTierFilter] = useState<'all' | Augment['tier']>('all')
  const [tagFilter, setTagFilter] = useState<string>('all')

  const filtered = useMemo(() => {
    let list = query ? searchAugments(query) : AUGMENTS
    if (tierFilter !== 'all') list = list.filter((a) => a.tier === tierFilter)
    if (tagFilter !== 'all') list = list.filter((a) => a.tags.includes(tagFilter))
    return list.sort((a, b) => b.winRate - a.winRate)
  }, [query, tierFilter, tagFilter])

  const allTags = [...new Set(AUGMENTS.flatMap((a) => a.tags))]

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Zap className="w-5 h-5 text-[#35c3e7]" />
        <h1 className="text-lg font-bold text-white">Augment Guide</h1>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search augments..."
            className="w-full bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#35c3e7]"
          />
        </div>
        <select
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value as any)}
          className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#35c3e7]"
        >
          <option value="all">All Tiers</option>
          {AUGMENT_TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
          className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#35c3e7]"
        >
          <option value="all">All Tags</option>
          {allTags.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Grid */}
      <div className="space-y-2">
        {filtered.map((a) => <AugmentCard key={a.id} augment={a} />)}
        {filtered.length === 0 && (
          <div className="text-center text-neutral-500 text-sm py-8">No augments match your filters.</div>
        )}
      </div>
    </div>
  )
}
