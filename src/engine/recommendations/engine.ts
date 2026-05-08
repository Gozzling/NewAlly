import type { AllyRecommendation, RecommendationEngineInput } from "@ally/shared-types";
import type { PersonalMatchRecord } from "@/services/indexedDbService";
import type { TftGameState } from "@/types/tft";
import { economyRecommendations } from "./strategies/economy";
import { itemRecommendations } from "./strategies/items";
import { shopRecommendations } from "./strategies/shop";
import { summarizePersonalMatches } from "./historySummary";
import { toNormalizedSignals } from "./signals";

const urgencyRank: Record<AllyRecommendation["urgency"], number> = {
  high: 0,
  medium: 1,
  low: 2,
};

export function sortRecommendations(recs: AllyRecommendation[]): AllyRecommendation[] {
  return [...recs].sort((a, b) => {
    const u = urgencyRank[a.urgency] - urgencyRank[b.urgency];
    if (u !== 0) return u;
    return b.confidence - a.confidence;
  });
}

export function runRecommendationEngine(
  input: RecommendationEngineInput,
  nowMs = Date.now(),
): AllyRecommendation[] {
  const combined = [
    ...shopRecommendations(input, nowMs),
    ...itemRecommendations(input, nowMs),
    ...economyRecommendations(input, nowMs),
  ];
  return sortRecommendations(combined);
}

/** Convenience: GEP state + personal match rows + static meta label. */
export function buildRecommendationInput(
  gs: TftGameState,
  matches: PersonalMatchRecord[],
  staticMetaVersion: string,
  historyWindow = 20,
): RecommendationEngineInput {
  return {
    signals: toNormalizedSignals(gs),
    matchHistory: summarizePersonalMatches(matches, historyWindow),
    staticMetaVersion,
  };
}

export function recommendationsFromGameState(
  gs: TftGameState,
  matches: PersonalMatchRecord[],
  staticMetaVersion: string,
  nowMs = Date.now(),
): AllyRecommendation[] {
  return runRecommendationEngine(buildRecommendationInput(gs, matches, staticMetaVersion), nowMs);
}
