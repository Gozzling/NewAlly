import type { AllyRecommendation, RecommendationEngineInput } from "@ally/shared-types";
import { clamp01 } from "../confidence";

export function itemRecommendations(input: RecommendationEngineInput, nowMs = Date.now()): AllyRecommendation[] {
  const { signals } = input;
  if (!signals.inGame) return [];

  const out: AllyRecommendation[] = [];
  const labels = signals.craftableLabels ?? [];

  if (labels.length > 0) {
    const top = labels.slice(0, 2);
    out.push({
      id: `items:craft:${nowMs}`,
      category: "items",
      title: "Item slam candidates",
      detail: `You can build: ${top.join("; ")}${labels.length > 2 ? "…" : ""}`,
      confidence: clamp01(0.55 + 0.05 * Math.min(labels.length, 3)),
      risk: "medium",
      urgency: signals.itemMissingCount > 2 ? "medium" : "low",
      reasoning: [
        "Craftable items from components on bench/board (GEP).",
        ...(signals.partialItemBuildLabels?.length
          ? [`Suggested items to build (one component left): ${signals.partialItemBuildLabels.slice(0, 3).join(", ")}`]
          : []),
      ],
      evidence: [
        { source: "gep", weight: 0.6, note: "Item tracker from live game state" },
        { source: "static_meta", weight: 0.25, note: "BIS paths from static comp data (indirect)" },
      ],
      createdAtMs: nowMs,
      payload: { craftableCount: signals.itemCraftableCount, missingCount: signals.itemMissingCount },
    });
  } else if ((signals.partialItemBuildLabels?.length ?? 0) > 0) {
    const labels = signals.partialItemBuildLabels ?? [];
    out.push({
      id: `items:suggested:${nowMs}`,
      category: "items",
      title: "Suggested items to build",
      detail: `Suggested items to build: ${labels.slice(0, 4).join(", ")}`,
      confidence: 0.48,
      risk: "low",
      urgency: "low",
      reasoning: [
        "You already hold part of the recipe — finish the pair on your carry when you hit the missing component.",
      ],
      evidence: [{ source: "gep", weight: 0.55, note: "Item tracker (partial components on bench/board)" }],
      createdAtMs: nowMs,
    });
  }

  return out;
}
