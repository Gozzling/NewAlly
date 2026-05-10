export class RiotError extends Error {
  code: string;
  status: number;
  constructor(message: string, code: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
    this.name = "RiotError";
  }
}

function regionToContinent(region: string): string {
  switch (region.toLowerCase()) {
    case "br1":
    case "la1":
    case "la2":
    case "na1":
    case "americas":
      return "americas";
    case "eun1":
    case "euw1":
    case "tr1":
    case "ru":
    case "europe":
      return "europe";
    case "jp1":
    case "kr":
    case "asia":
      return "asia";
    case "sea":
    case "oc1":
      return "sea";
    default:
      return "europe";
  }
}

function getApiKey(): string {
  const key = Deno.env.get("RIOT_API_KEY");
  if (!key) throw new RiotError("RIOT_API_KEY secret not set", "NO_KEY", 500);
  return key;
}

const windowMs = 1000;
const maxRequests = 20;
let timestamps: number[] = [];

async function waitForRateLimit(): Promise<void> {
  const now = Date.now();
  timestamps = timestamps.filter((t) => now - t < windowMs);
  if (timestamps.length >= maxRequests) {
    const oldest = timestamps[0];
    const delay = windowMs - (now - oldest) + 50;
    await new Promise((r) => setTimeout(r, delay));
    return waitForRateLimit();
  }
  timestamps.push(Date.now());
}

export async function riotAccountFetch(
  region: string,
  gameName: string,
  tagLine: string,
): Promise<{ puuid: string; gameName: string; tagLine: string }> {
  await waitForRateLimit();
  const continent = regionToContinent(region);
  const url = `https://${continent}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
  const res = await fetch(url, { headers: { "X-Riot-Token": getApiKey() } });
  if (res.status === 404) throw new RiotError("Player not found", "NOT_FOUND", 404);
  if (res.status === 403) throw new RiotError("Invalid API key", "FORBIDDEN", 403);
  if (!res.ok) throw new RiotError(`Riot API error ${res.status}`, "API_ERROR", res.status);
  return res.json();
}

export async function riotPlatformFetch<T>(
  region: string,
  endpoint: string,
): Promise<T> {
  await waitForRateLimit();
  const apiKey = getApiKey();
  const url = `https://${region}.api.riotgames.com${endpoint}`;

  const res = await fetch(url, {
    headers: { "X-Riot-Token": apiKey },
  });

  if (res.status === 404) throw new RiotError("Player not found", "NOT_FOUND", 404);
  if (res.status === 429) throw new RiotError("Rate limited by Riot", "RATE_LIMIT", 429);
  if (res.status === 403) throw new RiotError("Invalid API key", "FORBIDDEN", 403);
  if (!res.ok) throw new RiotError(`Riot API error ${res.status}`, "API_ERROR", res.status);

  return (await res.json()) as T;
}

/** Platform host; 404 → null (used for spectator “no active game”). */
export async function riotPlatformFetchOrNull<T>(
  region: string,
  endpoint: string,
): Promise<T | null> {
  await waitForRateLimit();
  const apiKey = getApiKey();
  const url = `https://${region}.api.riotgames.com${endpoint}`;

  const res = await fetch(url, {
    headers: { "X-Riot-Token": apiKey },
  });

  if (res.status === 404) return null;
  if (res.status === 429) throw new RiotError("Rate limited by Riot", "RATE_LIMIT", 429);
  if (res.status === 403) throw new RiotError("Invalid API key", "FORBIDDEN", 403);
  if (!res.ok) throw new RiotError(`Riot API error ${res.status}`, "API_ERROR", res.status);

  const text = await res.text();
  if (!text || !text.trim()) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new RiotError("Riot returned non-JSON body for spectator", "API_ERROR", 502);
  }
}

export async function riotRegionalFetch<T>(
  region: string,
  endpoint: string,
): Promise<T> {
  await waitForRateLimit();
  const apiKey = getApiKey();
  const continent = regionToContinent(region);
  const url = `https://${continent}.api.riotgames.com${endpoint}`;

  const res = await fetch(url, {
    headers: { "X-Riot-Token": apiKey },
  });

  if (res.status === 404) throw new RiotError("Data not found", "NOT_FOUND", 404);
  if (res.status === 429) throw new RiotError("Rate limited by Riot", "RATE_LIMIT", 429);
  if (res.status === 403) throw new RiotError("Invalid API key", "FORBIDDEN", 403);
  if (!res.ok) throw new RiotError(`Riot API error ${res.status}`, "API_ERROR", res.status);

  return (await res.json()) as T;
}

export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    },
  });
}

export function errorResponse(err: unknown): Response {
  if (err instanceof RiotError) {
    return jsonResponse(
      { error: err.message, code: err.code },
      err.status >= 500 ? 502 : err.status,
    );
  }
  const message = err instanceof Error ? err.message : "Unknown error";
  return jsonResponse({ error: message, code: "INTERNAL_ERROR" }, 500);
}