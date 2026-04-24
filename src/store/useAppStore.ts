import { create } from "zustand";
import type { TftGameState } from "../types/tft";
import type { PlayerCard, RiotRegion, Match } from "../types/riot";

export interface RecentSearch {
  name: string;
  region: string;
  date: number;
}

export interface CompFilters {
  minWinRate: number;
  maxWinRate: number;
  minPickRate: number;
  maxPickRate: number;
  difficulty: 'all' | 'easy' | 'medium' | 'hard';
}

export interface DataPreferences {
  cacheDuration: number; // hours
  autoRefresh: boolean;
  autoRefreshInterval: number; // minutes
}

export interface NotificationPrefs {
  patchNotes: boolean;
  compTierBump: boolean;
  friendOnline: boolean;
}

export interface PrivacySettings {
  appearOnLeaderboard: boolean;
  shareMatchHistory: boolean;
}

export interface OverlayPanels {
  comps: boolean;
  boardScanner: boolean;
  shopAdvisor: boolean;
  itemSheet: boolean;
  damageCalc: boolean;
  opponentTracker: boolean;
  stageTimer: boolean;
  augmentAdvisor: boolean;
  miniLeaderboard: boolean;
}

export interface AppState {
  gameState: TftGameState;
  windows: Record<string, string | null>;
  selectedPlayer: PlayerCard | null;
  recentSearches: RecentSearch[];
  selectedMatch: Match | null;
  settings: {
    region: RiotRegion;
    theme: 'dark' | 'light';
    compFilters: CompFilters;
    dataPrefs: DataPreferences;
    notifications: NotificationPrefs;
    privacy: PrivacySettings;
  };
  overlayPanels: OverlayPanels;
  favoriteComps: string[];
  setGameState: (partial: Partial<TftGameState>) => void;
  resetGameState: () => void;
  setWindowId: (name: string, id: string | null) => void;
  setSelectedPlayer: (player: PlayerCard | null) => void;
  addRecentSearch: (search: RecentSearch) => void;
  setSettings: (settings: Partial<AppState['settings']>) => void;
  setSelectedMatch: (match: Match | null) => void;
  toggleOverlayPanel: (panel: keyof OverlayPanels) => void;
  setOverlayPanels: (panels: Partial<OverlayPanels>) => void;
  addFavoriteComp: (compName: string) => void;
  removeFavoriteComp: (compName: string) => void;
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

const DEFAULT_COMP_FILTERS: CompFilters = {
  minWinRate: 0,
  maxWinRate: 100,
  minPickRate: 0,
  maxPickRate: 100,
  difficulty: 'all',
};

const DEFAULT_DATA_PREFS: DataPreferences = {
  cacheDuration: 1,
  autoRefresh: false,
  autoRefreshInterval: 5,
};

const DEFAULT_NOTIFICATIONS: NotificationPrefs = {
  patchNotes: true,
  compTierBump: true,
  friendOnline: false,
};

const DEFAULT_PRIVACY: PrivacySettings = {
  appearOnLeaderboard: false,
  shareMatchHistory: true,
};

const DEFAULT_OVERLAY_PANELS: OverlayPanels = {
  comps: true,
  boardScanner: false,
  shopAdvisor: false,
  itemSheet: true,
  damageCalc: false,
  opponentTracker: false,
  stageTimer: false,
  augmentAdvisor: false,
  miniLeaderboard: false,
};

const DEFAULT_SETTINGS = {
  region: 'euw1' as RiotRegion,
  theme: 'dark' as const,
  compFilters: DEFAULT_COMP_FILTERS,
  dataPrefs: DEFAULT_DATA_PREFS,
  notifications: DEFAULT_NOTIFICATIONS,
  privacy: DEFAULT_PRIVACY,
};

function loadStoredSettings(): typeof DEFAULT_SETTINGS {
  try {
    const raw = localStorage.getItem('tft-ally::settings');
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return DEFAULT_SETTINGS;
}

function loadStoredFavorites(): string[] {
  try {
    const raw = localStorage.getItem('tft-ally::favorite-comps');
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

const STORED_SETTINGS = loadStoredSettings();

export const useAppStore = create<AppState>(
  (set: (fn: (s: AppState) => Partial<AppState>) => void) => ({
    gameState: EMPTY_STATE,
    windows: {},
    selectedPlayer: null,
    recentSearches: [],
    selectedMatch: null,
    settings: STORED_SETTINGS,
    overlayPanels: DEFAULT_OVERLAY_PANELS,
    favoriteComps: loadStoredFavorites(),

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
      set((s: AppState) => {
        const next = { settings: { ...s.settings, ...partial } };
        try { localStorage.setItem('tft-ally::settings', JSON.stringify(next.settings)); } catch { /* ignore */ }
        return next;
      }),

    setSelectedMatch: (match: Match | null) =>
      set(() => ({ selectedMatch: match })),

    toggleOverlayPanel: (panel: keyof OverlayPanels) =>
      set((s: AppState) => ({
        overlayPanels: { ...s.overlayPanels, [panel]: !s.overlayPanels[panel] },
      })),

    setOverlayPanels: (panels: Partial<OverlayPanels>) =>
      set((s: AppState) => ({
        overlayPanels: { ...s.overlayPanels, ...panels },
      })),

    addFavoriteComp: (compName: string) =>
      set((s: AppState) => {
        const next = [...new Set([...s.favoriteComps, compName])];
        try { localStorage.setItem('tft-ally::favorite-comps', JSON.stringify(next)); } catch { /* ignore */ }
        return { favoriteComps: next };
      }),

    removeFavoriteComp: (compName: string) =>
      set((s: AppState) => {
        const next = s.favoriteComps.filter((c) => c !== compName);
        try { localStorage.setItem('tft-ally::favorite-comps', JSON.stringify(next)); } catch { /* ignore */ }
        return { favoriteComps: next };
      }),
  })
);
