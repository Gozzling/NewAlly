import { useMemo } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { UNITS } from '@/data/units'
import { SYNERGIES } from '@/data/synergies'
import { Sparkles } from 'lucide-react'

export function OverlayTraitPanel() {
  const board = useAppStore((s: any) => s.gameState?.board?.units || [])

  const traits = useMemo(() => {
    const counts: Record<string, number> = {}
    board.forEach((u: any) => {
      const unit = UNITS.find(x => x.name === u.name)
      unit?.traits.forEach(t => { counts[t] = (counts[t] || 0) + 1 })
    })
    return Object.entries(counts)
      .map(([name, count]) => {
        const syn = SYNERGIES.find(s => s.name === name)
        const active = syn?.thresholds.filter(t => count >= t.count).pop()
        const next = syn?.thresholds.find(t => count < t.count)
        return { name, count, active, next, syn }
      })
      .sort((a, b) => (b.active ? 1 : 0) - (a.active ? 1 : 0))
  }, [board])

  if (traits.length === 0) return null

  return (
    <div className="bg-[#1f1f1f]/90 border border-[#2a2a2a] rounded-lg p-2 space-y-1">
      <div className="flex items-center gap-1.5 text-[10px] text-neutral-500 uppercase tracking-wider">
        <Sparkles className="w-3 h-3" /> Active Traits
      </div>
      {traits.map(t => (
        <div key={t.name} className="flex items-center justify-between text-[10px]">
          <span className={t.active ? 'text-white font-medium' : 'text-neutral-500'}>{t.name}</span>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.max(t.count, t.next?.count || 0) }).map((_, i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < t.count ? (t.active ? 'bg-[#35c3e7]' : 'bg-neutral-500') : 'bg-[#2a2a2a]'}`} />
            ))}
            <span className={`ml-1 ${t.active ? 'text-[#35c3e7]' : 'text-neutral-500'}`}>{t.count}{t.next ? `/${t.next.count}` : ''}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
