import { describe, it, expect } from "vitest";
import {
  createIpcBackgroundErrorMessage,
  createIpcCaptureStatusMessage,
  createIpcCoachMatchHistoryMessage,
  createIpcGameStateMessage,
  createIpcGepStatusMessage,
  createIpcPersonalMatchMessage,
  isIpcBackgroundErrorMessage,
  isIpcCaptureStatusMessage,
  isIpcCoachMatchHistoryMessage,
  isIpcGameStateMessage,
  isIpcGepStatusMessage,
  isIpcPersonalMatchMessage,
  isIpcTftPayload,
  TFT_LIVE_CHANNEL,
} from "./ipcWire";
import { emptyPlayerMatchHistorySummary } from "@/engine/recommendations/historySummary";
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

  it("isIpcCoachMatchHistoryMessage validates summary shape", () => {
    const summary = emptyPlayerMatchHistorySummary();
    const msg = createIpcCoachMatchHistoryMessage(summary);
    expect(isIpcCoachMatchHistoryMessage(msg)).toBe(true);
    expect(isIpcTftPayload(msg)).toBe(true);
    expect(isIpcCoachMatchHistoryMessage({ kind: "coach_match_history", summary: null })).toBe(false);
    expect(isIpcCoachMatchHistoryMessage({ kind: "coach_match_history", summary: {} })).toBe(false);
  });

  it("isIpcPersonalMatchMessage validates match row", () => {
    const msg = createIpcPersonalMatchMessage({
      id: "m1",
      createdAt: 1,
      syncStatus: "pending",
      placement: 3,
      units: ["Aatrox"],
      items: [],
      augments: [],
      comp: null,
      compName: null,
      duration: null,
      source: "gep_match_end",
    });
    expect(isIpcPersonalMatchMessage(msg)).toBe(true);
    expect(isIpcTftPayload(msg)).toBe(true);
    expect(isIpcPersonalMatchMessage({ kind: "personal_match", match: { id: 1 } })).toBe(false);
  });

  it("rejects non-objects and wrong kind", () => {
    expect(isIpcGameStateMessage(null)).toBe(false);
    expect(isIpcGameStateMessage({ kind: "other", state: {} })).toBe(false);
    expect(isIpcGameStateMessage({ kind: "state", state: null })).toBe(false);
  });
});
