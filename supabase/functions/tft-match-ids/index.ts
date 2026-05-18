import {
  riotRegionalFetch,
  jsonResponse,
  errorResponse,
  validatePuuid,
  validateRegion,
} from "../_shared/riot.ts";

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
    const region = validateRegion(String(body.region ?? "euw1"));
    const rawCount = Number(body.count ?? 20);
    const rawOffset = Number(body.offset ?? body.start ?? 0);
    const count = Number.isFinite(rawCount) ? Math.min(Math.max(Math.floor(rawCount), 1), 100) : 20;
    const offset = Number.isFinite(rawOffset) ? Math.max(Math.floor(rawOffset), 0) : 0;

    validatePuuid(puuid);

    const data = await riotRegionalFetch<string[]>(
      region,
      `/tft/match/v1/matches/by-puuid/${encodeURIComponent(puuid)}/ids?count=${count}&start=${offset}`,
    );

    return jsonResponse(data);
  } catch (err) {
    return errorResponse(err);
  }
});
