import { create } from "zustand";
import type { TftGameState } from "../types/tft";

// ── App-level shared state (replaces getMainWindow() shared-object pattern) ──
// Each Overwolf window has its own JS context, so this store is instantiated
// per-window. The background window holds the authoritative state; renderer
// windows (overlay / desktop) mirror it via IPC messages via sendMessage.

export interface AppState {
  gameState: TftGameState;
  windows: Record<string, string | null>;
  setGameState: (partial: Partial<TftGameState>) => void;
  resetGameState: () => void;
  setWindowId: (name: string, id: string | null) => void;
}

export const EMPTY_STATE: TftGameState = {
  isInGame: false,
  round_type: null,
  gold: null,
  shop_visible: false,
  roster: [],
  board: { units: [], grid: {} },
  activeCompTracker: { bestMatchName: null, matchPercentage: 0, missingUnits: [] },
  benchComponents: [],
  itemTracker: { craftable: [], missing: [] },
  raw: {},
};

export const useAppStore = create<AppState>(
  (set: (fn: (s: AppState) => Partial<AppState>) => void) => ({
    gameState: EMPTY_STATE,
    windows: {},

    setGameState: (partial: Partial<TftGameState>) =>
      set((s: AppState) => ({ gameState: { ...s.gameState, ...partial } })),

    resetGameState: () =>
      set(() => ({ gameState: EMPTY_STATE })),

    setWindowId: (name: string, id: string | null) =>
      set((s: AppState) => ({ windows: { ...s.windows, [name]: id } })),
  })
);
