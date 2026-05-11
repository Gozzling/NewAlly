import { useMemo } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { UNITS } from '@/data/units'
import { Star } from 'lucide-react'

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '')
}

const COST_BG: Record<number, string> = {
  1: 'bg-neutral-600/40 border-neutral-500/30',
  2: 'bg-green-600/40 border-green-500/30',
  3: 'bg-blue-600/40 border-blue-500/30',
  4: 'bg-purple-600/40 border-purple-500/30',
  5: 'bg-yellow-600/40 border-yellow-500/30',
}

export function OverlayMiniBoard() {
  const board = useAppStore((s: any) => s.gameState?.board?.units || [])

  const enriched = useMemo(() => {
    return board.map((u: any) => {
      const unitData = UNITS.find((x) => normalizeName(x.name) === normalizeName(u.name))
      return { ...u, cost: unitData?.cost ?? 1 }
    })
  }, [board])

  if (enriched.length === 0) return null

  return (
    <div className="bg-ally-card/90 border border-ally-border rounded-lg p-2 space-y-1.5 shadow-card">
      <div className="flex items-center justify-between text-caption text-ally-muted uppercase tracking-wider font-display font-semibold">
        <span>Board <span className="text-ally-accent font-numbers">({enriched.length})</span></span>
      </div>
      <div className="grid grid-cols-3 gap-1">
        {enriched.map((u: any, i: number) => (
          <div key={i} className={`flex items-center gap-1 rounded-sm border px-1 py-0.5 text-[9px] text-ally-text font-display uppercase tracking-tighter ${COST_BG[u.cost] || 'bg-neutral-600/40 border-neutral-500/30'}`}>
            <span className="truncate flex-1">{u.name}</span>
            {u.starLevel > 1 && <Star className="w-2 h-2 text-yellow-400 fill-yellow-400 shrink-0" />}
          </div>
        ))}
      </div>
    </div>
  )
}
