import type { AllyRecommendation, RecommendationEngineInput } from "@ally/shared-types";

export function economyRecommendations(input: RecommendationEngineInput, nowMs = Date.now()): AllyRecommendation[] {
  const { signals, matchHistory } = input;
  if (!signals.inGame) return [];

  const out: AllyRecommendation[] = [];
  const gold = signals.gold;
  const hp = signals.localPlayerHealth;

  if (gold != null && hp != null && hp > 40 && gold < 50) {
    out.push({
      id: `economy:interest-build:${nowMs}`,
      category: "economy",
      title: "Build toward interest",
      detail:
        "Below 50g — in live games, use streaks, efficient sells, and carousel to reach 10/20/50 gold breakpoints when healthy.",
      confidence: 0.42,
      risk: "low",
      urgency: "low",
      reasoning: [`Current gold ${gold} with HP ${hp} — interest stacks add up over neutral rounds.`],
      evidence: [
        { source: "heuristic", weight: 0.55, note: "Interest breakpoint planning" },
        { source: "gep", weight: 0.45, note: "Live gold & HP" },
      ],
      createdAtMs: nowMs,
    });
  }

  if (
    gold != null &&
    gold >= 50 &&
    hp != null &&
    hp > 40 &&
    matchHistory.avgPlacement != null &&
    matchHistory.avgPlacement > 5.2
  ) {
    out.push({
      id: `economy:bank:${nowMs}`,
      category: "economy",
      title: "Consider banking interest",
      detail:
        "Strong gold with healthy HP — recent placements suggest stabilizing econ before greeding rolls.",
      confidence: 0.55,
      risk: "low",
      urgency: "low",
      reasoning: [
        `Recent avg placement ≈ ${matchHistory.avgPlacement.toFixed(1)} over ${matchHistory.windowSize} games.`,
        `Gold ${gold} at HP ${hp}: interest breakpoints often matter more than one extra shop roll.`,
      ],
      evidence: [
        { source: "match_history", weight: 0.45, note: "Personal placement trend" },
        { source: "gep", weight: 0.35, note: "Live gold & HP" },
        { source: "heuristic", weight: 0.2, note: "Breakpoint heuristic" },
      ],
      createdAtMs: nowMs,
    });
  }

  if (hp != null && hp <= 25 && gold != null && gold >= 0) {
    out.push({
      id: `economy:rolldown:${nowMs}`,
      category: "economy",
      title: "Low health — consider rolling",
      detail: "Stabilize board before damage eliminates you.",
      confidence: 0.62,
      risk: "medium",
      urgency: "high",
      reasoning: [
        `Health at ${hp} — bad combat rounds compound quickly.`,
        `Gold ${gold} gives room to roll for two-cost upgrades or verticals.`,
      ],
      evidence: [
        { source: "gep", weight: 0.6, note: "Live HP & econ" },
        { source: "heuristic", weight: 0.25, note: "Stabilization heuristic" },
      ],
      createdAtMs: nowMs,
    });
  }

  return out;
}
