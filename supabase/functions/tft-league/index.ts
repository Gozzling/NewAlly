import { riotPlatformFetch, jsonResponse, errorResponse } from "../_shared/riot.ts";

// GET /tft/league/v1/entries/by-summoner/{summonerId}
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

    const summonerId = String(body.summonerId ?? "").trim();
    const region = String(body.region ?? "euw1").toLowerCase();

    if (!summonerId) {
      return jsonResponse({ error: "Missing 'summonerId'", code: "BAD_REQUEST" }, 400);
    }

    const data = await riotPlatformFetch(
      region,
      `/tft/league/v1/by-puuid/${encodeURIComponent(summonerId)}`,
    );

    return jsonResponse(data);
  } catch (err) {
    return errorResponse(err);
  }
});
