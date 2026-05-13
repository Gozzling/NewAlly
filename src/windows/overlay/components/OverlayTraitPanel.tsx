import { useMemo } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { BUNDLED_SET_DATA } from '@/services/cdnDataService'
import { Sparkles } from 'lucide-react'

export function OverlayTraitPanel() {
  const board = useAppStore((s: any) => s.gameState?.board?.units || [])
  const gameData = useAppStore(s => s.gameData)
  const roster = gameData.champions.length > 0 ? gameData.champions : BUNDLED_SET_DATA.champions
  const traitRoster = gameData.traits.length > 0 ? gameData.traits : BUNDLED_SET_DATA.traits

  const traits = useMemo(() => {
    const counts: Record<string, number> = {}
    board.forEach((u: any) => {
      const unit = roster.find(x => x.name === u.name)
      unit?.traits.forEach(t => { counts[t] = (counts[t] || 0) + 1 })
    })
    return Object.entries(counts)
      .map(([name, count]) => {
        const syn = traitRoster.find(s => s.name === name)
        const active = syn?.thresholds.filter(t => count >= t.count).pop()
        const next = syn?.thresholds.find(t => count < t.count)
        return { name, count, active, next, syn }
      })
      .sort((a, b) => (b.active ? 1 : 0) - (a.active ? 1 : 0))
  }, [board])

  if (traits.length === 0) return null

  return (
    <div className="ally-card !bg-ally-card/90 p-2 space-y-1 shadow-card">
      <div className="flex items-center gap-1.5 text-caption text-ally-muted uppercase tracking-wider font-display font-semibold">
        <Sparkles className="w-3 h-3 text-ally-accent" /> Active Traits
      </div>
      {traits.map(t => (
        <div key={t.name} className="flex items-center justify-between text-caption font-display">
          <span className={`uppercase tracking-wide ${t.active ? 'text-ally-text font-bold' : 'text-ally-muted'}`}>{t.name}</span>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.max(t.count, t.next?.count || 0) }).map((_, i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < t.count ? (t.active ? 'bg-ally-accent shadow-[0_0_4px_rgba(0,212,255,0.6)]' : 'bg-ally-muted') : 'bg-ally-border'}`} />
            ))}
            <span className={`ml-1 font-numbers ${t.active ? 'text-ally-accent font-bold' : 'text-ally-muted'}`}>{t.count}{t.next ? `/${t.next.count}` : ''}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
