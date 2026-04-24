/// <reference types="@overwolf/types" />

import { useAppStore } from "@/store/useAppStore";
import type { TftGameState } from "@/types/tft";

/**
 * Subscribe to full-state snapshots broadcast from the background controller.
 * Returns a cleanup function.
 *
 * Inside a renderer window (overlay / desktop) this wires
 * `overwolf.windows.onMessageReceived` into the Zustand store so any
 * React component can read the latest state without its own hook.
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

  const handleMessage = (msg: any) => {
    const payload = msg?.content ?? msg;
    if (!payload || typeof payload !== "object") return;

    if (payload.kind === "state" && payload.state) {
      useAppStore.getState().setGameState(payload.state as Partial<TftGameState>);
    }
  };

  ow.windows.onMessageReceived.addListener(handleMessage);
  return () => ow.windows.onMessageReceived.removeListener(handleMessage);
}
