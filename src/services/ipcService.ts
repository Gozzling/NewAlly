/// <reference types="@overwolf/types" />

import {
  emitAllyEvent,
  isIpcBackgroundErrorMessage,
  isIpcCaptureStatusMessage,
  isIpcCoachMatchHistoryMessage,
  isIpcGameStateMessage,
  isIpcGepStatusMessage,
  isIpcPersonalMatchMessage,
  isIpcGameDataMessage,
} from "@/engine/events";
import { persistCachedCoachSummary } from "@/hooks/useCoachMatchHistory";
import type { PersonalMatchRecord } from "@/services/indexedDbService";
import { useAppStore } from "@/store/useAppStore";
import type { TftGameState } from "@/types/tft";
import type { PlayerMatchHistorySummary } from "@ally/shared-types";

/**
 * Subscribe to payloads broadcast from the background controller on `TFT_LIVE_CHANNEL`.
 * Updates Zustand and the Ally event bus. Returns a cleanup function.
 *
 * Inside a renderer window (overlay / desktop) this wires
 * `overwolf.windows.onMessageReceived` so React can read state from the store
 * or subscribe via RxJS (`gameStatePartial$`, `pipelineGepStatus$`, `captureStatus$`, etc.).
 */
export function subscribeToStateSnapshots(): () => void {
  const ow = (typeof window !== "undefined" ? (window as any).overwolf : undefined) as
    | undefined
    | {
        windows: {
          onMessageReceived: {
            addListener: (cb: (msg: any) => void) => void;
            removeListener: (cb: (msg: any) => void) => void;
          };
        };
      };

  if (!ow?.windows?.onMessageReceived) {
    return () => {};
  }

  const handleMessage = (msg: unknown) => {
    const raw = msg as { content?: unknown } | null | undefined;
    const payload = raw?.content ?? raw;

    if (isIpcPersonalMatchMessage(payload)) {
      useAppStore.getState().addPersonalMatch(payload.match as PersonalMatchRecord);
      return;
    }

    if (isIpcGameDataMessage(payload)) {
      useAppStore.getState().setGameData(payload.data as any, payload.source);
      return;
    }

    if (isIpcCoachMatchHistoryMessage(payload)) {
      const summary = payload.summary as PlayerMatchHistorySummary;
      useAppStore.getState().setCoachMatchHistory(summary);
      const app = useAppStore.getState();
      const region = app.settings.region;
      const puuid = app.selectedPlayer?.puuid;
      if (region && puuid) {
        persistCachedCoachSummary(region, puuid, summary);
      }
      return;
    }

    if (isIpcGameStateMessage(payload)) {
      const state = payload.state as TftGameState;
      useAppStore.getState().setGameState(state);
      emitAllyEvent({
        kind: "game_state_partial",
        state,
        timestampMs: Date.now(),
      });
      return;
    }

    if (isIpcGepStatusMessage(payload)) {
      const lastError = payload.lastError ?? null;
      useAppStore.getState().setPipelineGepStatus(payload.ready, lastError);
      emitAllyEvent({
        kind: "pipeline_gep_status",
        gepReady: payload.ready,
        lastError,
        timestampMs: Date.now(),
      });
      return;
    }

    if (isIpcBackgroundErrorMessage(payload)) {
      useAppStore.getState().setPipelineBackgroundError({
        code: payload.code,
        message: payload.message,
        atMs: payload.timestampMs,
      });
      emitAllyEvent({
        kind: "pipeline_error",
        code: payload.code,
        message: payload.message,
        timestampMs: payload.timestampMs,
      });
      return;
    }

    if (isIpcCaptureStatusMessage(payload)) {
      useAppStore.getState().setVisionCaptureStatus({
        running: payload.running,
        framesThisSession: payload.framesThisSession,
      });
      emitAllyEvent({
        kind: "capture_status",
        running: payload.running,
        framesThisSession: payload.framesThisSession,
        timestampMs: Date.now(),
      });
    }
  };

  ow.windows.onMessageReceived.addListener(handleMessage);
  return () => ow.windows.onMessageReceived.removeListener(handleMessage);
}
