import { useMemo } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { ITEM_RECIPES } from '@/data/items'
import { Box, Wrench } from 'lucide-react'

export function OverlayItemPanel() {
  const items = useAppStore((s: any) => s.gameState?.items || { onBench: [] as string[], onUnits: {} })
  const benchItems: string[] = items.onBench || []

  const craftable = useMemo(() => {
    if (benchItems.length < 2) return []
    const found: { name: string; components: [string, string]; effect: string }[] = []
    for (let i = 0; i < benchItems.length; i++) {
      for (let j = i + 1; j < benchItems.length; j++) {
        const pair = [benchItems[i], benchItems[j]].sort()
        for (const [name, [c1, c2]] of Object.entries(ITEM_RECIPES)) {
          if ((pair[0] === c1 && pair[1] === c2) || (pair[0] === c2 && pair[1] === c1)) {
            found.push({ name, components: [c1, c2], effect: 'Combine to craft' })
          }
        }
      }
    }
    return found
  }, [benchItems])

  return (
    <div className="bg-[#1f1f1f]/90 border border-[#2a2a2a] rounded-lg p-2 space-y-1.5">
      <div className="flex items-center gap-1.5 text-[10px] text-neutral-500 uppercase tracking-wider">
        <Box className="w-3 h-3" /> Items
      </div>
      {benchItems.length === 0 ? (
        <div className="text-[9px] text-neutral-600">No items on bench</div>
      ) : (
        <div className="flex flex-wrap gap-1">
          {benchItems.map((it: string, i: number) => (
            <span key={i} className="text-[9px] px-1 py-0.5 bg-[#2a2a2a] rounded text-neutral-300">{it}</span>
          ))}
        </div>
      )}
      {craftable.length > 0 && (
        <div className="pt-1 border-t border-[#2a2a2a]">
          <div className="flex items-center gap-1 text-[9px] text-[#35c3e7] mb-1"><Wrench className="w-2.5 h-2.5" /> Can Craft</div>
          {craftable.map((c, i) => (
            <div key={i} className="text-[9px] text-white">{c.name}</div>
          ))}
        </div>
      )}
    </div>
  )
}
