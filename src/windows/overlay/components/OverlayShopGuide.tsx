import { useAppStore } from '@/store/useAppStore'
import { UNITS } from '@/data/units'
import { Hammer } from 'lucide-react'

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '')
}

// Helper to compute trait counts from a list of unit names (assuming units are on board)
function computeTraitCounts(unitNames: string[]) {
  const traitCounts: Record<string, number> = {}
  unitNames.forEach((name) => {
    const normalized = normalizeName(name)
    const unit = UNITS.find((u) => normalizeName(u.name) === normalized)
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

  const traitCountsOnBoard = computeTraitCounts(boardUnitNames)
  const traitProgress = guideTraits.map((trait) => {
    const countOnBoard = traitCountsOnBoard[trait] || 0
    return { trait, count: countOnBoard }
  })

  const matchedGuideUnitsInShop = new Set(
    normalizedGuideUnits.filter((g) => normalizedShop.has(g))
  )

  return (
    <div className="bg-[#1f1f1f]/90 border border-[#2a2a2a] rounded-lg p-2 space-y-2">
      <div className="flex items-center justify-between text-[10px] text-neutral-500 uppercase tracking-wider">
        <div className="flex items-center gap-1">
          <Hammer className="w-3 h-3 text-[#35c3e7]" />
          <span>Playing: {guideUnits.slice(0, 3).join(' + ')}</span>
        </div>
      </div>

      <div className="space-y-1">
        <div className="text-[9px] text-neutral-500">Needed Units:</div>
        <div className="space-y-0.5">
          {guideUnits.map((unit, index) => (
            <div key={index} className="flex items-center gap-1 text-[9px]">
              <span
                className={`w-3 h-3 flex items-center justify-center ${
                  onBoardSet.has(normalizeName(unit))
                    ? 'text-[#35c3e7]'
                    : 'text-neutral-500'
                }`}
              >
                {onBoardSet.has(normalizeName(unit)) ? '✓' : '✗'}
              </span>
              <span className="truncate">{unit}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <div className="text-[9px] text-neutral-500">Board Progress:</div>
        <div className="flex items-center gap-1">
          <span className="text-[9px]">
            {onBoardSet.size}/{guideUnits.length} units
          </span>
          <div className="w-16 h-1.5 bg-[#2a2a2a]/50 rounded overflow-hidden">
            <div
              className="h-full bg-[#35c3e7]"
              style={{
                width: `${guideUnits.length > 0 ? (onBoardSet.size / guideUnits.length) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      </div>

      {guideTraits.length > 0 && (
        <div className="space-y-1">
          <div className="text-[9px] text-neutral-500">Trait Progress:</div>
          <div className="space-y-0.5">
            {traitProgress.map((tp, index) => (
              <div key={index} className="flex items-center gap-1 text-[9px]">
                <span className="w-4 h-4 flex items-center justify-center text-[#35c3e7]">
                  {tp.count}
                </span>
                <span className="truncate">{tp.trait}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-1">
        <div className="text-[9px] text-neutral-500">Shop Units:</div>
        <div className="space-y-0.5 flex flex-wrap gap-1">
          {shopUnitNames.map((unit, index) => {
            const isGuideUnit = matchedGuideUnitsInShop.has(normalizeName(unit))
            return (
              <div
                key={index}
                className={`flex items-center gap-1 px-1 py-0.5 rounded border border-[#2a2a2a] ${
                  isGuideUnit ? 'border-[#35c3e7]' : ''
                }`}
              >
                <span className="w-3 h-3">
                  {unit.length > 2 ? unit.slice(0, 2) : unit}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
