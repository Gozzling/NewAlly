import type { NormalizedGameSignals } from "@ally/shared-types";
import type { TftGameState } from "@/types/tft";

export function toNormalizedSignals(gs: TftGameState): NormalizedGameSignals {
  const lp = gs.roster.find((p) => p.isLocalPlayer);
  return {
    inGame: gs.isInGame,
    roundType: gs.round_type,
    gold: gs.gold,
    boardUnitNames: gs.board.units.map((u) => u.name),
    shopUnitNames: [...gs.shopUnits],
    benchComponentCount: gs.benchComponents.length,
    activeCompName: gs.activeCompTracker.bestMatchName,
    compMatchPercent: gs.activeCompTracker.matchPercentage,
    missingUnitsForComp: [...gs.activeCompTracker.missingUnits],
    augmentNames: [...gs.augmentSlots],
    localPlayerHealth: lp ? lp.health : null,
    itemCraftableCount: gs.itemTracker.craftable.length,
    itemMissingCount: gs.itemTracker.missing.length,
    craftableLabels: gs.itemTracker.craftable
      .slice(0, 8)
      .map((c) => `${c.item} → ${c.carry}`),
    missingLabels: gs.itemTracker.missing.slice(0, 8).map((m) => m.item),
    partialItemBuildLabels: gs.itemTracker.missing
      .filter((m) => m.missingComponents.length === 1)
      .map((m) => m.item)
      .slice(0, 8),
  };
}
