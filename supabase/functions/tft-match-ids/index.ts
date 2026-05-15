import {
  riotRegionalFetch,
  jsonResponse,
  errorResponse,
  validatePuuid,
} from "../_shared/riot.ts";

// GET /tft/match/v1/matches/by-puuid/{puuid}/ids
function boundedInteger(value: unknown, fallback: number, min: number, max: number): number {
  const n = Number(value ?? fallback);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(Math.trunc(n), min), max);
}

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
    const count = boundedInteger(body.count, 20, 1, 100);
    const offset = boundedInteger(body.offset ?? body.start, 0, 0, 10_000);

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
