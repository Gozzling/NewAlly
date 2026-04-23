import { create } from "zustand";
import type { TftGameState } from "../types/tft";
import type { PlayerCard, RiotRegion } from "../types/riot";

// ── App-level shared state (replaces getMainWindow() shared-object pattern) ──
// Each Overwolf window has its own JS context, so this store is instantiated
// per-window. The background window holds the authoritative state; renderer
// windows (overlay / desktop) mirror it via IPC messages via sendMessage.

export interface RecentSearch {
  name: string;
  region: string;
  date: number;
}

export interface AppState {
  gameState: TftGameState;
  windows: Record<string, string | null>;
  selectedPlayer: PlayerCard | null;
  recentSearches: RecentSearch[];
  settings: {
    region: RiotRegion;
    theme: 'dark' | 'light';
  };
  setGameState: (partial: Partial<TftGameState>) => void;
  resetGameState: () => void;
  setWindowId: (name: string, id: string | null) => void;
  setSelectedPlayer: (player: PlayerCard | null) => void;
  addRecentSearch: (search: RecentSearch) => void;
  setSettings: (settings: Partial<AppState['settings']>) => void;
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

const DEFAULT_SETTINGS = {
  region: 'euw1' as RiotRegion,
  theme: 'dark' as const,
}

export const useAppStore = create<AppState>(
  (set: (fn: (s: AppState) => Partial<AppState>) => void) => ({
    gameState: EMPTY_STATE,
    windows: {},
    selectedPlayer: null,
    recentSearches: [],
    settings: DEFAULT_SETTINGS,

    setGameState: (partial: Partial<TftGameState>) =>
      set((s: AppState) => ({ gameState: { ...s.gameState, ...partial } })),

    resetGameState: () =>
      set(() => ({ gameState: EMPTY_STATE })),

    setWindowId: (name: string, id: string | null) =>
      set((s: AppState) => ({ windows: { ...s.windows, [name]: id } })),

    setSelectedPlayer: (player: PlayerCard | null) =>
      set(() => ({ selectedPlayer: player })),

    addRecentSearch: (search: RecentSearch) =>
      set((s: AppState) => ({
        recentSearches: [search, ...s.recentSearches.filter((r) => r.name !== search.name)].slice(0, 10),
      })),

    setSettings: (partial: Partial<AppState['settings']>) =>
      set((s: AppState) => ({ settings: { ...s.settings, ...partial } })),
  })
);
