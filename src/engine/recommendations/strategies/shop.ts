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

const MIN_TRAIT_HISTORY_GAMES = 4;

/** Early board: suggest shop cost focus from trait progress (e.g. Team Builder with no shop snapshot). */
function traitProgressShopHint(
  boardUnitNames: string[],
  nowMs: number,
  matchHistory: PlayerMatchHistorySummary,
): AllyRecommendation | null {
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
    .sort((a, b) => {
      const ua = matchHistory.unitPerformance[a.name]?.winRate ?? 0;
      const ub = matchHistory.unitPerformance[b.name]?.winRate ?? 0;
      if (ub !== ua) return ub - ua;
      return a.cost - b.cost || a.name.localeCompare(b.name);
    })
    .slice(0, 4)
    .map((u) => u.name);

  const historyKey = `${top.trait}:${top.nextCount}`;
  const hist = matchHistory.traitThresholdHistory[historyKey];
  let personalSuffix = "";
  let extraConfidence = 0;
  const evidence: AllyRecommendation["evidence"] = [
    { source: "static_meta", weight: 0.65, note: "Trait thresholds & unit costs" },
    { source: "heuristic", weight: 0.35, note: "Early board shop planning" },
  ];
  const reasoning: string[] = [
    `Next breakpoint: ${top.nextCount} ${top.trait} (${have} on board).`,
    ...(examples.length ? [`Examples: ${examples.join(", ")}.`] : []),
  ];

  let traitCompWinBlurb = "";
  let bestTraitTrend: { name: string; winRate: number; n: number } | null = null;
  for (const traitName of Object.keys(traitCounts)) {
    const tp = matchHistory.traitPerformance[traitName];
    if (tp && tp.playCount >= 4 && tp.winRate >= 0.35) {
      if (!bestTraitTrend || tp.winRate > bestTraitTrend.winRate) {
        bestTraitTrend = { name: traitName, winRate: tp.winRate, n: tp.playCount };
      }
    }
  }
  if (bestTraitTrend && bestTraitTrend.winRate >= 0.45) {
    const pct = Math.round(bestTraitTrend.winRate * 100);
    traitCompWinBlurb = ` You have ${pct}% win rate with ${bestTraitTrend.name} comps (${bestTraitTrend.n} games).`;
    reasoning.push(
      `Personal trend: ${pct}% win rate when you run boards that include ${bestTraitTrend.name}.`,
    );
    evidence.push({
      source: "match_history",
      weight: 0.35,
      note: `${bestTraitTrend.name} trait — ${pct}% win rate`,
    });
  }

  if (
    hist &&
    hist.games >= MIN_TRAIT_HISTORY_GAMES &&
    hist.top4Rate != null &&
    hist.avgPlacement != null
  ) {
    const pct = Math.round(hist.top4Rate * 100);
    const rollTarget = examples[0] ?? costPhrase;
    personalSuffix = ` You top-4 in ${pct}% of tracked games when you hit ${top.nextCount} ${top.trait} (${hist.games} games, avg ${hist.avgPlacement.toFixed(1)}) — prioritize rolling for ${rollTarget}.`;
    extraConfidence = Math.min(0.2, (hist.top4Rate - 0.45) * 0.45 + 0.06);
    evidence.push({
      source: "match_history",
      weight: 0.5,
      note: `${historyKey}: ${hist.games} games, ${pct}% top-4`,
    });
    reasoning.push(
      `Personal trend: ${pct}% top-4 when reaching ${top.nextCount}+ ${top.trait} across ${hist.games} logged games.`,
    );
  }

  const detail = `You have ${have} ${top.trait} — add ${top.need} more for the ${top.nextCount}-${top.trait} bonus. In shop rolls, lean toward ${costPhrase} picks${examples.length ? ` (e.g. ${examples.join(", ")})` : ""}.${traitCompWinBlurb}${personalSuffix}`;

  const title =
    hist && hist.games >= MIN_TRAIT_HISTORY_GAMES && hist.top4Rate != null && hist.top4Rate >= 0.55
      ? `${Math.round(hist.top4Rate * 100)}% top-4 at ${top.nextCount} ${top.trait}`
      : `Shop focus — ${top.nextCount} ${top.trait}`;

  return {
    id: `shop:trait:${top.trait}:${nowMs}`,
    category: "shop",
    title,
    detail,
    confidence: clamp01(0.52 + extraConfidence),
    risk: "low",
    urgency: n <= 2 ? "medium" : "low",
    reasoning,
    evidence,
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
  if (history.windowSize >= 5) {
    evidence.push({
      source: "match_history",
      weight: 0.2,
      note: history.favoriteComp
        ? `Recent preference: ${history.favoriteComp} (${history.windowSize} games)`
        : `${history.windowSize} recent games — weak comp preference signal`,
    });
  }
  const canon =
    UNITS.find((u) => unitMatchKey(u.name) === unitMatchKey(rec.name))?.name ?? rec.name;
  const uPerf = history.unitPerformance[canon];
  let historyConfidenceBoost = 0;
  const historyReason: string[] = [];
  if (uPerf && uPerf.playCount >= 3 && uPerf.winRate >= 0.4) {
    historyConfidenceBoost = Math.min(0.14, (uPerf.winRate - 0.35) * 0.22);
    evidence.push({
      source: "match_history",
      weight: 0.45,
      note: `${canon}: ${Math.round(uPerf.winRate * 100)}% wins in ${uPerf.playCount} games`,
    });
    historyReason.push(
      `You have ${Math.round(uPerf.winRate * 100)}% win rate when fielding ${canon} across ${uPerf.playCount} recent games.`,
    );
  }

  const c = combineEvidenceWeighted([
    { score: confidence + historyConfidenceBoost, weight: 1 },
    ...(history.top4Rate != null ? [{ score: history.top4Rate, weight: 0.15 }] : []),
  ]);

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
      ...historyReason,
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
  const traitHint = traitProgressShopHint(signals.boardUnitNames, nowMs, matchHistory);
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

  for (const r of recs.slice(0, 6)) {
    const m = mapShop(r, signals, matchHistory, nowMs);
    if (m) out.push(m);
  }
  return out;
}
