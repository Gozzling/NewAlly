import type { Match } from '../types/riot'
import { resolveAugmentDisplayName } from '@/lib/augmentResolver'
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
    <div className="bg-ally-card border border-[#2a2a2a] rounded-xl overflow-hidden">
      <div className="grid grid-cols-[60px_1fr_1fr_100px] gap-2 px-4 py-2.5 text-caption uppercase tracking-widest text-ally-muted font-display font-bold border-b border-[#2a2a2a]">
        <span>#</span>
        <span>Comp</span>
        <span>Augments</span>
        <span className="text-right">Date</span>
      </div>
      {matches.map((m) => (
        <div key={m.matchId}>
          <button
            onClick={() => setExpanded(expanded === m.matchId ? null : m.matchId)}
            aria-expanded={expanded === m.matchId}
            className="w-full grid grid-cols-[60px_1fr_1fr_100px] gap-2 px-4 py-2.5 text-left hover:bg-ally-hover transition-colors items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ally-accent focus-visible:ring-inset"
          >
            <span className={`font-bold ${placementColor(m.placement)} ${placementBg(m.placement)} rounded px-1.5 py-0.5 text-center text-xs w-8`}>
              {m.placement}
            </span>
            <span className="text-xs text-neutral-300 truncate">{m.comp ?? 'Mixed'}</span>
            <span className="text-[11px] text-[#a1a1a1] truncate">
              {m.augments.slice(0, 2).map((a) => resolveAugmentDisplayName(a)).join(', ')}
            </span>
            <span className="text-[11px] text-[#a1a1a1] text-right">
              {m.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
          </button>
          {expanded === m.matchId && (
            <div className="px-4 pb-3 pt-0 border-t border-[#2a2a2a] bg-ally-bg animate-ally-dropdown-in">
              <div className="py-2">
                <div className="text-caption uppercase tracking-widest text-ally-muted mb-1 font-display font-bold">Units</div>
                <div className="flex flex-wrap gap-1">
                  {m.units.map((u) => (
                    <span key={u} className="px-1.5 py-0.5 bg-ally-card border border-[#2a2a2a] rounded text-[11px] text-neutral-300">
                      {u}
                    </span>
                  ))}
                </div>
              </div>
              <div className="py-1">
                <div className="text-caption uppercase tracking-widest text-ally-muted mb-1 font-display font-bold">All Augments</div>
                <div className="flex flex-wrap gap-1">
                  {m.augments.map((a) => (
                    <span key={a} className="px-1.5 py-0.5 bg-ally-card border border-[#2a2a2a] rounded text-[11px] text-neutral-300">
                      {resolveAugmentDisplayName(a)}
                    </span>
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
