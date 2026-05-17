import type { EnrichedMatch } from "@ally/shared-types";
import type { PersonalMatchRecord } from "@/services/indexedDbService";
import type { Match, MatchDetail } from "@/types/riot";
import { enrichCanonicalMatch } from "./enrich/match";
import { normalizeLegacyRiotMatch, normalizeRiotMatchDetail } from "./normalize/fromRiot";
import { normalizePersonalMatch } from "./normalize/fromPersonal";
import { validateCanonicalMatch } from "./validate/match";

function toEnriched(match: ReturnType<typeof normalizePersonalMatch>): EnrichedMatch {
  const enriched = enrichCanonicalMatch(match);
  return {
    match: enriched,
    validation: validateCanonicalMatch(enriched),
  };
}

export function pipelinePersonalMatch(record: PersonalMatchRecord): EnrichedMatch {
  return toEnriched(normalizePersonalMatch(record));
}

export function pipelinePersonalMatches(records: PersonalMatchRecord[]): EnrichedMatch[] {
  return records.map(pipelinePersonalMatch);
}

export function pipelineRiotMatchDetail(
  detail: MatchDetail,
  puuid: string,
): EnrichedMatch {
  return toEnriched(normalizeRiotMatchDetail(detail, puuid));
}

export function pipelineLegacyRiotMatch(match: Match): EnrichedMatch {
  return toEnriched(normalizeLegacyRiotMatch(match));
}

export function pipelineLegacyRiotMatches(matches: Match[]): EnrichedMatch[] {
  return matches.map(pipelineLegacyRiotMatch);
}
