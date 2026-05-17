import type {
  AllyRecommendation,
  NormalizedGameSignals,
  PlayerMatchHistorySummary,
  RecommendationEngineInput,
  RiskLevel,
  UrgencyLevel,
} from "@ally/shared-types";
import { SYNERGIES } from "@/data/synergies";
import { UNITS } from "@/data/units";
import { unitMatchKey } from "@/utils/unitDisplay";
import type { ShopRecommendation } from "@/services/shopAdvisorService";
import { analyzeShop } from "@/services/shopAdvisorService";
import { clamp01, combineEvidenceWeighted } from "../confidence";
import { RECOMMENDATION_THRESHOLDS } from "../thresholds";

function recId(category: string, key: string, t: number): string {
  return `${category}:${key}:${t}`;
}

function shopPriorityToModel(
  rec: ShopRecommendation,
  signals: NormalizedGameSignals,
): { confidence: number; risk: RiskLevel; urgency: UrgencyLevel } {
  let base = rec.value / 100;
  let risk: RiskLevel = "medium";
  let urgency: UrgencyLevel = "medium";
  switch (rec.priority) {
    case "must-buy":
      risk = signals.gold != null && signals.gold < 10 ? "high" : "medium";
      urgency = "high";
      base = Math.max(base, 0.82);
      break;
    case "strong":
      risk = "medium";
      urgency = "medium";
      break;
    case "situational":
      risk = "low";
      urgency = "low";
      base = Math.min(base, 0.75);
      break;
    default:
      risk = "low";
      urgency = "low";
  }
  return { confidence: base, risk, urgency };
}

/** Early board: suggest shop cost focus from trait progress (e.g. Team Builder with no shop snapshot). */
function traitProgressShopHint(boardUnitNames: string[], nowMs: number): AllyRecommendation | null {
  const n = boardUnitNames.length;
  if (n === 0 || n >= 4) return null;

  const boardSet = new Set(boardUnitNames.map((name) => unitMatchKey(name)));
  const traitCounts: Record<string, number> = {};
  for (const name of boardUnitNames) {
    const u = UNITS.find((x) => unitMatchKey(x.name) === unitMatchKey(name));
    if (!u) continue;
    for (const t of u.traits) {
      traitCounts[t] = (traitCounts[t] ?? 0) + 1;
    }
  }

  type Cand = { trait: string; need: number; nextCount: number };
  const cands: Cand[] = [];
  for (const [traitName, count] of Object.entries(traitCounts)) {
    const syn = SYNERGIES.find((s) => s.name === traitName);
    if (!syn) continue;
    const next = syn.thresholds.find((th) => th.count > count);
    if (!next) continue;
    cands.push({ trait: traitName, need: next.count - count, nextCount: next.count });
  }
  if (cands.length === 0) return null;

  cands.sort((a, b) => a.need - b.need || a.trait.localeCompare(b.trait));
  const top = cands[0];
  const have = traitCounts[top.trait] ?? 0;

  const pool = UNITS.filter(
    (u) => u.traits.includes(top.trait) && !boardSet.has(unitMatchKey(u.name)),
  );
  const costs = [...new Set(pool.map((u) => u.cost))].sort((a, b) => a - b);
  const costPhrase =
    pool.length === 0
      ? "units with this trait"
      : costs.length === 1
        ? `${costs[0]}-cost`
        : `${costs[0]}–${costs[costs.length - 1]}-cost`;

  const examples = pool
    .slice()
    .sort((a, b) => a.cost - b.cost || a.name.localeCompare(b.name))
    .slice(0, 4)
    .map((u) => u.name);

  const detail = `You have ${have} ${top.trait} — add ${top.need} more for the ${top.nextCount}-${top.trait} bonus. In shop rolls, lean toward ${costPhrase} picks${examples.length ? ` (e.g. ${examples.join(", ")})` : ""}.`;

  return {
    id: `shop:trait:${top.trait}:${nowMs}`,
    category: "shop",
    title: `Shop focus — ${top.nextCount} ${top.trait}`,
    detail,
    confidence: 0.52,
    risk: "low",
    urgency: n <= 2 ? "medium" : "low",
    reasoning: [
      `Next breakpoint: ${top.nextCount} ${top.trait} (${have} on board).`,
      ...(examples.length ? [`Examples: ${examples.join(", ")}.`] : []),
    ],
    evidence: [
      { source: "static_meta", weight: 0.65, note: "Trait thresholds & unit costs" },
      { source: "heuristic", weight: 0.35, note: "Early board shop planning" },
    ],
    createdAtMs: nowMs,
  };
}

function mapShop(
  rec: ShopRecommendation,
  signals: NormalizedGameSignals,
  history: PlayerMatchHistorySummary,
  now: number,
): AllyRecommendation | null {
  if (rec.priority === "skip") return null;
  const { confidence, risk, urgency } = shopPriorityToModel(rec, signals);
  const evidence: AllyRecommendation["evidence"] = [
    { source: "static_meta", weight: 0.55, note: `Comp graph & cost context for ${rec.name}` },
    { source: "gep", weight: 0.35, note: "Live shop & board from game events" },
  ];
  const shopT = RECOMMENDATION_THRESHOLDS.shop;
  if (history.windowSize >= shopT.historyEvidenceWindowMin) {
    evidence.push({
      source: "match_history",
      weight: 0.2,
      note: history.favoriteComp
        ? `Recent preference: ${history.favoriteComp} (${history.windowSize} games)`
        : `${history.windowSize} recent games — weak comp preference signal`,
    });
  }
  const c = combineEvidenceWeighted([
    { score: confidence, weight: 1 },
    ...(history.top4Rate != null ? [{ score: history.top4Rate, weight: 0.15 }] : []),
  ]);

  if (c < shopT.minMappedConfidence) return null;

  return {
    id: recId("shop", rec.name, now),
    category: "shop",
    title: `${rec.name} — ${rec.priority.replace("-", " ")}`,
    detail: rec.reason,
    confidence: clamp01(c),
    risk,
    urgency,
    reasoning: [
      rec.reason,
      ...(rec.bestComps.length > 0
        ? [`Paired with meta comps: ${rec.bestComps.slice(0, 3).join(", ")}`]
        : []),
    ],
    evidence,
    createdAtMs: now,
    payload: { shopValue: rec.value, bestComps: rec.bestComps },
  };
}

export function shopRecommendations(input: RecommendationEngineInput, nowMs = Date.now()): AllyRecommendation[] {
  const { signals, matchHistory } = input;
  if (!signals.inGame) return [];

  const out: AllyRecommendation[] = [];
  const traitHint = traitProgressShopHint(signals.boardUnitNames, nowMs);
  if (traitHint) out.push(traitHint);

  if (signals.shopUnitNames.length === 0) return out;

  const gold = signals.gold ?? 0;
  const recs = analyzeShop(
    signals.shopUnitNames,
    signals.boardUnitNames,
    gold,
    signals.activeCompName,
    "standard",
  );

  for (const r of recs.slice(0, RECOMMENDATION_THRESHOLDS.shop.maxRecommendations)) {
    const m = mapShop(r, signals, matchHistory, nowMs);
    if (m) out.push(m);
  }
  return out;
}
