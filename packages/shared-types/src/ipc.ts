import type { PersonalMatchUnitBuild } from "./personalMatch";

/**
 * Canonical Overwolf desktop IPC payloads on TFT_LIVE_CHANNEL.
 * Game state `state` is app-typed at the edge (GEP today; + vision fusion later).
 */
export const TFT_LIVE_CHANNEL = "tft-overlay-live" as const;

export type IpcGameStateMessage = {
  kind: "state";
  /** Interpreted as TftGameState in the TFT Ally app. */
  state: unknown;
};

export type IpcGepStatusMessage = {
  kind: "gep_status";
  ready: boolean;
  lastError: string | null;
};

export type IpcBackgroundErrorMessage = {
  kind: "bg_error";
  code: string;
  message: string;
  timestampMs: number;
};

export type IpcCaptureStatusMessage = {
  kind: "capture_status";
  running: boolean;
  framesThisSession: number;
};

/** Desktop → overlay/lobby: persisted coach aggregate (`PlayerMatchHistorySummary`). */
export type IpcCoachMatchHistoryMessage = {
  kind: "coach_match_history";
  summary: unknown;
};

export type IpcGameDataMessage = {
  kind: "game_data";
  data: unknown;
  source: "cdn" | "bundled";
};

/** Personal match row from IndexedDB / GEP match_end (app-typed at the edge). */
export interface PersonalMatchIpcRecord {
  id: string;
  summonerName?: string;
  region?: string;
  createdAt: number;
  timestamp?: number;
  syncedAt?: number;
  isSynced?: boolean;
  syncStatus?: "pending" | "synced" | "failed";
  placement: number | null;
  units: string[];
  items: string[];
  /** Items per champion when captured from end-of-game board. */
  unitBuilds?: PersonalMatchUnitBuild[];
  augments: string[];
  comp: string | null;
  compName?: string | null;
  duration?: number | null;
  source?: string;
  raw?: Record<string, unknown>;
}

export type IpcPersonalMatchMessage = {
  kind: "personal_match";
  record: PersonalMatchIpcRecord;
};

export type IpcPersonalMatchesHydrateMessage = {
  kind: "personal_matches_hydrate";
  matches: PersonalMatchIpcRecord[];
};

export type IpcTftPayload =
  | IpcGameStateMessage
  | IpcGepStatusMessage
  | IpcBackgroundErrorMessage
  | IpcCaptureStatusMessage
  | IpcPersonalMatchMessage
  | IpcPersonalMatchesHydrateMessage
  | IpcCoachMatchHistoryMessage
  | IpcGameDataMessage;
