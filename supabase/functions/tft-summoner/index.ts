import { riotPlatformFetch, jsonResponse, errorResponse } from "../_shared/riot.ts";

// GET /tft/summoner/v1/summoners/by-name/{name}
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
    const name = String(body.name ?? "").trim();
    const region = String(body.region ?? "euw1").toLowerCase();

    if (!name) {
      return jsonResponse({ error: "Missing 'name'", code: "BAD_REQUEST" }, 400);
    }

    const data = await riotPlatformFetch(
      region,
      `/tft/summoner/v1/summoners/by-name/${encodeURIComponent(name)}`,
    );

    return jsonResponse(data);
  } catch (err) {
    return errorResponse(err);
  }
});
