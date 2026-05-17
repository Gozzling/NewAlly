import type { TftGameState } from "@/types/tft";
import type {
  IpcBackgroundErrorMessage,
  IpcCaptureStatusMessage,
  IpcCoachMatchHistoryMessage,
  IpcGameDataMessage,
  IpcGameStateMessage,
  IpcGepStatusMessage,
  IpcPersonalMatchMessage,
  IpcPersonalMatchesHydrateMessage,
  IpcTftPayload,
  PersonalMatchIpcRecord,
} from "@ally/shared-types";
import { isPersonalMatchIpcRecord } from "./personalMatchGuard";

export type {
  IpcBackgroundErrorMessage,
  IpcCaptureStatusMessage,
  IpcCoachMatchHistoryMessage,
  IpcGameDataMessage,
  IpcGameStateMessage,
  IpcGepStatusMessage,
  IpcPersonalMatchMessage,
  IpcPersonalMatchesHydrateMessage,
  IpcTftPayload,
  PersonalMatchIpcRecord,
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
  if (isPersonalMatchIpcRecord(p.record)) return true;
  const legacy = p.match;
  if (!legacy || typeof legacy !== "object") return false;
  const row = legacy as Record<string, unknown>;
  return typeof row.id === "string" && typeof row.createdAt === "number";
}

export function isIpcPersonalMatchesHydrateMessage(
  payload: unknown,
): payload is IpcPersonalMatchesHydrateMessage {
  if (!payload || typeof payload !== "object") return false;
  const p = payload as Record<string, unknown>;
  if (p.kind !== "personal_matches_hydrate" || !Array.isArray(p.matches)) return false;
  return p.matches.every(isPersonalMatchIpcRecord);
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
    isIpcPersonalMatchesHydrateMessage(payload) ||
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

export function createIpcPersonalMatchMessage(
  record: PersonalMatchIpcRecord,
): IpcPersonalMatchMessage {
  return { kind: "personal_match", record };
}

export function createIpcPersonalMatchesHydrateMessage(
  matches: PersonalMatchIpcRecord[],
): IpcPersonalMatchesHydrateMessage {
  return { kind: "personal_matches_hydrate", matches };
}

export function createIpcCoachMatchHistoryMessage(summary: unknown): IpcCoachMatchHistoryMessage {
  return { kind: "coach_match_history", summary };
}

export function createIpcGameDataMessage(data: unknown, source: "cdn" | "bundled"): IpcGameDataMessage {
  return { kind: "game_data", data, source };
}
