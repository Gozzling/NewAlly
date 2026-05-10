import { riotPlatformFetchOrNull, jsonResponse, errorResponse } from "../_shared/riot.ts";

// Platform: /lol/spectator/tft/v5/active-games/by-puuid/{puuid} (twisted SpectatorTFTV5Api)
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

    if (!puuid) {
      return jsonResponse({ error: "Missing 'puuid'", code: "BAD_REQUEST" }, 400);
    }

    const data = await riotPlatformFetchOrNull<Record<string, unknown>>(
      region,
      `/lol/spectator/tft/v5/active-games/by-puuid/${encodeURIComponent(puuid)}`,
    );

    return jsonResponse(data);
  } catch (err) {
    return errorResponse(err);
  }
});
