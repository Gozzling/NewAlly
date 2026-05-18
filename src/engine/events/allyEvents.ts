import type { TftGameState } from "@/types/tft";

export const ALLY_EVENT_KINDS = [
  "game_state_partial",
  "pipeline_gep_status",
  "pipeline_error",
  "capture_status",
  "augment_unresolved",
  "entity_unresolved",
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
    }
  | {
      kind: "augment_unresolved";
      identifier: string;
      source: string;
      patch: string;
      set: number;
      context: string | null;
      timestampMs: number;
    }
  | {
      kind: "entity_unresolved";
      entityType: string;
      identifier: string;
      source: string;
      patch: string;
      set: number;
      context: string | null;
      timestampMs: number;
    };
