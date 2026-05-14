import {
  riotRegionalFetch,
  jsonResponse,
  errorResponse,
  validatePuuid,
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
    const region = String(body.region ?? "euw1").toLowerCase();
    const count = Math.min(Math.max(Number(body.count ?? 20), 1), 100);
    const start = Math.max(Number(body.offset ?? body.start ?? 0), 0);

    validatePuuid(puuid);

    const data = await riotRegionalFetch<string[]>(
      region,
      `/tft/match/v1/matches/by-puuid/${encodeURIComponent(puuid)}/ids?count=${count}&start=${start}`,
    );

    return jsonResponse(data);
  } catch (err) {
    return errorResponse(err);
  }
});
