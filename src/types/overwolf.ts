// ── Overwolf window / game types ───────────────────────────────────────────

export interface LiveUnit {
  championId: string;
  starLevel: 1 | 2 | 3 | 4;
  items: string[];
  position: { x: number; y: number };
}

export interface GodFavor {
  godName: string;
  offeringsTaken: number;
}

export interface LiveState {
  stage: string;
  hp: number;
  gold: number;
  level: number;
  activeAugments: string[];
  benchComponents: string[];
  boardUnits: LiveUnit[];
  benchUnits: LiveUnit[];
  godsPicked: string[];
  godFavor: GodFavor[];
}

export interface TftGameState {
  isInGame: boolean;
  currentStage: string;
  playerHealth: number;
  offeredAugments: string[];
  localPlayer: {
    summonerName: string;
    tagline?: string;
    region?: string;
  } | null;
  isLoading: boolean;
  error: string | null;
}

// Messages broadcast between windows via overwolf.windows.sendMessage
export type BridgeMessage =
  | { kind: "info"; feature: string; info: Record<string, unknown> }
  | { kind: "event"; name: string; data: unknown }
  | { kind: "game-state"; isRunning: boolean }
  | { kind: "window-control"; action: "show" | "hide" | "close" | "minimize" | "restore"; windowName: string };

// Overwolf window descriptor helpers
export type WindowName = "background" | "overlay" | "desktop";
