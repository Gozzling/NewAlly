import { useMemo } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { META_COMPS } from '@/data/metaComps'
import { Target, ArrowRight, Star } from 'lucide-react'

export function OverlayCompTracker() {
  const activeComp = useAppStore((s: any) => s.gameState.activeCompTracker)

  const comp = useMemo(() => {
    if (!activeComp?.bestMatchName) return null
    return META_COMPS.find((c: any) => c.compName === activeComp.bestMatchName) || null
  }, [activeComp])

  if (!comp) return (
    <div className="bg-ally-card/90 border border-ally-border rounded-lg p-2 text-center shadow-card">
      <div className="text-caption text-ally-muted font-display uppercase tracking-wider">No comp detected</div>
      <div className="text-[9px] text-ally-muted/60 mt-0.5">Place units on board</div>
    </div>
  )

  const missing = activeComp?.missingUnits || []
  const matchPct = activeComp?.matchPercentage || 0

  return (
    <div className="bg-ally-card/90 border border-ally-border rounded-lg p-2 space-y-1.5 shadow-card">
      <div className="flex items-center gap-1.5">
        <Target className="w-3 h-3 text-ally-accent" />
        <span className="text-caption font-bold text-ally-text font-display uppercase tracking-wide truncate">{comp.compName}</span>
        <span className="text-caption text-ally-accent font-numbers ml-auto">{matchPct}%</span>
      </div>
      <div className="flex items-center gap-1 flex-wrap">
        {comp.requiredUnits.slice(0, 6).map((u: string) => {
          const has = !missing.includes(u)
          return (
            <span key={u} className={`text-[9px] px-1 py-0.5 rounded font-medium ${has ? 'bg-ally-success/15 text-ally-success' : 'bg-ally-error/10 text-ally-error/60'}`}>
              {u}
            </span>
          )
        })}
      </div>
      {missing.length > 0 && (
        <div className="flex items-center gap-1 text-[9px] text-ally-muted font-display uppercase tracking-tight">
          <ArrowRight className="w-2.5 h-2.5" />
          <span>Need: {missing.slice(0, 3).join(', ')}{missing.length > 3 ? ` +${missing.length - 3}` : ''}</span>
        </div>
      )}
      <div className="flex items-center gap-1.5 pt-0.5 border-t border-ally-border">
        {comp.carries.map((c: any) => (
          <div key={c.name} className="flex items-center gap-1">
            <Star className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />
            <span className="text-[9px] text-ally-text-dim font-display uppercase font-semibold">{c.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
