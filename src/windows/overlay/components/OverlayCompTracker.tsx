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
    <div className="bg-[#1f1f1f]/90 border border-[#2a2a2a] rounded-lg p-2 text-center">
      <div className="text-[10px] text-neutral-500">No comp detected</div>
      <div className="text-[9px] text-neutral-600 mt-0.5">Place units on board</div>
    </div>
  )

  const missing = activeComp?.missingUnits || []
  const matchPct = activeComp?.matchPercentage || 0

  return (
    <div className="bg-[#1f1f1f]/90 border border-[#2a2a2a] rounded-lg p-2 space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Target className="w-3 h-3 text-[#35c3e7]" />
        <span className="text-[11px] font-semibold text-white truncate">{comp.compName}</span>
        <span className="text-[10px] text-[#35c3e7] ml-auto">{matchPct}%</span>
      </div>
      <div className="flex items-center gap-1 flex-wrap">
        {comp.requiredUnits.slice(0, 6).map((u: string) => {
          const has = !missing.includes(u)
          return (
            <span key={u} className={`text-[9px] px-1 py-0.5 rounded ${has ? 'bg-green-500/15 text-green-400' : 'bg-red-500/10 text-red-400/60'}`}>
              {u}
            </span>
          )
        })}
      </div>
      {missing.length > 0 && (
        <div className="flex items-center gap-1 text-[9px] text-neutral-400">
          <ArrowRight className="w-2.5 h-2.5" />
          <span>Need: {missing.slice(0, 3).join(', ')}{missing.length > 3 ? ` +${missing.length - 3}` : ''}</span>
        </div>
      )}
      <div className="flex items-center gap-1.5 pt-0.5 border-t border-[#2a2a2a]">
        {comp.carries.map((c: any) => (
          <div key={c.name} className="flex items-center gap-1">
            <Star className="w-2.5 h-2.5 text-yellow-400" />
            <span className="text-[9px] text-white">{c.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
