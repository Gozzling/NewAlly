import type { Match } from '../types/riot'
import { useState } from 'react'

interface MatchTableProps {
  matches: Match[]
}

function placementColor(p: number): string {
  if (p === 1) return 'text-yellow-400'
  if (p <= 4) return 'text-green-400'
  return 'text-red-400'
}

function placementBg(p: number): string {
  if (p === 1) return 'bg-yellow-500/10'
  if (p <= 4) return 'bg-green-500/10'
  return 'bg-red-500/10'
}

export function MatchTable({ matches }: MatchTableProps) {
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-xl overflow-hidden">
      <div className="grid grid-cols-[60px_1fr_1fr_100px] gap-2 px-4 py-2.5 text-[10px] uppercase tracking-widest text-[#a1a1a1] border-b border-[#2a2a2a]">
        <span>#</span>
        <span>Comp</span>
        <span>Augments</span>
        <span className="text-right">Date</span>
      </div>
      {matches.map((m) => (
        <div key={m.matchId}>
          <button
            onClick={() => setExpanded(expanded === m.matchId ? null : m.matchId)}
            className="w-full grid grid-cols-[60px_1fr_1fr_100px] gap-2 px-4 py-2.5 text-left hover:bg-[#252525] transition-colors items-center"
          >
            <span className={`font-bold ${placementColor(m.placement)} ${placementBg(m.placement)} rounded px-1.5 py-0.5 text-center text-xs w-8`}>
              {m.placement}
            </span>
            <span className="text-xs text-neutral-300 truncate">{m.comp ?? 'Mixed'}</span>
            <span className="text-[11px] text-[#a1a1a1] truncate">
              {m.augments.slice(0, 2).map((a) => a.split('_').pop()).join(', ')}
            </span>
            <span className="text-[11px] text-[#a1a1a1] text-right">
              {m.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
          </button>
          {expanded === m.matchId && (
            <div className="px-4 pb-3 pt-0 border-t border-[#2a2a2a] bg-[#181818]">
              <div className="py-2">
                <div className="text-[10px] uppercase tracking-widest text-[#a1a1a1] mb-1">Units</div>
                <div className="flex flex-wrap gap-1">
                  {m.units.map((u) => (
                    <span key={u} className="px-1.5 py-0.5 bg-[#1f1f1f] border border-[#2a2a2a] rounded text-[11px] text-neutral-300">
                      {u}
                    </span>
                  ))}
                </div>
              </div>
              <div className="py-1">
                <div className="text-[10px] uppercase tracking-widest text-[#a1a1a1] mb-1">All Augments</div>
                <div className="flex flex-wrap gap-1">
                  {m.augments.map((a) => (
                    <span key={a} className="px-1.5 py-0.5 bg-[#1f1f1f] border border-[#2a2a2a] rounded text-[11px] text-neutral-300">
                      {a.split('_').pop() ?? a}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
