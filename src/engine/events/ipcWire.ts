import type { TftGameState } from "@/types/tft";
import type {
  IpcBackgroundErrorMessage,
  IpcCaptureStatusMessage,
  IpcGameStateMessage,
  IpcGepStatusMessage,
  IpcTftPayload,
} from "@ally/shared-types";

export type {
  IpcBackgroundErrorMessage,
  IpcCaptureStatusMessage,
  IpcGameStateMessage,
  IpcGepStatusMessage,
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

export function isIpcTftPayload(payload: unknown): payload is IpcTftPayload {
  return (
    isIpcGameStateMessage(payload) ||
    isIpcGepStatusMessage(payload) ||
    isIpcBackgroundErrorMessage(payload) ||
    isIpcCaptureStatusMessage(payload)
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
