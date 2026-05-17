import type { CanonicalMatch } from "@ally/shared-types";
import type { Match } from "@/types/riot";

/** Bridge enriched canonical rows into existing stats helpers that expect `Match`. */
export function canonicalToLegacyMatch(c: CanonicalMatch): Match {
  return {
    matchId: c.id,
    placement: c.placement ?? 8,
    level: c.level ?? 0,
    date: new Date(c.playedAt),
    gameLength: c.gameLengthSec ?? 0,
    gameType: c.gameType ?? "standard",
    units: c.units.map((u) => u.displayName),
    augments: c.augments.map((a) => a.displayName),
    traits: c.traits.map((t) => t.displayName),
    comp: c.compLabel,
  };
}
