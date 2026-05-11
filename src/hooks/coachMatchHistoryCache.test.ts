import { describe, it, expect, beforeEach, vi } from "vitest";
import { emptyPlayerMatchHistorySummary } from "@/engine/recommendations/historySummary";
import { CURRENT_TFT_SET_NUMBER } from "@/meta/tftCurrentSet";
import {
  clearCoachMatchHistoryMemoryForTests,
  persistCachedCoachSummary,
  readCachedCoachSummary,
} from "./useCoachMatchHistory";

describe("coach match history cache", () => {
  beforeEach(() => {
    localStorage.clear();
    clearCoachMatchHistoryMemoryForTests();
    vi.useRealTimers();
  });

  it("persists and reads the same summary", () => {
    const s = emptyPlayerMatchHistorySummary();
    s.windowSize = 7;
    persistCachedCoachSummary("na1", "test-puuid", s, CURRENT_TFT_SET_NUMBER);
    expect(readCachedCoachSummary("na1", "test-puuid", CURRENT_TFT_SET_NUMBER)).toEqual(s);
  });

  it("drops expired entries (TTL)", () => {
    vi.useFakeTimers();
    const s = emptyPlayerMatchHistorySummary();
    s.windowSize = 2;
    persistCachedCoachSummary("euw1", "exp-puuid", s, CURRENT_TFT_SET_NUMBER);
    expect(readCachedCoachSummary("euw1", "exp-puuid", CURRENT_TFT_SET_NUMBER)).not.toBeNull();
    vi.advanceTimersByTime(60 * 60 * 1000 + 5);
    expect(readCachedCoachSummary("euw1", "exp-puuid", CURRENT_TFT_SET_NUMBER)).toBeNull();
  });
});
