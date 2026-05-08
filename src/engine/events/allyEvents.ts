import type { TftGameState } from "@/types/tft";

export const ALLY_EVENT_KINDS = [
  "game_state_partial",
  "pipeline_gep_status",
  "pipeline_error",
  "capture_status",
] as const;

export type AllyEventKind = (typeof ALLY_EVENT_KINDS)[number];

/** Cross-window application events (IPC-derived and future internal sources). */
export type AllyAppEvent =
  | {
      kind: "game_state_partial";
      state: Partial<TftGameState>;
      timestampMs: number;
    }
  | {
      kind: "pipeline_gep_status";
      gepReady: boolean;
      lastError: string | null;
      timestampMs: number;
    }
  | {
      kind: "pipeline_error";
      code: string;
      message: string;
      timestampMs: number;
    }
  | {
      kind: "capture_status";
      running: boolean;
      framesThisSession: number;
      timestampMs: number;
    };
