import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  fetchMatchIdsSupabase: vi.fn(),
}));

vi.mock("./supabaseClient", () => ({
  hasSupabase: () => true,
}));

vi.mock("./supabaseService", () => {
  class SupabaseError extends Error {
    code: string;

    constructor(message: string, code: string) {
      super(message);
      this.name = "SupabaseError";
      this.code = code;
    }
  }

  return {
    fetchSummonerByNameSupabase: vi.fn(),
    fetchLeagueEntriesSupabase: vi.fn(),
    fetchMatchIdsSupabase: mocks.fetchMatchIdsSupabase,
    fetchMatchDetailSupabase: vi.fn(),
    fetchPlayerCardSupabase: vi.fn(),
    fetchServerStatusSupabase: vi.fn(),
    fetchActiveGameSupabase: vi.fn(),
    SupabaseError,
  };
});

import { fetchMatchIds } from "./riotApiClient";

describe("fetchMatchIds", () => {
  beforeEach(() => {
    localStorage.clear();
    mocks.fetchMatchIdsSupabase.mockReset();
  });

  it("forwards pagination offset to the Supabase match ID function", async () => {
    const log = vi.fn();
    mocks.fetchMatchIdsSupabase.mockResolvedValue(["NA1_123"]);

    await expect(fetchMatchIds("puuid-1", "na1", "americas", 100, 200, log)).resolves.toEqual(["NA1_123"]);

    expect(mocks.fetchMatchIdsSupabase).toHaveBeenCalledWith("puuid-1", "na1", 100, 200, log);
  });
});
