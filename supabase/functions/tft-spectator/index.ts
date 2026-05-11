import { riotPlatformFetchOrNull, jsonResponse, errorResponse } from "../_shared/riot.ts";

// Platform: /lol/spectator/v5/active-games/by-summoner/{encryptedSummonerId} (Riot uses PUUID here)
// POST JSON body: { puuid, region } — same as supabase.functions.invoke from the app.
// GET ?puuid=&region= — for quick checks in the browser (still needs Authorization: Bearer <anon>).
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  if (req.method !== "GET" && req.method !== "POST") {
    return jsonResponse({ error: "Use GET or POST", code: "METHOD_NOT_ALLOWED" }, 405);
  }

  try {
    let puuid = "";
    let region = "euw1";

    if (req.method === "GET") {
      const u = new URL(req.url);
      puuid = String(u.searchParams.get("puuid") ?? "").trim();
      region = String(u.searchParams.get("region") ?? "euw1").toLowerCase();
    } else {
      const body = await req.json().catch(() => ({} as Record<string, unknown>));
      puuid = String(body.puuid ?? "").trim();
      region = String(body.region ?? "euw1").toLowerCase();
    }

    if (!puuid) {
      return jsonResponse({ error: "Missing 'puuid' (body or ?puuid=)", code: "BAD_REQUEST" }, 400);
    }

    console.log(`[tft-spectator] region=${region} puuid=${puuid.slice(0, 8)}…`);

    const data = await riotPlatformFetchOrNull<Record<string, unknown>>(
      region,
      `/lol/spectator/v5/active-games/by-summoner/${encodeURIComponent(puuid)}`,
    );

    if (data === null) {
      console.log("[tft-spectator] Riot 404 or empty — no active TFT game");
    }

    return jsonResponse(data);
  } catch (err) {
    console.error("[tft-spectator]", err);
    return errorResponse(err);
  }
});
