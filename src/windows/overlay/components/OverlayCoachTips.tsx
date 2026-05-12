import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Sparkles } from "lucide-react";
import type { PlayerMatchHistorySummary } from "@ally/shared-types";
import {
  buildPlayerHistorySummary,
  recommendationsFromGameState,
  summarizePersonalMatches,
} from "@/engine/recommendations";
import { emptyPlayerMatchHistorySummary } from "@/engine/recommendations/historySummary";
import {
  COACH_HISTORY_MAX_GAMES,
  persistCachedCoachSummary,
  readCachedCoachSummary,
} from "@/hooks/useCoachMatchHistory";
import { CURRENT_TFT_SET_NUMBER, STATIC_META_VERSION } from "@/meta/tftCurrentSet";
import { broadcastCoachMatchHistorySummary } from "@/services/coachBroadcast";
import { fetchPlayerMatchHistoryForSet } from "@/services/matchHistoryService";
import { useAppStore } from "@/store/useAppStore";
import type { TftGameState } from "@/types/tft";

const COACH_LS_PREFIX = "tft-ally::coach-mh:";
const REC_GAMESTATE_DEBOUNCE_MS = 280;

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

function resolveOverlayMatchHistory(
  personalLen: number,
  personalSummary: PlayerMatchHistorySummary | null,
  coachFromStore: PlayerMatchHistorySummary | null,
  region: string | null,
  puuid: string | null,
): PlayerMatchHistorySummary {
  if (personalLen > 0 && personalSummary) return personalSummary;
  if (coachFromStore) return coachFromStore;
  if (region && puuid) {
    const cached = readCachedCoachSummary(region, puuid);
    if (cached) return cached;
  }
  return emptyPlayerMatchHistorySummary();
}

/**
 * Live coaching lines (same engine as Team Builder).
 * - GEP `personalMatches` when present.
 * - Else Zustand coach (IPC or local hydrate) → shared localStorage TTL cache → empty.
 * Recommendations use debounced game state to avoid jitter; panel can collapse to a single row.
 */
export function OverlayCoachTips() {
  const gameState = useAppStore((s) => s.gameState) as TftGameState;
  const debouncedGameState = useDebouncedValue(gameState, REC_GAMESTATE_DEBOUNCE_MS);
  const personalMatches = useAppStore((s) => s.personalMatches);
  const coachFromStore = useAppStore((s) => s.coachMatchHistory);
  const region = useAppStore((s) => s.settings.region);
  const puuid = useAppStore((s) => s.selectedPlayer?.puuid);

  const [expanded, setExpanded] = useState(true);
  const [cacheEpoch, setCacheEpoch] = useState(0);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key?.startsWith(COACH_LS_PREFIX)) setCacheEpoch((n) => n + 1);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  /** When the overlay has player context but no GEP rows and no cache, fetch set-scoped history (best-effort). */
  useEffect(() => {
    if (personalMatches.length > 0) return;
    if (!puuid || !region) return;
    if (readCachedCoachSummary(region, puuid)) return;

    let cancelled = false;
    void (async () => {
      try {
        const raw = await fetchPlayerMatchHistoryForSet(puuid, region, CURRENT_TFT_SET_NUMBER);
        if (cancelled) return;
        const summary = buildPlayerHistorySummary(raw, Math.min(raw.length, COACH_HISTORY_MAX_GAMES));
        persistCachedCoachSummary(region, puuid, summary);
        broadcastCoachMatchHistorySummary(summary);
        useAppStore.getState().setCoachMatchHistory(summary);
        setCacheEpoch((n) => n + 1);
      } catch {
        /* ignore — overlay-only hydration */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [personalMatches.length, puuid, region]);

  const personalSummary = useMemo(() => {
    if (personalMatches.length === 0) return null;
    return summarizePersonalMatches(personalMatches, COACH_HISTORY_MAX_GAMES);
  }, [personalMatches]);

  const matchHistory = useMemo(
    () =>
      resolveOverlayMatchHistory(
        personalMatches.length,
        personalSummary,
        coachFromStore,
        region ?? null,
        puuid ?? null,
      ),
    [personalMatches.length, personalSummary, coachFromStore, region, puuid, cacheEpoch],
  );

  const gameData = useAppStore(s => s.gameData);
  const recs = useMemo(
    () =>
      recommendationsFromGameState(
        debouncedGameState,
        matchHistory,
        STATIC_META_VERSION,
        Date.now(),
        { champions: gameData.champions, traits: gameData.traits }
      ).slice(0, 3),
    [debouncedGameState, matchHistory, gameData.champions, gameData.traits],
  );

  if (recs.length === 0) return null;

  return (
    <div className="pointer-events-none select-none">
      <div className="bg-ally-card/90 border border-ally-border rounded-lg p-2 space-y-1.5 shadow-card">
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="pointer-events-auto flex w-full items-center gap-1 text-[9px] font-display font-bold uppercase tracking-widest text-ally-muted hover:text-ally-accent transition-colors"
        >
          {expanded ? <ChevronDown className="w-3 h-3 shrink-0" /> : <ChevronRight className="w-3 h-3 shrink-0" />}
          <Sparkles className="w-3 h-3 text-ally-accent" />
          <span>Coach Intelligence</span>
        </button>
        {expanded ? (
          <ul className="space-y-1.5">
            {recs.map((r) => (
              <li key={r.id} className="text-[9px] leading-snug text-ally-text-dim border-l-2 border-ally-accent/50 pl-2 py-0.5">
                <span className="font-display font-bold text-ally-text uppercase tracking-wide">{r.title}</span>
                <span className="block text-ally-muted mt-0.5 font-medium">{r.detail}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
