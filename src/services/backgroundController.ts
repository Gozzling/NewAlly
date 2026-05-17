/// <reference types="@overwolf/types" />

import { useAppStore, EMPTY_STATE } from "@/store/useAppStore";
import {
  parseRoster,
  parseBoard,
  parseBenchComponents,
  calculateBestCompMatch,
  calculateItemCrafting,
  detectCompFromUnits,
} from "@/shared/gameEngine";
import { mergeAugmentSlots, parseAugmentList, parseAugmentsFromGepInfo } from "@/shared/augmentParse";
import {
  TFT_LIVE_CHANNEL,
  createIpcGameStateMessage,
  createIpcGepStatusMessage,
  createIpcBackgroundErrorMessage,
  createIpcPersonalMatchMessage,
  createIpcPersonalMatchesHydrateMessage,
  type IpcTftPayload,
} from "@/engine/events/ipcWire";
import type { PersonalMatchIpcRecord } from "@ally/shared-types";
import { extractUnitBuildsFromBoard, flattenItemsFromBuilds } from "@/engine/personalComps/unitBuilds";
import type { MetaComp, ItemRecipes, TftGameState } from "@/types/tft";
import { openWindow, hideWindow, getWindowId } from "./overwolfWindowService";
import { GeppService } from "./geppService";
import {
  getPersonalMatches,
  savePersonalMatch,
  markPersonalMatchSynced,
  type PersonalMatchRecord,
} from "./indexedDbService";
import { syncPersonalMatchToSupabase } from "./matchHistoryService";
import { createMatchVisionCapture } from "./backgroundVisionCapture";

