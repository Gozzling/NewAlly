import { riotPlatformFetch, riotAccountFetch, jsonResponse, errorResponse } from "../_shared/riot.ts";

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
    let gameName = String(body.gameName ?? "").trim();
    let tagLine  = String(body.tagLine  ?? "").trim();
    const region = String(body.region ?? "euw1").toLowerCase();

    // Support combined "GameName#TagLine" in 'name' field
    if (!gameName && body.name) {
      const combined = String(body.name).trim();
      const hashIdx  = combined.lastIndexOf('#');
      if (hashIdx === -1) {
        gameName = combined;
      } else {
        gameName = combined.slice(0, hashIdx);
        tagLine  = combined.slice(hashIdx + 1);
      }
    }

    if (!gameName) {
      return jsonResponse({ error: "Missing 'gameName'", code: "BAD_REQUEST" }, 400);
    }
    if (!tagLine) {
      return jsonResponse({ error: "Missing 'tagLine'", code: "BAD_REQUEST" }, 400);
    }

    // Step 1: resolve GameName#TagLine → PUUID via Riot Account API
    const account   = await riotAccountFetch(region, gameName, tagLine);
    // Step 2: get summoner record by PUUID
    const summoner  = await riotPlatformFetch(region, `/tft/summoner/v1/summoners/by-puuid/${account.puuid}`);

    return jsonResponse({
      id:            summoner.id,
      puuid:         summoner.puuid,
      name:          summoner.name,
      summonerLevel: summoner.summonerLevel,
      profileIconId: summoner.profileIconId,
    });
  } catch (err) {
    return errorResponse(err);
  }
});