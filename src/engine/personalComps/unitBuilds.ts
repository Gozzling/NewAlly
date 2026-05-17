import type { PersonalMatchUnitBuild } from "@ally/shared-types";
import type { PersonalMatchRecord } from "@/services/indexedDbService";
import type { BoardUnit } from "@/types/tft";

export function extractUnitBuildsFromBoard(boardUnits: BoardUnit[]): PersonalMatchUnitBuild[] {
  return boardUnits
    .filter((u) => u.name?.trim())
    .map((u) => ({
      name: u.name.trim(),
      items: [...(u.items ?? [])].filter(Boolean),
      starLevel: u.starLevel > 0 ? u.starLevel : undefined,
    }));
}

/** Prefer stored unit builds; fall back to unit names only (items not attributed). */
export function getMatchUnitBuilds(record: PersonalMatchRecord): PersonalMatchUnitBuild[] {
  if (record.unitBuilds?.length) {
    return record.unitBuilds.map((u) => ({
      name: u.name,
      items: [...(u.items ?? [])],
      starLevel: u.starLevel,
    }));
  }
  return (record.units ?? []).map((name) => ({ name, items: [] }));
}

export function flattenItemsFromBuilds(builds: PersonalMatchUnitBuild[]): string[] {
  return builds.flatMap((u) => u.items);
}
