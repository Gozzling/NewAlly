import { useMemo } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { UNITS } from '@/data/units'
import { SYNERGIES } from '@/data/synergies'
import { Hammer } from 'lucide-react'

// Helper to compute trait counts from a list of unit names (assuming units are on board)
function computeTraitCounts(unitNames: string[]) {
  const traitCounts: Record<string, number> = {};
  unitNames.forEach(name => {
    const unit = UNITS.find(u => u.name === name);
    if (unit) {
      unit.traits.forEach(trait => {
        traitCounts[trait] = (traitCounts[trait] || 0) + 1;
      });
    }
  });
  return traitCounts;
}

export function OverlayShopGuide() {
  const { guideModeEnabled, activeGuideComp } = useAppStore(s => ({
    guideModeEnabled: s.guideModeEnabled,
    activeGuideComp: s.activeGuideComp,
  }));
  const { board, shopUnits } = useAppStore(s => s.gameState);

  if (!guideModeEnabled || !activeGuideComp) {
    return null;
  }

  const guideUnits = activeGuideComp.units;
  const guideTraits = activeGuideComp.traits; // We stored traits in activeGuideComp

  // Units currently on board
  const boardUnitNames = board.units.map(u => u.name);

  // Units currently in shop (from GEP)
  const shopUnitNames = shopUnits;

  // Compute which guide units are on board and in shop
  const onBoard = guideUnits.filter(unit => boardUnitNames.includes(unit));
  const inShop = guideUnits.filter(unit => shopUnitNames.includes(unit));

  // Trait progress: for each trait in guideTraits, see how many we have on board
  const traitCountsOnBoard = computeTraitCounts(boardUnitNames);
  const traitProgress = guideTraits.map(trait => {
    // We need to know the threshold for this trait in the guide comp.
    // Since we don't have the full synergy data in activeGuideComp, we can approximate:
    // For now, we just show the count we have and the trait name.
    // A better approach would be to store the required count per trait in activeGuideComp.
    // However, for simplicity, we'll just show the current count and the trait.
    const countOnBoard = traitCountsOnBoard[trait] || 0;
    return { trait, count: countOnBoard };
  });

  // We can also compute missing units for the guide
  const missingUnits = guideUnits.filter(unit => !boardUnitNames.includes(unit));

  return (
    <div className="bg-[#1f1f1f]/90 border border-[#2a2a2a] rounded-lg p-2 space-y-2">
      <div className="flex items-center justify-between text-[10px] text-neutral-500 uppercase tracking-wider">
        <div className="flex items-center gap-1">
          <Hammer className="w-3 h-3 text-[#35c3e7]" />
          <span>Playing: {activeGuideComp.units.slice(0, 3).join(' + ')}</span>
        </div>
      </div>

      {/* Needed Units (with checkmarks for acquired) */}
      <div className="space-y-1">
        <div className="text-[9px] text-neutral-500">Needed Units:</div>
        <div className="space-y-0.5">
          {guideUnits.map((unit, index) => (
            <div key={index} className="flex items-center gap-1 text-[9px]">
              <span className={`w-3 h-3 flex items-center justify-center ${onBoard.includes(unit) ? 'text-[#35c3e7]' : 'text-neutral-500'}`}>
                {onBoard.includes(unit) ? '✓' : '✗'}
              </span>
              <span className="truncate">{unit}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Board Progress */}
      <div className="space-y-1">
        <div className="text-[9px] text-neutral-500">Board Progress:</div>
        <div className="flex items-center gap-1">
          <span className="text-[9px]">{onBoard.length}/{guideUnits.length} units</span>
          <div className="w-16 h-1.5 bg-[#2a2a2a]/50 rounded overflow-hidden">
            <div
              className="h-full bg-[#35c3e7]"
              style={{ width: `${(onBoard.length / guideUnits.length) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Trait Progress */}
      {guideTraits.length > 0 && (
        <div className="space-y-1">
          <div className="text-[9px] text-neutral-500">Trait Progress:</div>
          <div className="space-y-0.5">
            {traitProgress.map((tp, index) => (
              <div key={index} className="flex items-center gap-1 text-[9px]">
                <span className="w-4 h-4 flex items-center justify-center text-[#35c3e7]">{tp.count}</span>
                <span className="truncate">{tp.trait}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shop Units (highlighting guide units) */}
      <div className="space-y-1">
        <div className="text-[9px] text-neutral-500">Shop Units:</div>
        <div className="space-y-0.5 flex flex-wrap gap-1">
          {shopUnitNames.map((unit, index) => (
            <div
              key={index}
              className={`flex items-center gap-1 px-1 py-0.5 rounded border border-[#2a2a2a] ${inShop.includes(unit) ? 'border-[#35c3e7]' : ''}`}
            >
              <span className="w-3 h-3">{unit.length > 2 ? unit.slice(0, 2) : unit}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}