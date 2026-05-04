import { useState } from 'react'
import type { MetaComp } from '../types/tft'
import { ChevronDown, ChevronUp, Swords, Pin, PinOff, FilePlus, Monitor } from 'lucide-react'
import placeholderImg from '@/assets/icons/placeholder.svg'

interface CompCardProps {
  isPinned?: boolean;
  onPinToggle?: (compName: string) => void;
  onImport?: (comp: MetaComp) => void;
  onOverlayToggle?: (comp: MetaComp) => void;
  comp: MetaComp & { tier?: string; winRate?: number; pickRate?: number; top4Rate?: number; avgPlace?: number }
}

const TIER_COLORS: Record<string, string> = {
  S: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
  A: 'bg-green-500/20 text-green-400 border-green-500/40',
  B: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
  C: 'bg-neutral-500/20 text-neutral-400 border-neutral-500/40',
}

export function CompCard({ comp, isPinned, onPinToggle, onImport, onOverlayToggle }: CompCardProps) {
  const [expanded, setExpanded] = useState(false)
  const tier = comp.tier ?? 'B'
  const tierCls = TIER_COLORS[tier] ?? TIER_COLORS.C

  return (
    <div className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden" style={{ boxShadow: 'inset 1px 1px 2px rgba(0,0,0,0.4), inset -1px -1px 2px rgba(255,255,255,0.03)', padding: '16px' }}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-[#252525] transition-colors"
      >
        <span className={`px-2 py-0.5 rounded text-xs font-bold border ${tierCls}`}>
          {tier}
        </span>
<div className="flex-1 min-w-0 flex items-center gap-[2cm]">
            <div className="text-sm font-semibold text-white truncate">{comp.compName}</div>
            <div className="flex flex-wrap gap-1">
              {comp.requiredUnits.map(unit => (
                <img key={unit} src={`/unit-icons/${unit}.webp`} alt={unit} className="w-8 h-8 rounded-full border border-ally-border" onError={(e)=>{(e.target as HTMLImageElement).src=placeholderImg}} />
              ))}
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
              <div className="flex items-center gap-2 flex-shrink-0">
                <div role="button" tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); onPinToggle?.(comp.compName); }}
                  aria-label={isPinned ? "Unpin comp" : "Pin comp"}
                  className="text-ally-accent hover:text-ally-accent">
                  {isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                </div>
                <div role="button" tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); onImport?.(comp); }}
                  aria-label="Import to team builder"
                  className="text-ally-accent hover:text-ally-accent">
                  <FilePlus className="w-4 h-4" />
                </div>
                <div role="button" tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); onOverlayToggle?.(comp); }}
                  aria-label="Display on overlay"
                  className="text-ally-accent hover:text-ally-accent">
                  <Monitor className="w-4 h-4" />
                </div>
              </div>
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
                 <img key={unit} src={`/unit-icons/${unit}.webp`} alt={unit} className="w-10 h-10 rounded-full border border-ally-border" onError={(e)=>{(e.target as HTMLImageElement).src=placeholderImg}} />
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
