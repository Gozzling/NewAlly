import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import type { PlayerMatchHistorySummary } from "@ally/shared-types";
import {
  buildPlayerHistorySummary,
  emptyPlayerMatchHistorySummary,
  summarizePersonalMatches,
} from "@/engine/recommendations";
import { CURRENT_TFT_SET_NUMBER } from "@/meta/tftCurrentSet";
import { broadcastCoachMatchHistorySummary } from "@/services/coachBroadcast";
import { fetchPlayerMatchHistoryForSet } from "@/services/matchHistoryService";
import { useAppStore } from "@/store/useAppStore";

/** Cap aggregation cost; set-scoped fetch can return hundreds of games. */
export const COACH_HISTORY_MAX_GAMES = 2500;

const CACHE_VERSION = "v1";
const CACHE_PREFIX = `tft-ally::coach-mh:${CACHE_VERSION}:`;
const TTL_MS = 60 * 60 * 1000;

type CachePayload = { at: number; summary: PlayerMatchHistorySummary };

function storageKey(region: string, puuid: string, setN: number): string {
  return `${CACHE_PREFIX}${region}:${puuid}:${setN}`;
}

const memory = new Map<string, CachePayload>();

function readCache(region: string, puuid: string, setN: number): PlayerMatchHistorySummary | null {
  const k = `${region}:${puuid}:${setN}`;
  const hit = memory.get(k);
  if (hit && Date.now() - hit.at <= TTL_MS) {
    return hit.summary;
  }
  try {
    const raw = localStorage.getItem(storageKey(region, puuid, setN));
    if (!raw) return null;
    const p = JSON.parse(raw) as CachePayload;
    if (!p?.at || !p?.summary) return null;
    if (Date.now() - p.at > TTL_MS) {
      localStorage.removeItem(storageKey(region, puuid, setN));
      return null;
    }
    memory.set(k, p);
    return p.summary;
  } catch {
    return null;
  }
}

