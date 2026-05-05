import { create } from "zustand";
import type { TftGameState, BoardUnit } from "../types/tft";
import type { PlayerCard, RiotRegion, Match } from "../types/riot";
import { UNITS } from "../data/units";
import type { PersonalMatchRecord } from "../services/indexedDbService";

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
  matchStart: boolean;
  roundEnd: boolean;
  compUpdate: boolean;
  itemReminder: boolean;
}

export interface PrivacySettings {
  appearOnLeaderboard: boolean;
  shareMatchHistory: boolean;
}

export interface SavedComp {
  id: string;
  name: string;
  units: string[];
  timestamp: number;
}

export interface ActiveGuideComp {
  units: string[];
  traits: string[];
}

export interface OverlayPanels {
  compTracker: boolean;
  itemBuilder: boolean;
  augmentGuide: boolean;
  unitStats: boolean;
}

export interface AppState {
  gameState: TftGameState;
  windows: Record<string, string | null>;
  selectedPlayer: PlayerCard | null;
  recentSearches: RecentSearch[];
  selectedMatch: Match | null;
  settings: {
    region: RiotRegion;
    compFilters: CompFilters;
    dataPrefs: DataPreferences;
    notifications: NotificationPrefs;
    privacy: PrivacySettings;
    dataSource: 'live' | 'static';
    overlayOpacity: number;
    accentColor: string;
    density: 'compact' | 'comfortable';
    fontSize: number;
  };
  overlayPanels: OverlayPanels;
  favoriteComps: string[];
  savedComps: SavedComp[];
  activeGuideComp: ActiveGuideComp | null;
  guideModeEnabled: boolean;
  personalMatches: PersonalMatchRecord[];
  setGameState: (partial: Partial<TftGameState>) => void;
  resetGameState: () => void;
  setWindowId: (name: string, id: string | null) => void;
  setSelectedPlayer: (player: PlayerCard | null) => void;
  addRecentSearch: (search: RecentSearch) => void;
  setSettings: (settings: Partial<AppState['settings']>) => void;
  updateAccentColor: (color: string) => void;
  setSelectedMatch: (match: Match | null) => void;
  toggleOverlayPanel: (panel: keyof OverlayPanels) => void;
  setOverlayPanels: (panels: Partial<OverlayPanels>) => void;
  addFavoriteComp: (compName: string) => void;
  removeFavoriteComp: (compName: string) => void;
  setSavedComps: (comps: SavedComp[]) => void;
  addSavedComp: (comp: SavedComp) => void;
  removeSavedComp: (id: string) => void;
  loadSavedComp: (id: string) => void;
  setActiveGuideComp: (comp: ActiveGuideComp | null) => void;
  toggleGuideMode: (enabled: boolean) => void;
  setPersonalMatches: (matches: PersonalMatchRecord[]) => void;
  addPersonalMatch: (match: PersonalMatchRecord) => void;
  updatePersonalMatchSyncStatus: (id: string, status: PersonalMatchRecord['syncStatus'], syncedAt?: number) => void;
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
  augmentSlots: [],
  shopUnits: [],
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
  matchStart: true,
  roundEnd: true,
  compUpdate: true,
  itemReminder: false,
};

const DEFAULT_PRIVACY: PrivacySettings = {
  appearOnLeaderboard: false,
  shareMatchHistory: true,
};

const DEFAULT_OVERLAY_PANELS: OverlayPanels = {
  compTracker: true,
  itemBuilder: true,
  augmentGuide: false,
  unitStats: true,
};

const DEFAULT_SETTINGS = {
  region: 'euw1' as RiotRegion,
  compFilters: DEFAULT_COMP_FILTERS,
  dataPrefs: DEFAULT_DATA_PREFS,
  notifications: DEFAULT_NOTIFICATIONS,
  privacy: DEFAULT_PRIVACY,
  dataSource: 'static' as const,
  overlayOpacity: 90,
  accentColor: '#35c3e7',
  density: 'comfortable' as const,
  fontSize: 14,
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

function loadStoredSavedComps(): SavedComp[] {
  try {
    const raw = localStorage.getItem('tft-ally::saved-comps');
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

const STORED_SETTINGS = loadStoredSettings();
const STORED_SAVED_COMPS = loadStoredSavedComps();

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
    savedComps: STORED_SAVED_COMPS,
    activeGuideComp: null,
    guideModeEnabled: false,
    personalMatches: [],

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

    updateAccentColor: (color: string) =>
      set((s: AppState) => {
        const next = { settings: { ...s.settings, accentColor: color } };
        document.documentElement.style.setProperty('--color-ally-accent', color);
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

    setSavedComps: (comps: SavedComp[]) =>
      set(() => {
        try { localStorage.setItem('tft-ally::saved-comps', JSON.stringify(comps)); } catch { /* ignore */ }
        return { savedComps: comps };
      }),

    addSavedComp: (comp: SavedComp) =>
      set((s: AppState) => {
        const next = [...s.savedComps, comp];
        try { localStorage.setItem('tft-ally::saved-comps', JSON.stringify(next)); } catch { /* ignore */ }
        return { savedComps: next };
      }),

    removeSavedComp: (id: string) =>
      set((s: AppState) => {
        const next = s.savedComps.filter((c) => c.id !== id);
        try { localStorage.setItem('tft-ally::saved-comps', JSON.stringify(next)); } catch { /* ignore */ }
        return { savedComps: next };
      }),

    loadSavedComp: (id: string) =>
      set((s: AppState) => {
        const comp = s.savedComps.find((c) => c.id === id);
        if (!comp) return {};
        const boardUnits: BoardUnit[] = comp.units.map((name) => ({
          name,
          boardIndex: 0,
          x: 0,
          y: 0,
          starLevel: 1,
          items: [],
          location: 'board',
        }));
        const traitCounts: Record<string, number> = {};
        for (const unit of boardUnits) {
          const unitData = UNITS.find((u) => u.name === unit.name);
          if (!unitData) continue;
          for (const trait of unitData.traits) {
            traitCounts[trait] = (traitCounts[trait] || 0) + 1;
          }
        }
        const traits = Object.keys(traitCounts);
        return { activeGuideComp: { units: comp.units, traits } };
      }),

    setActiveGuideComp: (comp: ActiveGuideComp | null) =>
      set(() => ({ activeGuideComp: comp })),

    toggleGuideMode: (enabled: boolean) =>
      set(() => ({ guideModeEnabled: enabled })),

    setPersonalMatches: (matches: PersonalMatchRecord[]) =>
      set(() => ({ personalMatches: [...matches].sort((a, b) => b.createdAt - a.createdAt) })),

    addPersonalMatch: (match: PersonalMatchRecord) =>
      set((s: AppState) => ({
        personalMatches: [match, ...s.personalMatches.filter((m) => m.id !== match.id)]
          .sort((a, b) => b.createdAt - a.createdAt),
      })),

    updatePersonalMatchSyncStatus: (id: string, status: PersonalMatchRecord['syncStatus'], syncedAt?: number) =>
      set((s: AppState) => ({
        personalMatches: s.personalMatches.map((m) =>
          m.id === id
            ? { ...m, syncStatus: status, ...(syncedAt ? { syncedAt } : {}) }
            : m
        ),
      })),
  })
);
