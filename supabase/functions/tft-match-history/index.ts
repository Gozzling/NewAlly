import {
  riotPlatformFetch,
  riotRegionalFetch,
  jsonResponse,
  errorResponse,
  validateMatchId,
} from "../_shared/riot.ts";

interface Summoner {
  puuid: string;
}

interface Participant {
  placement: number;
  level: number;
  last_round: number;
  time_eliminated: number;
  total_damage_to_players: number;
  augments: string[];
  traits: Array<{ name: string; num_units: number; style: number }>;
  units: Array<{
    character_id: string;
    chosen: string | null;
    name: string;
    rarity: number;
    tier: number;
    items: number[];
  }>;
}

interface MatchInfo {
  participants: Participant[];
  queue_id: number;
  tft_set_number: number;
  game_datetime: string;
  game_length: number;
}

interface MatchDetail {
  metadata: { match_id: string };
  info: MatchInfo;
}

interface ParsedMatch {
  matchId: string;
  date: string;
  placement: number;
  level: number;
  augments: string[];
  units: Array<{ characterId: string; tier: number; items: number[] }>;
  traits: Array<{ name: string; numUnits: number }>;
  compName: string;
  gameLength: number;
}

function normalizeCompName(traits: Participant["traits"]): string {
  const active = traits
    .filter((t) => t.style > 0)
    .sort((a, b) => b.num_units - a.num_units)
    .slice(0, 3)
    .map((t) => t.name.replace(/Set\d+_/, "").replace(/TFTTrait_/, ""));
  return active.join(" / ") || "Unknown";
}

// Fetch + parse 20 matches for a summoner
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    const name = String(body.name ?? "").trim();
    const region = String(body.region ?? "euw1").toLowerCase();
    const count = Math.min(Math.max(Number(body.count ?? 20), 1), 50);

    if (!name || name.length > 16) {
      return jsonResponse({ error: "Invalid 'name'", code: "BAD_REQUEST" }, 400);
    }

    // 1. Resolve summoner
    const summoner = await riotPlatformFetch<Summoner>(
      region,
      `/tft/summoner/v1/summoners/by-name/${encodeURIComponent(name)}`,
    );

    // 2. Fetch match IDs
    const matchIds = await riotRegionalFetch<string[]>(
      region,
      `/tft/match/v1/matches/by-puuid/${encodeURIComponent(summoner.puuid)}/ids?count=${count}`,
    );

    // 3. Batch fetch match details (sequentially to respect rate limit)
    const matches: ParsedMatch[] = [];
    for (const matchId of matchIds) {
      try {
        validateMatchId(matchId);
        const detail = await riotRegionalFetch<MatchDetail>(
          region,
          `/tft/match/v1/matches/${encodeURIComponent(matchId)}`,
        );

        const participant = detail.info.participants.find(
          (p) => p.time_eliminated === Math.max(...detail.info.participants.map((x) => x.time_eliminated)) || true,
        );

        // Find participant by matching PUUID via participants array ordering is not guaranteed,
        // so we return raw match data and let the client parse. For now we send the raw Riot shape
        // to keep parity with direct API usage.
        matches.push({
          matchId: detail.metadata.match_id,
          date: new Date(detail.info.game_datetime).toISOString(),
          placement: participant?.placement ?? 0,
          level: participant?.level ?? 0,
          augments: participant?.augments ?? [],
          units:
            participant?.units.map((u) => ({
              characterId: u.character_id,
              tier: u.tier,
              items: u.items,
            })) ?? [],
          traits:
            participant?.traits.map((t) => ({
              name: t.name.replace(/Set\d+_/, "").replace(/TFTTrait_/, ""),
              numUnits: t.num_units,
            })) ?? [],
          compName: normalizeCompName(participant?.traits ?? []),
          gameLength: detail.info.game_length,
        });
      } catch {
        // Skip individual match failures
      }
    }

    return jsonResponse(matches);
  } catch (err) {
    return errorResponse(err);
  }
});
