import { describe, expect, it } from "vitest";
import { recommendationsFromGameState } from "./engine";
import { EMPTY_STATE } from "@/store/useAppStore";
import type { TftGameState } from "@/types/tft";
import type { PersonalMatchRecord } from "@/services/indexedDbService";

function personalRow(placement: number, compName: string, id: string): PersonalMatchRecord {
  return {
    id,
    summonerName: "me",
    region: "euw1",
    createdAt: Date.now(),
    timestamp: Date.now(),
    isSynced: true,
    syncStatus: "synced",
    placement,
    units: [],
    items: [],
    augments: [],
    comp: compName,
    compName,
    duration: null,
    source: "gep_match_end",
    raw: {},
  };
}

describe("recommendation thresholds", () => {
  it("suggests banking when rich with weak recent placements (history window)", () => {
    const gs: TftGameState = {
      ...EMPTY_STATE,
      isInGame: true,
      gold: 52,
      shopUnits: [],
      roster: [
        { name: "me", health: 60, isLocalPlayer: true, isEliminated: false, rank: 1 },
      ],
    };
    const history = Array.from({ length: 8 }, (_, i) =>
      personalRow(6 + (i % 2), "Test Comp", `h-${i}`),
    );
    const recs = recommendationsFromGameState(gs, history, "test", 100);
    expect(recs.some((r) => r.id.startsWith("economy:bank:"))).toBe(true);
  });

  it("mentions favoriteComp in banking copy when history has a clear favorite", () => {
    const gs: TftGameState = {
      ...EMPTY_STATE,
      isInGame: true,
      gold: 54,
      shopUnits: [],
      roster: [
        { name: "me", health: 70, isLocalPlayer: true, isEliminated: false, rank: 1 },
      ],
    };
    const history = [
      ...Array.from({ length: 5 }, (_, i) => personalRow(6, "Slayer Flex", `slayer-${i}`)),
      ...Array.from({ length: 3 }, (_, i) => personalRow(6, "Flex", `flex-${i}`)),
    ];
    const recs = recommendationsFromGameState(gs, history, "test", 200);
    const bank = recs.find((r) => r.id.startsWith("economy:bank:"));
    expect(bank).toBeDefined();
    expect(bank!.detail).toMatch(/Slayer Flex/i);
    expect(bank!.reasoning.some((line) => line.includes("Slayer Flex"))).toBe(true);
  });

  it("emits finish-board rec when comp match is strong with few missing units", () => {
    const gs: TftGameState = {
      ...EMPTY_STATE,
      isInGame: true,
      gold: 30,
      shopUnits: [],
      board: {
        units: Array.from({ length: 5 }, (_, i) => ({
          name: `U${i}`,
          boardIndex: i,
          x: i,
          y: 0,
          starLevel: 1,
          items: [],
          location: "board" as const,
        })),
        grid: {},
      },
      activeCompTracker: {
        bestMatchName: "Slayer Flex",
        matchPercentage: 72,
        missingUnits: ["Yasuo", "Kayle"],
      },
    };
    const recs = recommendationsFromGameState(gs, [], "test", 201);
    const finish = recs.find((r) => r.id.startsWith("board:finish:"));
    expect(finish).toBeDefined();
    expect(finish!.detail).toMatch(/Yasuo/i);
  });

  it("emits pivot rec when comp match is weak with multiple missing units", () => {
    const gs: TftGameState = {
      ...EMPTY_STATE,
      isInGame: true,
      gold: 20,
      shopUnits: [],
      board: {
        units: Array.from({ length: 4 }, (_, i) => ({
          name: `U${i}`,
          boardIndex: i,
          x: i,
          y: 0,
          starLevel: 1,
          items: [],
          location: "board" as const,
        })),
        grid: {},
      },
      activeCompTracker: {
        bestMatchName: "Invoker Reroll",
        matchPercentage: 35,
        missingUnits: ["Ahri", "Karma", "Syndra"],
      },
    };
    const history = Array.from({ length: 6 }, (_, i) =>
      personalRow(3, "Slayer Flex", `hist-${i}`),
    );
    const recs = recommendationsFromGameState(gs, history, "test", 202);
    const pivot = recs.find((r) => r.id.startsWith("board:pivot:"));
    expect(pivot).toBeDefined();
    expect(pivot!.detail).toMatch(/Slayer Flex/i);
  });

  it("filters low-confidence shop picks", () => {
    const gs: TftGameState = {
      ...EMPTY_STATE,
      isInGame: true,
      gold: 20,
      shopUnits: ["UnknownUnitXYZ"],
      board: { units: [], grid: {} },
      activeCompTracker: { bestMatchName: null, matchPercentage: 0, missingUnits: [] },
    };
    const recs = recommendationsFromGameState(gs, [], "test", 101);
    expect(recs.filter((r) => r.category === "shop").length).toBe(0);
  });
});
