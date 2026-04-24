import { riotPlatformFetch, jsonResponse, errorResponse } from "../_shared/riot.ts";

interface Summoner {
  id: string;
  puuid: string;
  name: string;
  summonerLevel: number;
  profileIconId: number;
}

interface LeagueEntry {
  queueType: string;
  tier: string;
  rank: string;
  leaguePoints: number;
}

// Combines summoner + league entries into a single PlayerCard shape
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

    if (!name) {
      return jsonResponse({ error: "Missing 'name'", code: "BAD_REQUEST" }, 400);
    }

    const summoner = await riotPlatformFetch<Summoner>(
      region,
      `/tft/summoner/v1/summoners/by-name/${encodeURIComponent(name)}`,
    );

    const entries = await riotPlatformFetch<LeagueEntry[]>(
      region,
      `/tft/league/v1/entries/by-summoner/${encodeURIComponent(summoner.id)}`,
    );

    const ranked = entries.find((e) => e.queueType === "RANKED_TFT");

    const card = {
      name: summoner.name,
      puuid: summoner.puuid,
      level: summoner.summonerLevel,
      profileIconId: summoner.profileIconId,
      rank: ranked?.rank ?? null,
      tier: ranked?.tier ?? null,
      lp: ranked?.leaguePoints ?? null,
    };

    return jsonResponse(card);
  } catch (err) {
    return errorResponse(err);
  }
});
