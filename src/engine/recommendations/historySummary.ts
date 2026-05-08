import type { PlayerMatchHistorySummary } from "@ally/shared-types";
import type { PersonalMatchRecord } from "@/services/indexedDbService";

export function summarizePersonalMatches(
  matches: PersonalMatchRecord[],
  windowSize = 20,
): PlayerMatchHistorySummary {
  const slice = [...matches]
    .sort((a, b) => {
      const tb = b.createdAt ?? b.timestamp ?? 0;
      const ta = a.createdAt ?? a.timestamp ?? 0;
      return tb - ta;
    })
    .slice(0, windowSize);

  const n = slice.length;
  if (n === 0) {
    return {
      windowSize: 0,
      avgPlacement: null,
      top4Rate: null,
      favoriteComp: null,
      compFrequency: {},
    };
  }

  const placements = slice.map((m) => m.placement).filter((p): p is number => p != null && p > 0);
  const avgPlacement =
    placements.length > 0 ? placements.reduce((a, b) => a + b, 0) / placements.length : null;
  const top4Count = placements.filter((p) => p <= 4).length;
  const top4Rate = placements.length > 0 ? top4Count / placements.length : null;

  const compFrequency: Record<string, number> = {};
  for (const m of slice) {
    const c = m.compName ?? m.comp;
    if (!c) continue;
    compFrequency[c] = (compFrequency[c] ?? 0) + 1;
  }

  let favoriteComp: string | null = null;
  let best = 0;
  for (const [k, v] of Object.entries(compFrequency)) {
    if (v > best) {
      best = v;
      favoriteComp = k;
    }
  }

  return {
    windowSize: n,
    avgPlacement,
    top4Rate,
    favoriteComp,
    compFrequency,
  };
}
