/// <reference types="@overwolf/types" />

import type { PlayerMatchHistorySummary } from "@ally/shared-types";
import { TFT_LIVE_CHANNEL } from "@ally/shared-types";
import type { WindowName } from "@/types/overwolf";
import { getWindowId } from "./overwolfWindowService";

/** In-game HUD + lobby only (desktop runs Team Builder and writes localStorage separately). */
const PEERS: WindowName[] = ["overlay", "lobby"];

/**
 * Pushes a fresh coach aggregate to other renderer windows so the overlay picks it up even when
 * `storage` events are unreliable; idempotent on the receiver.
 */
export function broadcastCoachMatchHistorySummary(summary: PlayerMatchHistorySummary): void {
  const ow = typeof window !== "undefined" ? (window as { overwolf?: typeof overwolf }).overwolf : undefined;
  if (!ow?.windows?.sendMessage) return;
  const payload = { kind: "coach_match_history" as const, summary };
  for (const name of PEERS) {
    const id = getWindowId(name);
    if (!id) continue;
    try {
      ow.windows.sendMessage(id, TFT_LIVE_CHANNEL, payload, () => undefined);
    } catch {
      /* ignore */
    }
  }
}
