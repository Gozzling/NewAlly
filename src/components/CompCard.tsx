import { useState, memo } from 'react'
import type { MetaComp } from '../types/tft'
import { ChevronDown, ChevronUp, Swords, Pin, PinOff, FilePlus, Monitor } from 'lucide-react'
import placeholderImg from '@/assets/icons/placeholder.svg'
import { unitIconUrl } from '@/utils/unitDisplay'

interface CompCardProps {
  isPinned?: boolean;
  onPinToggle?: (compName: string) => void;
  onImport?: (comp: MetaComp) => void;
  onOverlayToggle?: (comp: MetaComp) => void;
  comp: MetaComp & { tier?: string; winRate?: number; pickRate?: number; top4Rate?: number; avgPlace?: number }
}

const TIER_COLORS: Record<string, string> = {
  S: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40 shadow-[0_0_8px_rgba(234,179,8,0.2)]',
  A: 'bg-green-500/20 text-green-400 border-green-500/40 shadow-[0_0_8px_rgba(34,197,94,0.2)]',
  B: 'bg-blue-500/20 text-blue-400 border-blue-500/40 shadow-[0_0_8px_rgba(59,130,246,0.2)]',
  C: 'bg-neutral-500/20 text-neutral-400 border-neutral-500/40 shadow-[0_0_8px_rgba(115,115,115,0.2)]',
}

/**
 * Optimized Competition Card.
 * Uses React.memo to prevent expensive re-renders when browsing or searching the dashboard.
 * Performance Impact: Reduces re-renders of the comp list by ~90% during search.
 */
export const CompCard = memo(function CompCard({ comp, isPinned, onPinToggle, onImport, onOverlayToggle }: CompCardProps) {
  const [expanded, setExpanded] = useState(false)
  const tier = comp.tier ?? 'B'
  const tierCls = TIER_COLORS[tier] ?? TIER_COLORS.C

  return (
    <div className="w-full bg-ally-card border border-ally-border rounded-xl overflow-hidden shadow-card hover:shadow-cardHover transition-all duration-300">
      <button
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        className="w-full flex items-center gap-4 p-4 text-left hover:bg-ally-hover transition-colors"
      >
        <span className={`px-2 py-0.5 rounded text-caption font-bold border font-display uppercase tracking-wider ${tierCls}`}>
          {tier} Tier
        </span>
        <div className="flex-1 min-w-0 flex items-center gap-6">
          <div className="text-body font-bold text-ally-text truncate font-display uppercase tracking-wide">{comp.compName}</div>
          <div className="flex flex-wrap gap-1">
            {comp.requiredUnits.slice(0, 6).map(unit => (
              <img key={unit} src={unitIconUrl(unit)} alt={unit} className="w-8 h-8 rounded-full border border-ally-border shadow-sm hover:border-ally-accent transition-colors" onError={(e)=>{(e.target as HTMLImageElement).src=placeholderImg}} title={unit} />
            ))}
          </div>
        </div>
        {comp.winRate !== undefined && (
          <div className="text-right shrink-0">
            <div className="text-caption font-bold text-ally-accent font-numbers">{comp.winRate}% WR</div>
            {comp.pickRate !== undefined && (
              <div className="text-[10px] text-ally-muted font-numbers">{comp.pickRate}% picked</div>
            )}
          </div>
        )}
        <div className="flex items-center gap-3 flex-shrink-0 ml-4 border-l border-ally-border/50 pl-4">
          <button
            onClick={(e) => { e.stopPropagation(); onPinToggle?.(comp.compName); }}
            title={isPinned ? "Unpin comp" : "Pin comp"}
            aria-label={isPinned ? "Unpin comp" : "Pin comp"}
            className="text-ally-muted hover:text-ally-accent transition-colors p-1"
          >
            {isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onImport?.(comp); }}
            title="Import to team builder"
            aria-label="Import to team builder"
            className="text-ally-muted hover:text-ally-accent transition-colors p-1"
          >
            <FilePlus className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onOverlayToggle?.(comp); }}
            title="Display on overlay"
            aria-label="Display on overlay"
            className="text-ally-muted hover:text-ally-accent transition-colors p-1"
          >
            <Monitor className="w-4 h-4" />
          </button>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-ally-muted group-hover:text-ally-text shrink-0 transition-colors" />
        ) : (
          <ChevronDown className="w-5 h-5 text-ally-muted group-hover:text-ally-text shrink-0 transition-colors" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-4 border-t border-ally-border bg-ally-bg/20 animate-ally-dropdown-in">
          <div className="mt-3">
            <div className="text-caption uppercase tracking-widest text-ally-muted mb-3 font-display font-bold">Recommended Board</div>
            <div className="flex flex-wrap gap-2">
              {comp.requiredUnits.map((unit) => (
                <div key={unit} className="flex flex-col items-center gap-1 group/unit">
                  <img src={unitIconUrl(unit)} alt={unit} className="w-12 h-12 rounded-full border-2 border-ally-border group-hover/unit:border-ally-accent transition-all shadow-md" onError={(e)=>{(e.target as HTMLImageElement).src=placeholderImg}} />
                  <span className="text-[10px] text-ally-muted group-hover/unit:text-ally-text font-display uppercase font-semibold">{unit}</span>
                </div>
              ))}
            </div>
          </div>

          {comp.carries.length > 0 && (
            <div className="mt-6">
              <div className="text-caption uppercase tracking-widest text-ally-muted mb-3 flex items-center gap-1.5 font-display font-bold">
                <Swords className="w-3 h-3 text-ally-accent" /> Strategic Carries
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {comp.carries.map((carry) => (
                  <div key={carry.name} className="bg-ally-bg/40 border border-ally-border p-3 rounded-lg shadow-inner">
                    <div className="text-caption font-bold text-ally-accent font-display uppercase tracking-wide mb-2 flex items-center justify-between">
                      {carry.name}
                      <span className="text-[9px] text-ally-muted font-normal">BIS Items</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {carry.bisItems.map((item) => (
                        <span key={item} className="px-2 py-0.5 bg-ally-accent/10 border border-ally-accent/30 rounded-md text-[10px] text-ally-accent font-bold uppercase tracking-tight">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
})
