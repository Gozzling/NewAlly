import {
  riotPlatformFetch,
  jsonResponse,
  errorResponse,
  validateRegion,
} from "../_shared/riot.ts";

// GET /tft/status/v1/platform-data
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

    const region = validateRegion(String(body.region ?? "euw1"));

    const data = await riotPlatformFetch(
      region,
      "/tft/status/v1/platform-data",
    );

    return jsonResponse(data);
  } catch (err) {
    return errorResponse(err);
  }
});
