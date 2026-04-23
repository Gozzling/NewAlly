/// <reference types="@overwolf/types" />

import { useAppStore, EMPTY_STATE } from "../store/useAppStore";
import {
  parseRoster,
  parseBoard,
  parseBenchComponents,
  calculateBestCompMatch,
  calculateItemCrafting,
} from "../shared/gameEngine";
import type { MetaComp, ItemRecipes, TftGameState } from "../types/tft";
import { openWindow, hideWindow, getWindowId } from "./overwolfWindowService";

const TFT_CLASS_ID = 21570;
const GEP_RETRY_DELAY = 2000;
const GEP_MAX_RETRIES = 10;
const REQUIRED_FEATURES = [
  "game_info", "match_info", "active_player", "board", "shop", "roster", "items",
];

let gepRetries = 0;
let metaComps: MetaComp[] = [];
let itemRecipes: ItemRecipes = {};
let overlayId: string | null = null;
let desktopId: string | null = null;

// ── Helpers ──────────────────────────────────────────────────────────────────

function isTft(id: number): boolean {
  return Math.floor(id / 10) === TFT_CLASS_ID;
}

function notify(state: TftGameState): void {
  if (overlayId) {
    overwolf.windows.sendMessage(overlayId, "tft-overlay-live", { kind: "state", state }, () => void 0);
  }
  if (desktopId) {
    overwolf.windows.sendMessage(desktopId, "tft-overlay-live", { kind: "state", state }, () => void 0);
  }
}

function setState(partial: Partial<TftGameState>): void {
  useAppStore.getState().setGameState(partial);
  notify({ ...useAppStore.getState().gameState, ...partial });
}

function resetState(): void {
  useAppStore.getState().resetGameState();
  notify(EMPTY_STATE);
}

function recalcItems(): void {
  const gs = useAppStore.getState().gameState;
  const itemTracker = calculateItemCrafting(
    gs.activeCompTracker.bestMatchName,
    gs.board.units,
    gs.benchComponents,
    metaComps,
    itemRecipes,
  );
  setState({ itemTracker });
}

// ── GEP ──────────────────────────────────────────────────────────────────────

function setupGep(): void {
  gepRetries = 0;
  tryRegister();
}

function tryRegister(): void {
  overwolf.games.events.setRequiredFeatures(REQUIRED_FEATURES, (r: any) => {
    if (r.status !== "success") {
      if (gepRetries < GEP_MAX_RETRIES) {
        console.warn(`[BG] GEP retry ${++gepRetries}/${GEP_MAX_RETRIES}`);
        setTimeout(tryRegister, GEP_RETRY_DELAY);
      } else {
        console.error("[BG] GEP registration failed:", r.error);
      }
      return;
    }
    gepRetries = 0;
    console.log("[BG] GEP registered:", REQUIRED_FEATURES);
  });
}

function onInfoUpdates(event: any): void {
  const feature = event?.feature as string | undefined;
  const info = event?.info as Record<string, unknown>;
  if (!feature) return;

  const gs = useAppStore.getState().gameState;
  const nextRaw = { ...gs.raw, [feature]: info };

  switch (feature) {
    case "active_player": {
      const gold = (info?.active_player as Record<string, unknown>)?.gold;
      if (gold !== undefined) setState({ gold: Number(gold), raw: nextRaw });
      break;
    }
    case "match_info": {
      const rt = (info?.match_info as Record<string, unknown>)?.round_type;
      if (rt !== undefined) setState({ round_type: String(rt), raw: nextRaw });
      break;
    }
    case "shop": {
      const sv = (info?.shop as Record<string, unknown>)?.shop_visible;
      if (sv !== undefined) setState({ shop_visible: Boolean(sv), raw: nextRaw });
      break;
    }
    case "roster": {
      const parsed = parseRoster(info?.roster);
      if (parsed.length > 0) setState({ roster: parsed, raw: nextRaw });
      break;
    }
    case "board": {
      const parsed = parseBoard(info?.board);
      const activeCompTracker = calculateBestCompMatch(parsed.units, metaComps);
      setState({ board: parsed, activeCompTracker, raw: nextRaw });
      recalcItems();
      break;
    }
    case "items": {
      const benchComponents = parseBenchComponents(info?.items);
      setState({ benchComponents, raw: nextRaw });
      recalcItems();
      break;
    }
    default:
      setState({ raw: nextRaw });
  }
}

function onNewEvents(payload: any): void {
  for (const event of (payload?.events ?? []) as Array<{ name: string }>) {
    switch (event.name) {
      case "match_start":
        setState({ isInGame: true });
        showOverlay();
        break;
      case "match_end":
        hideOverlay();
        resetState();
        showDesktop();
        break;
    }
  }
}

function onGameInfoUpdated(e: any): void {
  if (!e?.gameInfo) return;
  const gameIsTft = isTft(Number(e.gameInfo.id));
  const isRunning = Boolean(e.gameInfo.isRunning);
  const gs = useAppStore.getState().gameState;

  if (gameIsTft && isRunning) {
    console.log("[BG] TFT running");
    setState({ isInGame: true });
    showOverlay();
    setupGep();
  } else if (!isRunning && gs.isInGame) {
    console.log("[BG] TFT closed");
    hideOverlay();
    resetState();
    showDesktop();
  }
}

// ── Window helpers ───────────────────────────────────────────────────────────

async function showOverlay(): Promise<void> {
  overlayId = getWindowId("overlay");
  if (!overlayId) {
    await openWindow("overlay");
    overlayId = getWindowId("overlay");
  }
}

function hideOverlay(): void {
  hideWindow("overlay");
}

async function showDesktop(): Promise<void> {
  desktopId = getWindowId("desktop");
  if (!desktopId) {
    await openWindow("desktop");
    desktopId = getWindowId("desktop");
  }
}

// ── Init ─────────────────────────────────────────────────────────────────────

export async function initBackgroundController(): Promise<void> {
  console.log("[BG] TFT Companion starting...");

  try {
    const [comps, recipes] = await Promise.all([
      fetch("./metaComps.json").then((r) => r.json()),
      fetch("./itemRecipes.json").then((r) => r.json()),
    ]);
    metaComps = Array.isArray(comps) ? (comps as MetaComp[]) : [];
    itemRecipes = recipes && typeof recipes === "object" ? (recipes as ItemRecipes) : {};
    console.log("[BG] Loaded", metaComps.length, "comps,", Object.keys(itemRecipes).length, "recipes");
  } catch (err) {
    console.error("[BG] Data load failed:", err);
  }

  overwolf.games.events.onInfoUpdates2.addListener(onInfoUpdates);
  overwolf.games.events.onNewEvents.addListener(onNewEvents);
  overwolf.games.onGameInfoUpdated.addListener(onGameInfoUpdated);

  // Pre-obtain window ids
  const overlay = getWindowId("overlay");
  if (!overlay) await openWindow("overlay");
  overlayId = getWindowId("overlay");

  const desktop = getWindowId("desktop");
  if (!desktop) await openWindow("desktop");
  desktopId = getWindowId("desktop");

  overwolf.games.getRunningGameInfo((gameInfo: any) => {
    if (gameInfo && isTft(gameInfo.id)) {
      console.log("[BG] TFT already running");
      setState({ isInGame: true });
      showOverlay();
      setupGep();
    } else {
      showDesktop();
    }
  });
}
