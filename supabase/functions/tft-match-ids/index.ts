import { riotRegionalFetch, jsonResponse, errorResponse } from "../_shared/riot.ts";

// GET /tft/match/v1/matches/by-puuid/{puuid}/ids
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
    const puuid = String(body.puuid ?? "").trim();
    const region = String(body.region ?? "euw1").toLowerCase();
    const count = Math.min(Math.max(Number(body.count ?? 20), 1), 50);

    if (!puuid) {
      return jsonResponse({ error: "Missing 'puuid'", code: "BAD_REQUEST" }, 400);
    }

    const data = await riotRegionalFetch<string[]>(
      region,
      `/tft/match/v1/matches/by-puuid/${encodeURIComponent(puuid)}/ids?count=${count}`,
    );

    return jsonResponse(data);
  } catch (err) {
    return errorResponse(err);
  }
});
