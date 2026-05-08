import { describe, it, expect } from "vitest";
import { recommendationsFromGameState } from "./engine";
import { EMPTY_STATE } from "@/store/useAppStore";
import type { TftGameState } from "@/types/tft";
import type { PersonalMatchRecord } from "@/services/indexedDbService";

describe("runRecommendationEngine (integration)", () => {
  it("emits shop recs when in game with shop", () => {
    const gs: TftGameState = {
      ...EMPTY_STATE,
      isInGame: true,
      gold: 30,
      shopUnits: ["Aatrox", "Briar"],
      board: {
        units: [],
        grid: {},
      },
      activeCompTracker: {
        bestMatchName: null,
        matchPercentage: 0,
        missingUnits: [],
      },
    };
    const matches: PersonalMatchRecord[] = [];
    const recs = recommendationsFromGameState(gs, matches, "test-meta", 1);
    const shop = recs.filter((r) => r.category === "shop");
    expect(shop.length).toBeGreaterThan(0);
    expect(shop[0].confidence).toBeGreaterThan(0);
    expect(shop[0].reasoning.length).toBeGreaterThan(0);
  });

  it("emits economy hint when low HP and gold", () => {
    const gs: TftGameState = {
      ...EMPTY_STATE,
      isInGame: true,
      gold: 40,
      roster: [
        {
          name: "me",
          health: 20,
          isLocalPlayer: true,
          isEliminated: false,
          rank: 1,
        },
      ],
      shopUnits: [],
    };
    const recs = recommendationsFromGameState(gs, [], "test", 1);
    expect(recs.some((r) => r.category === "economy" && r.urgency === "high")).toBe(true);
  });

  it("emits economy rolldown at 0 gold when low HP", () => {
    const gs: TftGameState = {
      ...EMPTY_STATE,
      isInGame: true,
      gold: 0,
      roster: [
        {
          name: "me",
          health: 18,
          isLocalPlayer: true,
          isEliminated: false,
          rank: 1,
        },
      ],
      shopUnits: [],
    };
    const recs = recommendationsFromGameState(gs, [], "test", 2);
    expect(recs.some((r) => r.category === "economy" && r.title.includes("rolling"))).toBe(true);
  });

  it("emits trait shop hint when board has 1–3 units and shop empty", () => {
    const gs: TftGameState = {
      ...EMPTY_STATE,
      isInGame: true,
      gold: 0,
      shopUnits: [],
      board: {
        units: [
          {
            name: "Aatrox",
            boardIndex: 0,
            x: 0,
            y: 0,
            starLevel: 1,
            items: [],
            location: "board",
          },
          {
            name: "Poppy",
            boardIndex: 1,
            x: 1,
            y: 0,
            starLevel: 1,
            items: [],
            location: "board",
          },
          {
            name: "Ornn",
            boardIndex: 2,
            x: 2,
            y: 0,
            starLevel: 1,
            items: [],
            location: "board",
          },
        ],
        grid: {},
      },
    };
    const recs = recommendationsFromGameState(gs, [], "test", 3);
    const shopTrait = recs.find((r) => r.category === "shop" && r.id.startsWith("shop:trait:"));
    expect(shopTrait).toBeDefined();
    expect(shopTrait!.detail).toMatch(/Bastion/i);
  });
});
