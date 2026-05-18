import { useAppStore } from '@/store/useAppStore'
import { useTFTGameData } from '@/hooks/useTFTData'
import type { Unit } from '@/data/units'
import { Hammer } from 'lucide-react'

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '')
}

// Helper to compute trait counts from a list of unit names (assuming units are on board)
function computeTraitCounts(unitNames: string[], units: Unit[]) {
  const traitCounts: Record<string, number> = {}
  unitNames.forEach((name) => {
    const normalized = normalizeName(name)
    const unit = units.find((u) => normalizeName(u.name) === normalized)
    if (unit) {
      unit.traits.forEach((trait) => {
        traitCounts[trait] = (traitCounts[trait] || 0) + 1
      })
    }
  })
  return traitCounts
}

export function OverlayShopGuide() {
  const guideModeEnabled = useAppStore((s) => s.guideModeEnabled);
const activeGuideComp = useAppStore((s) => s.activeGuideComp);
  const { board, shopUnits } = useAppStore((s) => s.gameState)
  const { champions } = useTFTGameData()

  if (!guideModeEnabled || !activeGuideComp) {
    return null
  }

  const guideUnits = activeGuideComp.units
  const guideTraits = activeGuideComp.traits

  const boardUnitNames = board.units.map((u) => u.name)
  const normalizedBoard = new Set(boardUnitNames.map(normalizeName))

  const shopUnitNames = shopUnits
  const normalizedShop = new Set(shopUnitNames.map(normalizeName))

  const normalizedGuideUnits = guideUnits.map(normalizeName)

  const onBoardSet = new Set(
    normalizedGuideUnits.filter((unit) => normalizedBoard.has(unit))
  )

  const traitCountsOnBoard = computeTraitCounts(boardUnitNames, champions)
  const traitProgress = guideTraits.map((trait) => {
    const countOnBoard = traitCountsOnBoard[trait] || 0
    return { trait, count: countOnBoard }
  })

  const matchedGuideUnitsInShop = new Set(
    normalizedGuideUnits.filter((g) => normalizedShop.has(g))
  )

  return (
    <div className="bg-ally-card/90 border border-ally-border rounded-lg p-2 space-y-2 shadow-card">
      <div className="flex items-center justify-between text-caption text-ally-muted uppercase tracking-wider font-display font-semibold">
        <div className="flex items-center gap-1">
          <Hammer className="w-3 h-3 text-ally-accent" />
          <span>Playing: {guideUnits.slice(0, 3).join(' + ')}</span>
        </div>
      </div>

      <div className="space-y-1">
        <div className="text-[9px] text-ally-muted font-display uppercase tracking-widest">Needed Units:</div>
        <div className="space-y-0.5">
          {guideUnits.map((unit, index) => (
            <div key={index} className="flex items-center gap-1 text-caption font-display font-medium uppercase tracking-tighter">
              <span
                className={`w-3 h-3 flex items-center justify-center ${
                  onBoardSet.has(normalizeName(unit))
                    ? 'text-ally-accent'
                    : 'text-ally-muted/40'
                }`}
              >
                {onBoardSet.has(normalizeName(unit)) ? '✓' : '✗'}
              </span>
              <span className={`truncate ${onBoardSet.has(normalizeName(unit)) ? 'text-ally-text' : 'text-ally-muted'}`}>{unit}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <div className="text-[9px] text-ally-muted font-display uppercase tracking-widest">Board Progress:</div>
        <div className="flex items-center gap-2">
          <span className="text-caption font-numbers text-ally-text">
            {onBoardSet.size}/{guideUnits.length}
          </span>
          <div className="flex-1 h-1 bg-ally-bg rounded-pill overflow-hidden">
            <div
              className="h-full bg-ally-accent shadow-[0_0_8px_rgba(0,212,255,0.4)]"
              style={{
                width: `${guideUnits.length > 0 ? (onBoardSet.size / guideUnits.length) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      </div>

      {guideTraits.length > 0 && (
        <div className="space-y-1">
          <div className="text-[9px] text-ally-muted font-display uppercase tracking-widest">Trait Progress:</div>
          <div className="space-y-0.5">
            {traitProgress.map((tp, index) => (
              <div key={index} className="flex items-center gap-1 text-caption font-display font-bold uppercase tracking-tight">
                <span className="w-4 h-4 flex items-center justify-center text-ally-accent font-numbers">
                  {tp.count}
                </span>
                <span className="truncate text-ally-text-dim">{tp.trait}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-1">
        <div className="text-[9px] text-ally-muted font-display uppercase tracking-widest">Shop Units:</div>
        <div className="space-y-0.5 flex flex-wrap gap-1">
          {shopUnitNames.map((unit, index) => {
            const isGuideUnit = matchedGuideUnitsInShop.has(normalizeName(unit))
            return (
              <div
                key={index}
                className={`flex items-center justify-center w-7 h-7 rounded-sm border bg-ally-bg/50 font-display font-bold text-[10px] uppercase ${
                  isGuideUnit ? 'border-ally-accent text-ally-accent shadow-[inset_0_0_4px_rgba(0,212,255,0.2)]' : 'border-ally-border text-ally-muted'
                }`}
              >
                {unit.length > 2 ? unit.slice(0, 2) : unit}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