const TFT_CLASS_ID = 21570;
const REQUIRED_FEATURES = [
  "game_info",
  "match_info",
  "active_player",
  "board",
  "shop",
  "roster",
  "items",
  "augments",
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

function broadcastPayload(payload: IpcTftPayload): void {
  if (overlayId) {
    overwolf.windows.sendMessage(overlayId, TFT_LIVE_CHANNEL, payload, () => void 0);
  }
  if (lobbyId) {
    overwolf.windows.sendMessage(lobbyId, TFT_LIVE_CHANNEL, payload, () => void 0);
  }
  if (desktopId) {
    overwolf.windows.sendMessage(desktopId, TFT_LIVE_CHANNEL, payload, () => void 0);
  }
}

function notify(state: TftGameState): void {
  broadcastPayload(createIpcGameStateMessage(state));
}

function broadcastPersonalMatch(record: PersonalMatchRecord): void {
  broadcastPayload(createIpcPersonalMatchMessage(record as PersonalMatchIpcRecord));
}

async function broadcastPersonalMatchesHydrate(limit = 40): Promise<void> {
  try {
    const rows = await getPersonalMatches(limit);
    broadcastPayload(createIpcPersonalMatchesHydrateMessage(rows as PersonalMatchIpcRecord[]));
    console.debug("[BG] personal matches hydrate broadcast", { count: rows.length });
  } catch (err) {
    console.warn("[BG] personal matches hydrate failed", err);
  }
}

const matchVision = createMatchVisionCapture(broadcastPayload);

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

function collectLiveMatchAugments(
  gs: TftGameState,
  eventData?: Record<string, unknown>,
): string[] {
  const buckets = [
    parseAugmentList(gs.augmentSlots),
    parseAugmentsFromGepInfo(gs.raw?.augments),
    parseAugmentsFromGepInfo(gs.raw?.active_player),
    parseAugmentsFromGepInfo(eventData),
  ];
  let merged: string[] = [];
  for (const bucket of buckets) {
    if (bucket.length > 0) merged = mergeAugmentSlots(merged, bucket);
  }
  return merged;
}

function buildPersonalMatchRecord(eventData?: Record<string, unknown>): PersonalMatchRecord {
  const app = useAppStore.getState();
  const gs = app.gameState;
  const now = Date.now();
  const boardUnits = gs.board.units ?? [];
  const unitBuilds = extractUnitBuildsFromBoard(boardUnits);
  const items = flattenItemsFromBuilds(unitBuilds);
  const units = unitBuilds.map((u) => u.name).filter(Boolean);
  const summonerName = app.selectedPlayer?.name ?? "Unknown";
  const region = app.settings.region;
  const compDetected = detectCompFromUnits(units);
  const augments = collectLiveMatchAugments(gs, eventData);

  return {
    id: `match-${now}-${summonerName}`,
    summonerName,
    region,
    createdAt: now,
    timestamp: now,
    isSynced: false,
    syncStatus: "pending",
    placement: gs.roster.find((p) => p.isLocalPlayer)?.rank ?? null,
    units,
    items,
    unitBuilds,
    augments,
    comp: compDetected || (gs.activeCompTracker.bestMatchName ?? null),
    compName: compDetected || (gs.activeCompTracker.bestMatchName ?? null),
    duration: eventData?.duration ? Number(eventData.duration) : null,
    source: "gep_match_end",
    raw: {
      eventData: eventData ?? {},
      round_type: gs.round_type,
      gold: gs.gold,
      augmentSlots: gs.augmentSlots,
      augments: gs.raw?.augments,
      active_player: gs.raw?.active_player,
    },
  };
}

async function persistAndSyncPersonalMatch(eventData?: Record<string, unknown>): Promise<void> {
  const record = buildPersonalMatchRecord(eventData);

  try {
    await savePersonalMatch(record);
    useAppStore.getState().addPersonalMatch(record);
    broadcastPersonalMatch(record);
    console.debug("[BG][match_end] personal match saved", { id: record.id });
  } catch (e) {
    console.error("[BG][match_end] failed to save IndexedDB match", e);
    return;
  }

  try {
    await syncPersonalMatchToSupabase(record);
    await markPersonalMatchSynced(record.id, true);
    useAppStore.getState().updatePersonalMatchSyncStatus(record.id, "synced", Date.now());
    const synced = useAppStore
      .getState()
      .personalMatches.find((m) => m.id === record.id);
    if (synced) broadcastPersonalMatch(synced);
    console.debug("[BG][match_end] personal match synced", { id: record.id });
  } catch (e) {
    await markPersonalMatchSynced(record.id, false);
    useAppStore.getState().updatePersonalMatchSyncStatus(record.id, "failed");
    const failed = useAppStore
      .getState()
      .personalMatches.find((m) => m.id === record.id);
    if (failed) broadcastPersonalMatch(failed);
    console.warn("[BG][match_end] personal match sync failed", e);
  }
}

function setupGepService(): void {
  geppService = new GeppService();
  geppService.onRegistrationResult((outcome) => {
    if (outcome.status === "ready") {
      broadcastPayload(createIpcGepStatusMessage(true, null));
    } else {
      broadcastPayload(createIpcGepStatusMessage(false, outcome.error));
    }
  });
  geppService.register(REQUIRED_FEATURES);

  // Info updates
  geppService.onInfoUpdate("active_player", (info) => {
    const gs = useAppStore.getState().gameState;
    const activePlayer = info?.active_player as Record<string, unknown> | undefined;
    const gold = activePlayer?.gold;
    const parsedAugments = parseAugmentList(
      activePlayer?.augmentSlots ?? activePlayer?.augments ?? activePlayer?.picked_augments,
    );
    const augmentSlots =
      parsedAugments.length > 0 ? mergeAugmentSlots(gs.augmentSlots, parsedAugments) : gs.augmentSlots;
    if (gold !== undefined || parsedAugments.length > 0) {
      setState({
        gold: gold !== undefined ? Number(gold) : gs.gold,
        augmentSlots,
        raw: { ...gs.raw, active_player: info },
      });
    }
  });

  geppService.onInfoUpdate("augments", (info) => {
    const gs = useAppStore.getState().gameState;
    const parsed = parseAugmentsFromGepInfo(info);
    if (parsed.length === 0) return;
    const augmentSlots = mergeAugmentSlots(gs.augmentSlots, parsed);
    console.debug("[BG][augments] picked", { count: augmentSlots.length, augments: augmentSlots });
    setState({
      augmentSlots,
      raw: { ...gs.raw, augments: info },
    });
  });

  geppService.onInfoUpdate("match_info", (info) => {
    const rt = (info?.match_info as Record<string, unknown>)?.round_type;
    if (rt !== undefined) {
      setState({ round_type: String(rt), raw: { ...useAppStore.getState().gameState.raw, match_info: info } });
    }
  });

  geppService.onInfoUpdate("shop", (info) => {
    const gs = useAppStore.getState().gameState;
    const shop = info?.shop as Record<string, unknown> | undefined;
    const shopVisible = shop?.shop_visible ?? shop?.visible;
    const shopUnitsRaw = shop?.shop_units ?? shop?.units ?? shop?.slots ?? [];
    const shopUnits = Array.isArray(shopUnitsRaw)
      ? shopUnitsRaw
          .map((u: any) => u?.display_name ?? u?.name ?? u?.championName ?? String(u))
          .map((name: string) => name.trim())
          .filter(Boolean)
      : [];

    console.debug("[BG][shop] parsed", {
      visible: shopVisible,
      count: shopUnits.length,
      units: shopUnits,
      rawKeys: shop ? Object.keys(shop) : [],
    });

    const updates: Partial<TftGameState> = {
      shopUnits,
    };
    if (shopVisible !== undefined) updates.shop_visible = Boolean(shopVisible);

    setState({
      ...updates,
      raw: { ...gs.raw, shop: info },
    });
  });

  geppService.onInfoUpdate("roster", (info) => {
    const parsed = parseRoster(info?.roster);
    if (parsed.length > 0) {
      setState({ roster: parsed, raw: { ...useAppStore.getState().gameState.raw, roster: info } });
    }
  });

  geppService.onInfoUpdate("board", (info) => {
    const parsed = parseBoard(info?.board ?? info);
    console.debug("[BG][board] parsed", {
      count: parsed.units.length,
      unitNames: parsed.units.map((u) => u.name),
      payloadKeys: info && typeof info === "object" ? Object.keys(info as Record<string, unknown>) : [],
    });
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
    setState({ isInGame: true, augmentSlots: [] });
    matchVision.start();
    hideLobby();
    showOverlay();
  });

  geppService.onNewEvent("match_end", (eventData) => {
    matchVision.stop();
    void persistAndSyncPersonalMatch((eventData ?? {}) as Record<string, unknown>);
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

  let metaBootstrapError: string | null = null;
  try {
    const [comps, recipes] = await Promise.all([
      fetch("./metaComps.json").then((r) => r.json()),
      fetch("./itemRecipes.json").then((r) => r.json()),
    ]);
    metaComps = Array.isArray(comps) ? (comps as MetaComp[]) : [];
    itemRecipes = recipes && typeof recipes === "object" ? (recipes as ItemRecipes) : {};
    console.log("[BG] Loaded", metaComps.length, "comps,", Object.keys(itemRecipes).length, "recipes");
  } catch (err) {
    metaBootstrapError = err instanceof Error ? err.message : String(err);
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

  await broadcastPersonalMatchesHydrate();

  if (metaBootstrapError) {
    broadcastPayload(createIpcBackgroundErrorMessage("meta_load", metaBootstrapError));
  } else if (metaComps.length === 0 || Object.keys(itemRecipes).length === 0) {
    broadcastPayload(
      createIpcBackgroundErrorMessage(
        "meta_unavailable",
        "Comp or item recipe data missing; guides may be incomplete.",
      ),
    );
  }

  overwolf.games.getRunningGameInfo((gameInfo: any) => {
    if (gameInfo && isTft(gameInfo.id)) {
      console.log("[BG] TFT already running");
      setState({ isInGame: true });
      matchVision.start();
      showLobby();
    } else {
      showDesktop();
    }
  });
}