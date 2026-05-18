import type { CanonicalMatch, CanonicalTraitSlot } from "@ally/shared-types";
import type { Match, MatchDetail, TftParticipant } from "@/types/riot";
import { augmentSlotFromIdentifier } from "./augmentSnapshot";
import { legacyTraitNamesToSlots } from "./inferTraits";
import { toCanonicalUnitSlots } from "./matchUnits";

function normalizeCompName(
  traits: TftParticipant["traits"],
): string | null {
  const active = traits
    .filter((t) => t.num_units > 0)
    .sort((a, b) => b.num_units - a.num_units)
    .slice(0, 3)
    .map((t) => t.name.replace(/^TFT\d+_/i, "").replace(/([A-Z])/g, " $1").trim());
  return active.length > 0 ? active.join(" / ") : null;
}

function riotTraitsToCanonical(
  traits: TftParticipant["traits"],
): CanonicalTraitSlot[] {
  return traits
    .filter((t) => t.num_units > 0)
    .sort((a, b) => b.num_units - a.num_units)
    .map((t) => ({
      rawId: t.name,
      displayName: t.name,
      numUnits: t.num_units,
      tierCurrent: t.tier_current,
      tierTotal: t.tier_total,
      knownInCatalog: false,
    }));
}

function participantToCanonical(
  detail: MatchDetail,
  participant: TftParticipant,
): CanonicalMatch {
  const units = toCanonicalUnitSlots(
    participant.units.map((u) => ({
      name: u.character_id || u.name || "",
      starLevel: u.tier > 0 ? u.tier : null,
      items: u.itemNames ?? [],
    })),
  );

  const traits = riotTraitsToCanonical(participant.traits);

  return {
    id: detail.metadata.match_id,
    source: "riot_api",
    placement: participant.placement,
    level: participant.level,
    playedAt: detail.info.game_datetime,
    gameLengthSec: Math.round(detail.info.game_length),
    gameType: detail.info.tft_game_type,
    compLabel: normalizeCompName(participant.traits),
    summonerName: null,
    region: null,
    units,
    augments: (participant.augments ?? [])
      .map((rawId) => augmentSlotFromIdentifier(rawId))
      .filter((slot) => slot.displayName.length > 0),
    traits,
  };
}

export function normalizeRiotMatchDetail(
  detail: MatchDetail,
  puuid: string,
): CanonicalMatch {
  const me = detail.info.participants.find((p) => p.puuid === puuid);
  if (!me) {
    return {
      id: detail.metadata.match_id,
      source: "riot_api",
      placement: null,
      level: null,
      playedAt: detail.info.game_datetime,
      gameLengthSec: Math.round(detail.info.game_length),
      gameType: detail.info.tft_game_type,
      compLabel: null,
      summonerName: null,
      region: null,
      units: [],
      augments: [],
      traits: [],
    };
  }
  return participantToCanonical(detail, me);
}

/** Lossy path when only legacy `Match` is available (uses optional rich fields when present). */
export function normalizeLegacyRiotMatch(match: Match): CanonicalMatch {
  const unitBuilds =
    match.unitBuilds?.length
      ? match.unitBuilds
      : (match.units ?? []).map((name) => ({ name, starLevel: null, items: [] }));

  const traits =
    match.traitLines?.length
      ? match.traitLines.map((t) => ({
          rawId: t.rawId,
          displayName: t.rawId,
          numUnits: t.numUnits,
          tierCurrent: t.tierCurrent ?? 0,
          tierTotal: t.tierTotal ?? 0,
          knownInCatalog: false,
        }))
      : legacyTraitNamesToSlots(match.traits ?? []);

  return {
    id: match.matchId,
    source: "riot_api",
    placement: match.placement,
    level: match.level,
    playedAt: match.date instanceof Date ? match.date.getTime() : Date.now(),
    gameLengthSec: Math.round(match.gameLength),
    gameType: match.gameType,
    compLabel: match.comp,
    summonerName: null,
    region: null,
    units: toCanonicalUnitSlots(unitBuilds),
    augments: (match.augments ?? []).map((displayName) =>
      augmentSlotFromIdentifier(null, displayName),
    ),
    traits,
  };
}
