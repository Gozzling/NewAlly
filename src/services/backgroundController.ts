/// <reference types="@overwolf/types" />

import { useAppStore, EMPTY_STATE } from "@/store/useAppStore";
import {
  parseRoster,
  parseBoard,
  parseBenchComponents,
  calculateBestCompMatch,
  calculateItemCrafting,
} from "@/shared/gameEngine";
import type { MetaComp, ItemRecipes, TftGameState } from "@/types/tft";
import { openWindow, hideWindow, getWindowId } from "./overwolfWindowService";
import { GeppService } from "./geppService";

const TFT_CLASS_ID = 21570;
const REQUIRED_FEATURES = [
  "game_info", "match_info", "active_player", "board", "shop", "roster", "items",
];

let metaComps: MetaComp[] = [];
let itemRecipes: ItemRecipes = {};
let overlayId: string | null = null;
let lobbyId: string | null = null;
let desktopId: string | null = null;
let geppService: GeppService | null = null;

// ── Helpers ──────────────────────────────────────────────────────────────────

function isTft(id: number): boolean {
  return Math.floor(id / 10) === TFT_CLASS_ID;
}

function notify(state: TftGameState): void {
  if (overlayId) {
    overwolf.windows.sendMessage(overlayId, "tft-overlay-live", { kind: "state", state }, () => void 0);
  }
  if (lobbyId) {
    overwolf.windows.sendMessage(lobbyId, "tft-overlay-live", { kind: "state", state }, () => void 0);
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

// ── GEP via GeppService ────────────────────────────────────────────────────

function setupGepService(): void {
  geppService = new GeppService();
  geppService.register(REQUIRED_FEATURES);

  // Info updates
  geppService.onInfoUpdate("active_player", (info) => {
    const gs = useAppStore.getState().gameState;
    const activePlayer = info?.active_player as Record<string, unknown> | undefined;
    const gold = activePlayer?.gold;
    const augmentSlotsRaw = activePlayer?.augmentSlots;
    const augmentSlots = Array.isArray(augmentSlotsRaw) ? augmentSlotsRaw.map(String) : [];
    if (gold !== undefined || augmentSlots.length > 0) {
      setState({
        gold: gold !== undefined ? Number(gold) : gs.gold,
        augmentSlots,
        raw: { ...gs.raw, active_player: info },
      });
    }
  });

  geppService.onInfoUpdate("match_info", (info) => {
    const rt = (info?.match_info as Record<string, unknown>)?.round_type;
    if (rt !== undefined) {
      setState({ round_type: String(rt), raw: { ...useAppStore.getState().gameState.raw, match_info: info } });
    }
  });

  geppService.onInfoUpdate("shop", (info) => {
    const sv = (info?.shop as Record<string, unknown>)?.shop_visible;
    if (sv !== undefined) {
      setState({ shop_visible: Boolean(sv), raw: { ...useAppStore.getState().gameState.raw, shop: info } });
    }
  });

  geppService.onInfoUpdate("roster", (info) => {
    const parsed = parseRoster(info?.roster);
    if (parsed.length > 0) {
      setState({ roster: parsed, raw: { ...useAppStore.getState().gameState.raw, roster: info } });
    }
  });

  geppService.onInfoUpdate("board", (info) => {
    const parsed = parseBoard(info?.board);
    const activeCompTracker = calculateBestCompMatch(parsed.units, metaComps);
    setState({ board: parsed, activeCompTracker, raw: { ...useAppStore.getState().gameState.raw, board: info } });
    recalcItems();
  });

  geppService.onInfoUpdate("items", (info) => {
    const benchComponents = parseBenchComponents(info?.items);
    setState({ benchComponents, raw: { ...useAppStore.getState().gameState.raw, items: info } });
    recalcItems();
  });

  // New events
  geppService.onNewEvent("match_start", () => {
    setState({ isInGame: true });
    hideLobby();
    showOverlay();
  });

  geppService.onNewEvent("match_end", () => {
    hideOverlay();
    resetState();
    showLobby();
  });
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

async function showLobby(): Promise<void> {
  lobbyId = getWindowId("lobby");
  if (!lobbyId) {
    await openWindow("lobby");
    lobbyId = getWindowId("lobby");
  }
}

function hideLobby(): void {
  hideWindow("lobby");
}

async function showDesktop(): Promise<void> {
  desktopId = getWindowId("desktop");
  if (!desktopId) {
    await openWindow("desktop");
    desktopId = getWindowId("desktop");
  }
}

let overlayVisible = true;

function toggleOverlay(): void {
  overlayVisible = !overlayVisible;
  if (overlayVisible) {
    void showOverlay();
  } else {
    hideOverlay();
  }
}

function onHotkeyPressed(e: any): void {
  if (e?.name === "toggle_overlay") {
    toggleOverlay();
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

  setupGepService();

  overwolf.settings.hotkeys.onPressed.addListener(onHotkeyPressed);

  // Pre-obtain window ids
  const overlay = getWindowId("overlay");
  if (!overlay) await openWindow("overlay");
  overlayId = getWindowId("overlay");

  const lobby = getWindowId("lobby");
  if (!lobby) await openWindow("lobby");
  lobbyId = getWindowId("lobby");
  hideLobby();

  const desktop = getWindowId("desktop");
  if (!desktop) await openWindow("desktop");
  desktopId = getWindowId("desktop");

  overwolf.games.getRunningGameInfo((gameInfo: any) => {
    if (gameInfo && isTft(gameInfo.id)) {
      console.log("[BG] TFT already running");
      setState({ isInGame: true });
      showLobby();
      // GEP service already set up
    } else {
      showDesktop();
    }
  });
}