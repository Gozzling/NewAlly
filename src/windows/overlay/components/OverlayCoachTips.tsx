import { useEffect, useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { recommendationsFromGameState, summarizePersonalMatches } from "@/engine/recommendations";
import { COACH_HISTORY_MAX_GAMES, readCachedCoachSummary } from "@/hooks/useCoachMatchHistory";
import { STATIC_META_VERSION } from "@/meta/tftCurrentSet";
import { useAppStore } from "@/store/useAppStore";
import type { TftGameState } from "@/types/tft";

const COACH_LS_PREFIX = "tft-ally::coach-mh:";

/**
 * Live coaching lines (same engine as Team Builder).
 * - With GEP `personalMatches`, uses those.
 * - Else reads the shared localStorage coach cache (filled by Team Builder / {@link useCoachMatchHistory}) so the in-game overlay matches desktop without a shared Zustand instance.
 */
export function OverlayCoachTips() {
  const gameState = useAppStore((s) => s.gameState) as TftGameState;
  const personalMatches = useAppStore((s) => s.personalMatches);
  const region = useAppStore((s) => s.settings.region);
  const puuid = useAppStore((s) => s.selectedPlayer?.puuid);

  const [cacheEpoch, setCacheEpoch] = useState(0);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key?.startsWith(COACH_LS_PREFIX)) setCacheEpoch((n) => n + 1);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const cachedFromDesktop = useMemo(() => {
    if (!puuid || !region) return null;
    return readCachedCoachSummary(region, puuid);
  }, [puuid, region, cacheEpoch]);

  const matchHistory = useMemo(() => {
    if (personalMatches.length > 0) {
      return summarizePersonalMatches(personalMatches, COACH_HISTORY_MAX_GAMES);
    }
    return cachedFromDesktop ?? summarizePersonalMatches([], 40);
  }, [personalMatches, cachedFromDesktop]);

  const recs = useMemo(
    () => recommendationsFromGameState(gameState, matchHistory, STATIC_META_VERSION).slice(0, 3),
    [gameState, matchHistory],
  );

  if (recs.length === 0) return null;

  return (
    <div className="bg-[#1f1f1f]/90 border border-[#2a2a2a] rounded-lg p-2 space-y-1.5 pointer-events-none">
      <div className="flex items-center gap-1 text-[9px] uppercase tracking-wider text-neutral-500">
        <Sparkles className="w-3 h-3 text-[#35c3e7]" />
        <span>Coach</span>
      </div>
      <ul className="space-y-1">
        {recs.map((r) => (
          <li key={r.id} className="text-[9px] leading-snug text-neutral-300 border-l-2 border-[#35c3e7]/50 pl-1.5">
            <span className="font-semibold text-white/90">{r.title}</span>
            <span className="block text-neutral-400 mt-0.5">{r.detail}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
