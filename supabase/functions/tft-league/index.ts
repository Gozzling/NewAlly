import {
  riotPlatformFetch,
  jsonResponse,
  errorResponse,
  validatePuuid,
} from "../_shared/riot.ts";

// GET /tft/league/v1/entries/by-puuid/{puuid}
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

    const puuid = String(body.puuid ?? body.summonerId ?? "").trim();
    const region = String(body.region ?? "euw1").toLowerCase();

    validatePuuid(puuid);

    const data = await riotPlatformFetch(
      region,
      `/tft/league/v1/entries/by-puuid/${encodeURIComponent(puuid)}`,
    );

    return jsonResponse(data);
  } catch (err) {
    return errorResponse(err);
  }
});
