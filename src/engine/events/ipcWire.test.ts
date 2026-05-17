import { describe, it, expect } from "vitest";
import {
  createIpcBackgroundErrorMessage,
  createIpcCaptureStatusMessage,
  createIpcGameStateMessage,
  createIpcGepStatusMessage,
  createIpcPersonalMatchMessage,
  createIpcPersonalMatchesHydrateMessage,
  isIpcBackgroundErrorMessage,
  isIpcCaptureStatusMessage,
  isIpcGameStateMessage,
  isIpcGepStatusMessage,
  isIpcPersonalMatchMessage,
  isIpcPersonalMatchesHydrateMessage,
  isIpcTftPayload,
  TFT_LIVE_CHANNEL,
} from "./ipcWire";
import { EMPTY_STATE } from "@/store/useAppStore";

describe("ipcWire", () => {
  it("TFT_LIVE_CHANNEL is stable", () => {
    expect(TFT_LIVE_CHANNEL).toBe("tft-overlay-live");
  });

  it("isIpcGameStateMessage accepts valid snapshot", () => {
    const msg = createIpcGameStateMessage(EMPTY_STATE);
    expect(isIpcGameStateMessage(msg)).toBe(true);
    expect(isIpcTftPayload(msg)).toBe(true);
  });

  it("isIpcGepStatusMessage accepts ready / error / omitted lastError", () => {
    expect(isIpcGepStatusMessage(createIpcGepStatusMessage(true, null))).toBe(true);
    expect(isIpcGepStatusMessage(createIpcGepStatusMessage(false, "x"))).toBe(true);
    expect(isIpcGepStatusMessage({ kind: "gep_status", ready: true })).toBe(true);
    expect(isIpcGepStatusMessage({ kind: "gep_status", ready: true, lastError: 1 })).toBe(false);
  });

  it("isIpcBackgroundErrorMessage validates fields", () => {
    const msg = createIpcBackgroundErrorMessage("c", "m");
    expect(isIpcBackgroundErrorMessage(msg)).toBe(true);
    expect(isIpcTftPayload(msg)).toBe(true);
    expect(isIpcBackgroundErrorMessage({ kind: "bg_error", code: "c", message: "m" })).toBe(false);
  });

  it("isIpcCaptureStatusMessage validates fields", () => {
    const msg = createIpcCaptureStatusMessage(true, 42);
    expect(isIpcCaptureStatusMessage(msg)).toBe(true);
    expect(isIpcTftPayload(msg)).toBe(true);
    expect(isIpcCaptureStatusMessage({ kind: "capture_status", running: true, framesThisSession: NaN })).toBe(
      false,
    );
  });

  it("rejects non-objects and wrong kind", () => {
    expect(isIpcGameStateMessage(null)).toBe(false);
    expect(isIpcGameStateMessage({ kind: "other", state: {} })).toBe(false);
    expect(isIpcGameStateMessage({ kind: "state", state: null })).toBe(false);
  });

  it("isIpcPersonalMatchMessage validates personal match rows", () => {
    const record = {
      id: "m1",
      createdAt: 1,
      placement: 3,
      units: [],
      items: [],
      augments: [],
      comp: null,
      duration: null,
      syncStatus: "pending" as const,
    };
    const msg = createIpcPersonalMatchMessage(record);
    expect(isIpcPersonalMatchMessage(msg)).toBe(true);
    expect(isIpcTftPayload(msg)).toBe(true);
    expect(isIpcPersonalMatchMessage({ kind: "personal_match", record: { id: "x" } })).toBe(false);
  });

  it("isIpcPersonalMatchesHydrateMessage validates hydrate batches", () => {
    const row = {
      id: "m1",
      createdAt: 1,
      placement: 4,
      units: [],
      items: [],
      augments: [],
      comp: null,
      duration: null,
    };
    const msg = createIpcPersonalMatchesHydrateMessage([row]);
    expect(isIpcPersonalMatchesHydrateMessage(msg)).toBe(true);
    expect(isIpcPersonalMatchesHydrateMessage({ kind: "personal_matches_hydrate", matches: [{}] })).toBe(
      false,
    );
  });
});
