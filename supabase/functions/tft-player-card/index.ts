import {
  riotPlatformFetch,
  riotAccountFetch,
  jsonResponse,
  errorResponse,
  validateRiotId,
  validateRegion,
} from "../_shared/riot.ts";

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
    const region = validateRegion(String(body.region ?? "euw1"));

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

    validateRiotId(gameName, tagLine);

    const account = await riotAccountFetch(region, gameName, tagLine);
    const summoner = await riotPlatformFetch<{
      puuid: string; summonerLevel: number; profileIconId: number
    }>(region, `/tft/summoner/v1/summoners/by-puuid/${account.puuid}`);

    return jsonResponse({
      name:          `${account.gameName}#${account.tagLine}`,
      puuid:         account.puuid,
      level:         summoner.summonerLevel,
      profileIconId: summoner.profileIconId,
      rank:          null,
      tier:          null,
      lp:            null,
    });

  } catch (err) {
    return errorResponse(err);
  }
});