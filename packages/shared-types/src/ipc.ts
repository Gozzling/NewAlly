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

export type IpcTftPayload =
  | IpcGameStateMessage
  | IpcGepStatusMessage
  | IpcBackgroundErrorMessage
  | IpcCaptureStatusMessage;
