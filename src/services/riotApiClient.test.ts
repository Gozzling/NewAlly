import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { LeagueEntry } from "../types/riot";
import { fetchLeagueEntries, fetchMatchIds } from "./riotApiClient";

const mocks = vi.hoisted(() => ({
  hasSupabase: vi.fn(),
  fetchLeagueEntriesSupabase: vi.fn(),
  fetchMatchIdsSupabase: vi.fn(),
}));

vi.mock("./supabaseClient", () => ({
  hasSupabase: mocks.hasSupabase,
}));

vi.mock("./storageService", () => ({
  getCache: vi.fn(() => null),
  setCache: vi.fn(),
  removeCache: vi.fn(),
  ONE_HOUR: 60 * 60 * 1000,
  ONE_DAY: 24 * 60 * 60 * 1000,
}));

vi.mock("./supabaseService", () => {
  class SupabaseError extends Error {
    code: string;

    constructor(message: string, code: string) {
      super(message);
      this.code = code;
      this.name = "SupabaseError";
    }
  }

  return {
    SupabaseError,
    fetchSummonerByNameSupabase: vi.fn(),
    fetchLeagueEntriesSupabase: mocks.fetchLeagueEntriesSupabase,
    fetchMatchIdsSupabase: mocks.fetchMatchIdsSupabase,
    fetchMatchDetailSupabase: vi.fn(),
    fetchPlayerCardSupabase: vi.fn(),
    fetchServerStatusSupabase: vi.fn(),
    fetchActiveGameSupabase: vi.fn(),
  };
});

describe("riotApiClient", () => {
  beforeEach(() => {
    mocks.hasSupabase.mockReset();
    mocks.fetchLeagueEntriesSupabase.mockReset();
    mocks.fetchMatchIdsSupabase.mockReset();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("passes match-history offsets through the Supabase proxy path", async () => {
    const log = vi.fn();
    mocks.hasSupabase.mockReturnValue(true);
    mocks.fetchMatchIdsSupabase.mockResolvedValue(["EUW1_3"]);

    await expect(fetchMatchIds("puuid-1", "euw1", "europe", 30, 60, log)).resolves.toEqual(["EUW1_3"]);

    expect(mocks.fetchMatchIdsSupabase).toHaveBeenCalledWith("puuid-1", "euw1", 30, 60, log);
  });

  it("uses Riot's entries/by-puuid league endpoint for direct dev fallback", async () => {
    const entries: LeagueEntry[] = [
      {
        leagueId: "league-1",
        queueType: "RANKED_TFT",
        tier: "DIAMOND",
        rank: "II",
        summonerId: "summoner-1",
        summonerName: "Player",
        leaguePoints: 42,
        wins: 10,
        losses: 5,
        veteran: false,
        inactive: false,
        freshBlood: false,
        hotStreak: false,
      },
    ];
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => entries,
    });

    mocks.hasSupabase.mockReturnValue(false);
    vi.stubEnv("VITE_ALLOW_CLIENT_RIOT_KEY", "true");
    localStorage.setItem("tft-ally::riot-api-key", "dev-key");
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchLeagueEntries("puuid-1", "euw1")).resolves.toEqual(entries);

    expect(fetchMock).toHaveBeenCalledWith(
      "https://euw1.api.riotgames.com/tft/league/v1/entries/by-puuid/puuid-1",
      { headers: { "X-Riot-Token": "dev-key" } },
    );
  });
});
