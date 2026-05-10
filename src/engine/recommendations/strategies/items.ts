import type {
  AllyRecommendation,
  CompPreferenceEntry,
  RecommendationEngineInput,
} from "@ally/shared-types";
import { clamp01 } from "../confidence";

function resolveSimilarCompKey(
  activeCompName: string | null,
  prefs: CompPreferenceEntry[],
): string | null {
  if (prefs.length === 0) return null;
  if (!activeCompName?.trim()) return prefs[0]!.compKey;
  const al = activeCompName.toLowerCase();
  const tokens = al.split(/\s+/).filter((t) => t.length > 2);
  const hit = prefs.find((p) => {
    const pk = p.compKey.toLowerCase();
    if (pk.includes(al) || al.includes(pk)) return true;
    return tokens.some((tok) => pk.includes(tok));
  });
  return hit?.compKey ?? prefs[0]!.compKey;
}

function frequentItemsForComp(
  compKey: string | null,
  itemsByComp: Record<string, Record<string, number>>,
  limit: number,
): string[] {
  if (!compKey) return [];
  const row = itemsByComp[compKey];
  if (!row) return [];
  return Object.entries(row)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([n]) => n);
}

/** Item names you tend to slam in comps close to your current board (or globally by win rate). */
function historyItemHints(matchHistory: RecommendationEngineInput["matchHistory"], activeComp: string | null) {
  const compKey = resolveSimilarCompKey(activeComp, matchHistory.compPreferences);
  const fromComp = frequentItemsForComp(compKey, matchHistory.itemsByCompFrequency, 5);
  const byWin = Object.entries(matchHistory.itemPerformance)
    .filter(([, s]) => s.playCount >= 2 && s.avgPlace <= 5.5)
    .sort((a, b) => b[1].winRate - a[1].winRate || b[1].playCount - a[1].playCount)
    .slice(0, 4)
    .map(([n]) => n);
  const picks = fromComp.length > 0 ? fromComp : byWin;
  return { picks, compKey };
}

export function itemRecommendations(input: RecommendationEngineInput, nowMs = Date.now()): AllyRecommendation[] {
  const { signals, matchHistory } = input;
  if (!signals.inGame) return [];

  const histCtx =
    matchHistory.windowSize >= 4 ? historyItemHints(matchHistory, signals.activeCompName) : null;

  const out: AllyRecommendation[] = [];
  const labels = signals.craftableLabels ?? [];

  if (labels.length > 0) {
    const top = labels.slice(0, 2);
    let histSuffix = "";
    const histReason: string[] = [];
    const histEvidence: AllyRecommendation["evidence"] = [];

    if (histCtx && histCtx.picks.length > 0) {
      histSuffix = ` In similar recent comps you built ${histCtx.picks.slice(0, 2).join(" and ")} often${histCtx.compKey ? ` (${histCtx.compKey})` : ""}.`;
      histReason.push(
        `Personal item trends: prioritized ${histCtx.picks.slice(0, 3).join(", ")} in recorded games.`,
      );
      histEvidence.push({
        source: "match_history",
        weight: 0.35,
        note: `${histCtx.compKey ?? "recent pool"} → ${histCtx.picks.slice(0, 3).join(", ")}`,
      });
    }

    out.push({
      id: `items:craft:${nowMs}`,
      category: "items",
      title: "Item slam candidates",
      detail: `You can build: ${top.join("; ")}${labels.length > 2 ? "…" : ""}.${histSuffix}`,
      confidence: clamp01(
        0.55 + 0.05 * Math.min(labels.length, 3) + (histCtx?.picks.length ? 0.04 : 0),
      ),
      risk: "medium",
      urgency: signals.itemMissingCount > 2 ? "medium" : "low",
      reasoning: [
        "Craftable items from components on bench/board (GEP).",
        ...(signals.partialItemBuildLabels?.length
          ? [`Suggested items to build (one component left): ${signals.partialItemBuildLabels.slice(0, 3).join(", ")}`]
          : []),
        ...histReason,
      ],
      evidence: [
        { source: "gep", weight: 0.6, note: "Item tracker from live game state" },
        { source: "static_meta", weight: 0.25, note: "BIS paths from static comp data (indirect)" },
        ...histEvidence,
      ],
      createdAtMs: nowMs,
      payload: { craftableCount: signals.itemCraftableCount, missingCount: signals.itemMissingCount },
    });
  } else if ((signals.partialItemBuildLabels?.length ?? 0) > 0) {
    const pLabels = signals.partialItemBuildLabels ?? [];
    let histSuffix = "";
    const histReason: string[] = [];
    const histEvidence: AllyRecommendation["evidence"] = [];

    if (histCtx && histCtx.picks.length > 0) {
      histSuffix = ` You usually finish ${histCtx.picks.slice(0, 2).join("/")} in this comp style.${histCtx.compKey ? ` (${histCtx.compKey})` : ""}`;
      histReason.push(`Match-history lean: finish items you commonly build (${histCtx.picks.slice(0, 3).join(", ")})`);
      histEvidence.push({
        source: "match_history",
        weight: 0.32,
        note: `${histCtx.compKey ?? "pool"} frequent items`,
      });
    }

    out.push({
      id: `items:suggested:${nowMs}`,
      category: "items",
      title: "Suggested items to build",
      detail: `Suggested items to build: ${pLabels.slice(0, 4).join(", ")}${histSuffix}`,
      confidence: clamp01(0.48 + (histCtx?.picks.length ? 0.05 : 0)),
      risk: "low",
      urgency: "low",
      reasoning: [
        "You already hold part of the recipe — finish the pair on your carry when you hit the missing component.",
        ...histReason,
      ],
      evidence: [
        { source: "gep", weight: 0.55, note: "Item tracker (partial components on bench/board)" },
        ...histEvidence,
      ],
      createdAtMs: nowMs,
    });
  }

  return out;
}
