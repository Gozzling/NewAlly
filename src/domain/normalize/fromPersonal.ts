import type { CanonicalMatch } from "@ally/shared-types";
import type { PersonalMatchRecord } from "@/services/indexedDbService";
import { detectCompFromUnits } from "@/shared/gameEngine";
import { collectMatchAugmentsFromRecord } from "./augmentCollect";
import { augmentSlotFromIdentifier } from "./augmentSnapshot";
import { inferTraitsFromUnitNames } from "./inferTraits";
import { toCanonicalUnitSlots } from "./matchUnits";

function stripTftId(id: string): string {
  if (!id.startsWith("TFT")) return id;
  return id.split("_").pop() ?? id;
}

export function normalizePersonalMatch(record: PersonalMatchRecord): CanonicalMatch {
  const unitBuilds = record.unitBuilds ?? [];
  const unitsFromBuilds = unitBuilds.map((u) => ({
    name: stripTftId(u.name.trim()),
    starLevel: u.starLevel ?? null,
    items: (u.items ?? []).map(stripTftId),
  }));

  const unitsFromNames =
    unitsFromBuilds.length > 0
      ? unitsFromBuilds
      : (record.units ?? []).map((name) => ({
          name: stripTftId(name.trim()),
          starLevel: null as number | null,
          items: [] as string[],
        }));

  const unitNames = unitsFromNames.map((u) => u.name);
  const compLabel =
    record.compName?.trim() ||
    record.comp?.trim() ||
    detectCompFromUnits(unitNames) ||
    null;

  return {
    id: record.id,
    source: "gep_personal",
    placement: record.placement,
    level: null,
    playedAt: record.timestamp ?? record.createdAt,
    gameLengthSec: record.duration,
    gameType: "standard",
    compLabel: compLabel === "Mixed" ? null : compLabel,
    summonerName: record.summonerName ?? null,
    region: record.region ?? null,
    units: toCanonicalUnitSlots(unitsFromNames),
    augments: collectMatchAugmentsFromRecord(record).map((displayName) =>
      augmentSlotFromIdentifier(null, displayName),
    ),
    traits: inferTraitsFromUnitNames(unitNames),
    syncStatus: record.syncStatus,
  };
}
