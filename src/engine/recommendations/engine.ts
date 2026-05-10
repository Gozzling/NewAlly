import type {
  AllyRecommendation,
  PlayerMatchHistorySummary,
  RecommendationEngineInput,
} from "@ally/shared-types";
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

/** Assemble engine input from live state and an already-aggregated match-history summary. */
export function buildRecommendationInput(
  gs: TftGameState,
  matchHistory: PlayerMatchHistorySummary,
  staticMetaVersion: string,
): RecommendationEngineInput {
  return {
    signals: toNormalizedSignals(gs),
    matchHistory,
    staticMetaVersion,
  };
}

/**
 * @param matchesOrSummary — pass `PersonalMatchRecord[]` (summarized with a 40-game window) or a pre-built {@link PlayerMatchHistorySummary}.
 */
export function recommendationsFromGameState(
  gs: TftGameState,
  matchesOrSummary: PersonalMatchRecord[] | PlayerMatchHistorySummary,
  staticMetaVersion: string,
  nowMs = Date.now(),
): AllyRecommendation[] {
  const summary: PlayerMatchHistorySummary = Array.isArray(matchesOrSummary)
    ? summarizePersonalMatches(matchesOrSummary, 40)
    : matchesOrSummary;
  return runRecommendationEngine(buildRecommendationInput(gs, summary, staticMetaVersion), nowMs);
}
