import { useMemo } from "react";
import type { EnrichedMatch } from "@ally/shared-types";
import { pipelinePersonalMatches } from "@/domain/pipeline";
import type { PersonalMatchRecord } from "@/services/indexedDbService";

function normSummoner(name: string | undefined | null): string {
  return (name ?? "").split("#")[0]?.trim().toLowerCase() ?? "";
}

export function useEnrichedPersonalMatches(
  records: PersonalMatchRecord[],
  summonerName?: string | null,
): EnrichedMatch[] {
  return useMemo(() => {
    let rows = records;
    if (summonerName?.trim()) {
      const want = normSummoner(summonerName);
      rows = rows.filter((r) => normSummoner(r.summonerName) === want);
    }
    return pipelinePersonalMatches(rows);
  }, [records, summonerName]);
}
