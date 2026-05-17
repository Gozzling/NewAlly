import { useMemo } from "react";
import type { PersonalTopComp } from "@ally/shared-types";
import {
  buildPersonalTopComps,
  type BuildPersonalTopCompsOptions,
} from "@/engine/personalComps";
import type { PersonalMatchRecord } from "@/services/indexedDbService";

function normSummoner(name: string | undefined | null): string {
  return (name ?? "").split("#")[0]?.trim().toLowerCase() ?? "";
}

export function usePersonalTopComps(
  matches: PersonalMatchRecord[],
  options?: BuildPersonalTopCompsOptions & { summonerName?: string | null },
): PersonalTopComp[] {
  const summonerName = options?.summonerName;
  const windowSize = options?.windowSize;
  const minGames = options?.minGames;
  const nowMs = options?.nowMs;

  return useMemo(() => {
    let rows = matches;
    if (summonerName?.trim()) {
      const want = normSummoner(summonerName);
      rows = rows.filter((m) => normSummoner(m.summonerName) === want);
    }
    return buildPersonalTopComps(rows, { windowSize, minGames, nowMs });
  }, [matches, summonerName, windowSize, minGames, nowMs]);
}
