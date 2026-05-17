import {
  riotRegionalFetch,
  jsonResponse,
  errorResponse,
  validateMatchId,
  validateRegion,
} from "../_shared/riot.ts";

// GET /tft/match/v1/matches/{matchId}
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
    const matchId = String(body.matchId ?? "").trim();
    const region = validateRegion(String(body.region ?? "euw1"));

    validateMatchId(matchId);

    const data = await riotRegionalFetch(
      region,
      `/tft/match/v1/matches/${encodeURIComponent(matchId)}`,
    );

    return jsonResponse(data);
  } catch (err) {
    return errorResponse(err);
  }
});
