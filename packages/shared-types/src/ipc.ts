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
  data: unknown; // TFTSetData
  source: "cdn" | "bundled";
};

/** Slim personal match row for coach / analytics (no `raw` blob). Synced to desktop & overlay after GEP match end. */
export type IpcPersonalMatchMessage = {
  kind: "personal_match";
  match: {
    id: string;
    createdAt: number;
    timestamp?: number;
    summonerName?: string;
    region?: string;
    syncedAt?: number;
    isSynced?: boolean;
    syncStatus: "pending" | "synced" | "failed";
    placement: number | null;
    units: string[];
    items: string[];
    augments: string[];
    comp: string | null;
    compName?: string | null;
    duration: number | null;
    source: "gep_match_end";
  };
};

export type IpcTftPayload =
  | IpcGameStateMessage
  | IpcGepStatusMessage
  | IpcBackgroundErrorMessage
  | IpcCaptureStatusMessage
  | IpcPersonalMatchMessage
  | IpcCoachMatchHistoryMessage
  | IpcGameDataMessage;
