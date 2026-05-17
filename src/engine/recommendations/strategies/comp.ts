import type { AllyRecommendation, RecommendationEngineInput } from "@ally/shared-types";
import { RECOMMENDATION_THRESHOLDS } from "../thresholds";

function formatMissingUnits(units: string[], max: number): string {
  const slice = units.slice(0, max);
  if (units.length > max) return `${slice.join(", ")} (+${units.length - max} more)`;
  return slice.join(", ");
}

export function compRecommendations(
  input: RecommendationEngineInput,
  nowMs = Date.now(),
): AllyRecommendation[] {
  const { signals, matchHistory } = input;
  if (!signals.inGame) return [];

  const t = RECOMMENDATION_THRESHOLDS.comp;
  const compName = signals.activeCompName;
  const missing = signals.missingUnitsForComp;
  const matchPct = signals.compMatchPercent;
  const boardCount = signals.boardUnitNames.length;

  if (!compName || missing.length < t.minMissingUnits || boardCount < t.minBoardUnits) {
    return [];
  }

  const out: AllyRecommendation[] = [];
  const missingLabel = formatMissingUnits(missing, t.maxMissingListed);
  const favorite = matchHistory.favoriteComp?.trim() || null;
  const favoriteDiffers =
    favorite != null && favorite.toLowerCase() !== compName.toLowerCase();

  if (
    matchPct >= t.finishMatchPercentMin &&
    matchPct < t.finishMatchPercentMax &&
    missing.length <= t.finishMaxMissingUnits
  ) {
    out.push({
      id: `board:finish:${nowMs}`,
      category: "board",
      title: `Finish ${compName}`,
      detail: `You are ${Math.round(matchPct)}% toward this line — prioritize ${missingLabel} in shop and carousels before rolling for upgrades.`,
      confidence: 0.58 + Math.min(0.12, matchPct / 500),
      risk: "low",
      urgency: missing.length <= 2 ? "medium" : "low",
      reasoning: [
        `Comp tracker: ${Math.round(matchPct)}% match on ${compName}.`,
        `Still missing: ${missingLabel}.`,
      ],
      evidence: [
        { source: "gep", weight: 0.55, note: "Active comp tracker" },
        { source: "heuristic", weight: 0.45, note: "Line completion priority" },
      ],
      createdAtMs: nowMs,
    });
    return out;
  }

  if (matchPct < t.pivotMatchPercentMax && missing.length >= t.pivotMinMissingUnits) {
    const historyHint =
      favoriteDiffers && matchHistory.windowSize >= t.historyWindowMin
        ? ` Recent games lean ${favorite} — consider pivoting off ${compName} if hits dry up.`
        : " Re-evaluate whether this line is still contestable before spending more gold.";

    out.push({
      id: `board:pivot:${nowMs}`,
      category: "board",
      title: "Weak comp match — consider pivot",
      detail: `${compName} is only ${Math.round(matchPct)}% complete; missing ${missingLabel}.${historyHint}`,
      confidence: 0.52 + Math.min(0.15, (t.pivotMatchPercentMax - matchPct) / 100),
      risk: "medium",
      urgency: matchPct < 30 ? "high" : "medium",
      reasoning: [
        `Low comp match (${Math.round(matchPct)}%) with ${missing.length} units still out.`,
        ...(favoriteDiffers ? [`History favorite: ${favorite}.`] : []),
      ],
      evidence: [
        { source: "gep", weight: 0.5, note: "Comp tracker & missing units" },
        ...(favoriteDiffers
          ? [{ source: "match_history" as const, weight: 0.3, note: "Favorite comp from recent games" }]
          : []),
        { source: "heuristic", weight: favoriteDiffers ? 0.2 : 0.5, note: "Pivot timing" },
      ],
      createdAtMs: nowMs,
    });
    return out;
  }

  if (
    favoriteDiffers &&
    matchHistory.windowSize >= t.historyWindowMin &&
    missing.length >= t.pivotMinMissingUnits
  ) {
    out.push({
      id: `board:history-align:${nowMs}`,
      category: "board",
      title: `Align with ${favorite}?`,
      detail: `Tracker shows ${compName} (${Math.round(matchPct)}% match, missing ${missingLabel}). Your last ${matchHistory.windowSize} games favor ${favorite} — pivot only if shop and items support it.`,
      confidence: 0.48,
      risk: "medium",
      urgency: "low",
      reasoning: [
        `Active line: ${compName}; personal history favorite: ${favorite}.`,
        `Missing for current line: ${missingLabel}.`,
      ],
      evidence: [
        { source: "match_history", weight: 0.45, note: "Favorite comp trend" },
        { source: "gep", weight: 0.4, note: "Live comp tracker" },
        { source: "heuristic", weight: 0.15, note: "Line vs history alignment" },
      ],
      createdAtMs: nowMs,
    });
  }

  return out;
}
