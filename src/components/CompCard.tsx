import { useState } from 'react'
import type { MetaComp } from '../types/tft'
import { ChevronDown, ChevronUp, Swords } from 'lucide-react'

interface CompCardProps {
  comp: MetaComp & { tier?: string; winRate?: number; pickRate?: number }
}

const TIER_COLORS: Record<string, string> = {
  S: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
  A: 'bg-green-500/20 text-green-400 border-green-500/40',
  B: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
  C: 'bg-neutral-500/20 text-neutral-400 border-neutral-500/40',
}

export function CompCard({ comp }: CompCardProps) {
  const [expanded, setExpanded] = useState(false)
  const tier = comp.tier ?? 'B'
  const tierCls = TIER_COLORS[tier] ?? TIER_COLORS.C

  return (
    <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-[#252525] transition-colors"
      >
        <span className={`px-2 py-0.5 rounded text-xs font-bold border ${tierCls}`}>
          {tier}
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-white truncate">{comp.compName}</div>
          <div className="text-[11px] text-[#a1a1a1] mt-0.5">
            {comp.requiredUnits.slice(0, 4).join(', ')}
            {comp.requiredUnits.length > 4 && '...'}
          </div>
        </div>
        {comp.winRate !== undefined && (
          <div className="text-right shrink-0">
            <div className="text-xs text-[#35c3e7]">{comp.winRate}% WR</div>
            {comp.pickRate !== undefined && (
              <div className="text-[10px] text-[#a1a1a1]">{comp.pickRate}% picked</div>
            )}
          </div>
        )}
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-[#a1a1a1] shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[#a1a1a1] shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-[#2a2a2a]">
          <div className="mt-3">
            <div className="text-[10px] uppercase tracking-widest text-[#a1a1a1] mb-2">Required Units</div>
            <div className="flex flex-wrap gap-1.5">
              {comp.requiredUnits.map((unit) => (
                <span key={unit} className="px-2 py-0.5 bg-[#181818] border border-[#2a2a2a] rounded text-[11px] text-neutral-300">
                  {unit}
                </span>
              ))}
            </div>
          </div>

          {comp.carries.length > 0 && (
            <div className="mt-3">
              <div className="text-[10px] uppercase tracking-widest text-[#a1a1a1] mb-2 flex items-center gap-1">
                <Swords className="w-3 h-3" /> Carries
              </div>
              {comp.carries.map((carry) => (
                <div key={carry.name} className="mb-2 last:mb-0">
                  <div className="text-xs font-semibold text-[#35c3e7]">{carry.name}</div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {carry.bisItems.map((item) => (
                      <span key={item} className="px-1.5 py-0.5 bg-yellow-950/30 border border-yellow-900/40 rounded text-[10px] text-yellow-400">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
