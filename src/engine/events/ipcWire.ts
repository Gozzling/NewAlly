import type { TftGameState } from "@/types/tft";
import type {
  IpcBackgroundErrorMessage,
  IpcCaptureStatusMessage,
  IpcCoachMatchHistoryMessage,
  IpcGameStateMessage,
  IpcGepStatusMessage,
  IpcPersonalMatchMessage,
  IpcGameDataMessage,
  IpcTftPayload,
} from "@ally/shared-types";

export type {
  IpcBackgroundErrorMessage,
  IpcCaptureStatusMessage,
  IpcCoachMatchHistoryMessage,
  IpcGameStateMessage,
  IpcGepStatusMessage,
  IpcPersonalMatchMessage,
  IpcGameDataMessage,
  IpcTftPayload,
} from "@ally/shared-types";
export { TFT_LIVE_CHANNEL } from "@ally/shared-types";

export function isIpcGameStateMessage(payload: unknown): payload is IpcGameStateMessage {
  if (!payload || typeof payload !== "object") return false;
  const p = payload as Record<string, unknown>;
  return p.kind === "state" && p.state !== null && typeof p.state === "object";
}

export function isIpcGepStatusMessage(payload: unknown): payload is IpcGepStatusMessage {
  if (!payload || typeof payload !== "object") return false;
  const p = payload as Record<string, unknown>;
  if (p.kind !== "gep_status") return false;
  if (typeof p.ready !== "boolean") return false;
  if (p.lastError != null && typeof p.lastError !== "string") return false;
  return true;
}

export function isIpcBackgroundErrorMessage(payload: unknown): payload is IpcBackgroundErrorMessage {
  if (!payload || typeof payload !== "object") return false;
  const p = payload as Record<string, unknown>;
  return (
    p.kind === "bg_error" &&
    typeof p.code === "string" &&
    typeof p.message === "string" &&
    typeof p.timestampMs === "number"
  );
}

export function isIpcCaptureStatusMessage(payload: unknown): payload is IpcCaptureStatusMessage {
  if (!payload || typeof payload !== "object") return false;
  const p = payload as Record<string, unknown>;
  return (
    p.kind === "capture_status" &&
    typeof p.running === "boolean" &&
    typeof p.framesThisSession === "number" &&
    Number.isFinite(p.framesThisSession)
  );
}

export function isIpcCoachMatchHistoryMessage(payload: unknown): payload is IpcCoachMatchHistoryMessage {
  if (!payload || typeof payload !== "object") return false;
  const p = payload as Record<string, unknown>;
  if (p.kind !== "coach_match_history") return false;
  const s = p.summary;
  if (!s || typeof s !== "object") return false;
  const o = s as Record<string, unknown>;
  return typeof o.windowSize === "number";
}

export function isIpcPersonalMatchMessage(payload: unknown): payload is IpcPersonalMatchMessage {
  if (!payload || typeof payload !== "object") return false;
  const p = payload as Record<string, unknown>;
  if (p.kind !== "personal_match") return false;
  const m = p.match;
  if (!m || typeof m !== "object") return false;
  const row = m as Record<string, unknown>;
  if (typeof row.id !== "string" || typeof row.createdAt !== "number") return false;
  if (!Array.isArray(row.units) || !row.units.every((u) => typeof u === "string")) return false;
  if (row.placement != null && typeof row.placement !== "number") return false;
  if (!Array.isArray(row.items) || !Array.isArray(row.augments)) return false;
  if (!["pending", "synced", "failed"].includes(String(row.syncStatus))) return false;
  if (row.source !== "gep_match_end") return false;
  return true;
}

export function isIpcGameDataMessage(payload: unknown): payload is IpcGameDataMessage {
  if (!payload || typeof payload !== "object") return false;
  const p = payload as Record<string, unknown>;
  return p.kind === "game_data" && p.data != null && (p.source === "cdn" || p.source === "bundled");
}

export function isIpcTftPayload(payload: unknown): payload is IpcTftPayload {
  return (
    isIpcGameStateMessage(payload) ||
    isIpcGepStatusMessage(payload) ||
    isIpcBackgroundErrorMessage(payload) ||
    isIpcCaptureStatusMessage(payload) ||
    isIpcPersonalMatchMessage(payload) ||
    isIpcCoachMatchHistoryMessage(payload) ||
    isIpcGameDataMessage(payload)
  );
}

export function createIpcGameStateMessage(state: TftGameState): IpcGameStateMessage {
  return { kind: "state", state };
}

export function createIpcGepStatusMessage(ready: boolean, lastError: string | null): IpcGepStatusMessage {
  return { kind: "gep_status", ready, lastError };
}

export function createIpcBackgroundErrorMessage(code: string, message: string): IpcBackgroundErrorMessage {
  return { kind: "bg_error", code, message, timestampMs: Date.now() };
}

export function createIpcCaptureStatusMessage(
  running: boolean,
  framesThisSession: number,
): IpcCaptureStatusMessage {
  return { kind: "capture_status", running, framesThisSession };
}

export function createIpcPersonalMatchMessage(match: IpcPersonalMatchMessage["match"]): IpcPersonalMatchMessage {
  return { kind: "personal_match", match };
}

export function createIpcCoachMatchHistoryMessage(summary: unknown): IpcCoachMatchHistoryMessage {
  return { kind: "coach_match_history", summary };
}

export function createIpcGameDataMessage(data: unknown, source: "cdn" | "bundled"): IpcGameDataMessage {
  return { kind: "game_data", data, source };
}