function writeCache(region: string, puuid: string, setN: number, summary: PlayerMatchHistorySummary) {
  const k = `${region}:${puuid}:${setN}`;
  const payload: CachePayload = { at: Date.now(), summary };
  memory.set(k, payload);
  try {
    localStorage.setItem(storageKey(region, puuid, setN), JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

function clearCache(region: string, puuid: string, setN: number) {
  const k = `${region}:${puuid}:${setN}`;
  memory.delete(k);
  try {
    localStorage.removeItem(storageKey(region, puuid, setN));
  } catch {
    /* ignore */
  }
}

/** Clears in-process cache between Vitest cases (localStorage is per-test in jsdom). */
export function clearCoachMatchHistoryMemoryForTests(): void {
  memory.clear();
}

/**
 * Read the TTL coach cache (same keys as {@link useCoachMatchHistory}).
 * Desktop and in-game overlay are separate renderers — use this in the overlay so it sees
 * summaries written when Team Builder runs (localStorage is shared; RAM `memory` map is not).
 */
export function readCachedCoachSummary(
  region: string,
  puuid: string,
  setNumber: number = CURRENT_TFT_SET_NUMBER,
): PlayerMatchHistorySummary | null {
  return readCache(region, puuid, setNumber);
}

/** Persist coach summary to the shared TTL cache (overlay hydration, IPC receiver, tests). */
export function persistCachedCoachSummary(
  region: string,
  puuid: string,
  summary: PlayerMatchHistorySummary,
  setNumber: number = CURRENT_TFT_SET_NUMBER,
): void {
  writeCache(region, puuid, setNumber, summary);
}

export interface UseCoachMatchHistoryOptions {
  targetSetNumber?: number;
}

export interface UseCoachMatchHistoryResult {
  matchHistory: PlayerMatchHistorySummary | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => void;
}

/**
 * Coach-facing match history: GEP rows take priority; otherwise set-scoped Riot fetch with 1h TTL cache.
 */
export function useCoachMatchHistory(
  options: UseCoachMatchHistoryOptions = {},
): UseCoachMatchHistoryResult {
  const targetSet = options.targetSetNumber ?? CURRENT_TFT_SET_NUMBER;
  const personalMatches = useAppStore((s) => s.personalMatches);
  const selectedPlayer = useAppStore((s) => s.selectedPlayer);
  const region = useAppStore((s) => s.settings.region);
  const puuid = selectedPlayer?.puuid;

  const personalSummary = useMemo(() => {
    if (personalMatches.length === 0) return null;
    return summarizePersonalMatches(personalMatches, COACH_HISTORY_MAX_GAMES);
  }, [personalMatches]);

  const [apiSummary, setApiSummary] = useState<PlayerMatchHistorySummary | null>(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  /** Fresh read each render so memory/localStorage updates after `writeCache` are visible. */
  const cachedRemote =
    puuid && region ? readCache(region, puuid, targetSet) : null;

  useLayoutEffect(() => {
    if (personalMatches.length > 0 || !puuid || !region) {
      setApiLoading(false);
      return;
    }
    if (cachedRemote && refreshToken === 0) {
      setApiLoading(false);
      return;
    }
    setApiLoading(true);
  }, [personalMatches.length, puuid, region, cachedRemote, refreshToken]);

  useEffect(() => {
    if (personalMatches.length > 0) {
      setApiSummary(null);
      setApiLoading(false);
      setError(null);
      return;
    }
    if (!puuid || !region) {
      setApiSummary(null);
      setApiLoading(false);
      setError(null);
      return;
    }
    if (cachedRemote && refreshToken === 0) {
      return;
    }

    let cancelled = false;
    setApiLoading(true);
    setError(null);
    if (refreshToken > 0) {
      setApiSummary(null);
    }

    void (async () => {
      try {
        const raw = await fetchPlayerMatchHistoryForSet(puuid, region, targetSet);
        if (cancelled) return;
        const summary = buildPlayerHistorySummary(
          raw,
          Math.min(raw.length, COACH_HISTORY_MAX_GAMES),
        );
        setApiSummary(summary);
        writeCache(region, puuid, targetSet, summary);
        broadcastCoachMatchHistorySummary(summary);
      } catch (e) {
        if (!cancelled) {
          setApiSummary(emptyPlayerMatchHistorySummary());
          setError(e instanceof Error ? e : new Error(String(e)));
        }
      } finally {
        if (!cancelled) setApiLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    personalMatches.length,
    puuid,
    region,
    targetSet,
    cachedRemote,
    refreshToken,
  ]);

  const refresh = useCallback(() => {
    if (!puuid || !region || personalMatches.length > 0) return;
    clearCache(region, puuid, targetSet);
    setRefreshToken((t) => t + 1);
  }, [personalMatches.length, puuid, region, targetSet]);

  const matchHistory: PlayerMatchHistorySummary | null = useMemo(() => {
    if (personalSummary) return personalSummary;
    if (!puuid || !region) return emptyPlayerMatchHistorySummary();
    if (apiSummary !== null) return apiSummary;
    if (cachedRemote) return cachedRemote;
    if (apiLoading) return null;
    return emptyPlayerMatchHistorySummary();
  }, [personalSummary, puuid, region, apiSummary, cachedRemote, apiLoading]);

  const isLoading = useMemo(
    () =>
      !personalSummary &&
      !!(puuid && region) &&
      apiSummary === null &&
      !cachedRemote &&
      apiLoading,
    [personalSummary, puuid, region, apiSummary, cachedRemote, apiLoading],
  );

  const setCoachMatchHistory = useAppStore((s) => s.setCoachMatchHistory);

  useEffect(() => {
    if (isLoading) return;
    if (matchHistory === null) return;
    setCoachMatchHistory(matchHistory);
  }, [matchHistory, isLoading, setCoachMatchHistory]);

  return {
    matchHistory,
    isLoading,
    error: personalSummary ? null : error,
    refresh,
  };
}
