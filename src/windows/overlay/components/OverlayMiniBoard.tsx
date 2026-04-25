import { useMemo } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { UNITS } from '@/data/units'
import { Star } from 'lucide-react'

const COST_BG: Record<number, string> = {
  1: 'bg-neutral-600',
  2: 'bg-green-600',
  3: 'bg-blue-600',
  4: 'bg-purple-600',
  5: 'bg-yellow-600',
}

export function OverlayMiniBoard() {
  const board = useAppStore((s: any) => s.gameState?.board?.units || [])

  const enriched = useMemo(() => {
    return board.map((u: any) => {
      const unitData = UNITS.find(x => x.name === u.name)
      return { ...u, cost: unitData?.cost ?? 1 }
    })
  }, [board])

  if (enriched.length === 0) return null

  return (
    <div className="bg-[#1f1f1f]/90 border border-[#2a2a2a] rounded-lg p-2 space-y-1.5">
      <div className="flex items-center justify-between text-[10px] text-neutral-500 uppercase tracking-wider">
        <span>Board ({enriched.length})</span>
      </div>
      <div className="grid grid-cols-3 gap-1">
        {enriched.map((u: any, i: number) => (
          <div key={i} className={`flex items-center gap-1 rounded px-1.5 py-1 text-[9px] text-white ${COST_BG[u.cost] || 'bg-neutral-600'}`}>
            <span className="truncate">{u.name}</span>
            {u.starLevel > 1 && <Star className="w-2.5 h-2.5 text-yellow-300 shrink-0" />}
          </div>
        ))}
      </div>
    </div>
  )
}
