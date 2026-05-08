import type { Unit } from "@/data/units";
import { ITEM_RECIPES } from "@/data/itemRecipes";
import { META_COMPS } from "@/data/metaComps";
import { calculateBestCompMatch, calculateItemCrafting } from "@/shared/gameEngine";
import { EMPTY_STATE } from "@/store/useAppStore";
import type { BoardState, BoardUnit, TftGameState } from "@/types/tft";
import { unitMatchKey } from "@/utils/unitDisplay";

/**
 * Maps Team Builder hex board → minimal {@link TftGameState} for `toNormalizedSignals` / recommendation engine.
 */
export function buildGameStateFromBoard(pBoard: (string | null)[], units: readonly Unit[]): TftGameState {
  const allowed = new Set(units.map((u) => unitMatchKey(u.name)));

  const boardUnits: BoardUnit[] = [];
  const grid: BoardState["grid"] = {};

  for (let idx = 0; idx < pBoard.length; idx++) {
    const raw = pBoard[idx];
    if (raw == null || raw === "") continue;
    if (!allowed.has(unitMatchKey(raw))) continue;

    const x = idx % 7;
    const y = Math.floor(idx / 7);
    const canonical =
      units.find((un) => unitMatchKey(un.name) === unitMatchKey(raw))?.name ?? raw;
    const u: BoardUnit = {
      name: canonical,
      boardIndex: idx,
      x,
      y,
      starLevel: 1,
      items: [],
      location: "board",
    };
    boardUnits.push(u);
    grid[`${x},${y}`] = u;
  }

  const activeCompTracker = calculateBestCompMatch(boardUnits, META_COMPS);
  const itemTracker = calculateItemCrafting(
    activeCompTracker.bestMatchName,
    boardUnits,
    [],
    META_COMPS,
    ITEM_RECIPES,
  );

  return {
    ...EMPTY_STATE,
    isInGame: true,
    round_type: "planning",
    gold: 0,
    shop_visible: false,
    shopUnits: [],
    roster: [
      {
        name: "Planner",
        health: 100,
        isLocalPlayer: true,
        isEliminated: false,
        rank: 1,
      },
    ],
    board: { units: boardUnits, grid },
    activeCompTracker,
    benchComponents: [],
    itemTracker,
    augmentSlots: [],
    raw: { source: "team_builder" },
  };
}
