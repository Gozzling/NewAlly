import { describe, expect, it } from "vitest";
import { pipelinePersonalMatch } from "../pipeline";
import { pipelineLegacyRiotMatch } from "../pipeline";
import type { PersonalMatchRecord } from "@/services/indexedDbService";
import type { Match } from "@/types/riot";
import { inferTraitsFromUnitNames, legacyTraitNamesToSlots } from "./inferTraits";

describe("inferTraitsFromUnitNames", () => {
  it("counts traits from catalog units on board", () => {
    const traits = inferTraitsFromUnitNames(["Aatrox", "Leona"]);
    expect(traits.length).toBeGreaterThan(0);
    expect(traits.some((t) => t.numUnits >= 1)).toBe(true);
  });
});

describe("normalizePersonalMatch traits", () => {
  it("populates inferred traits for personal rows", () => {
    const record: PersonalMatchRecord = {
      id: "p-1",
      createdAt: Date.now(),
      syncStatus: "synced",
      placement: 2,
      units: ["Aatrox", "Leona"],
      items: [],
      augments: ["Test Augment"],
      comp: null,
      duration: 1200,
      source: "gep_match_end",
    };
    const enriched = pipelinePersonalMatch(record);
    expect(enriched.match.traits.length).toBeGreaterThan(0);
  });
});

describe("normalizeLegacyRiotMatch rich fields", () => {
  it("preserves unit items and trait breakpoints from legacy Match", () => {
    const legacy: Match = {
      matchId: "m-1",
      placement: 1,
      level: 9,
      date: new Date(),
      gameLength: 1800,
      gameType: "standard",
      units: ["Aatrox"],
      traits: ["TFT16_Brawler"],
      augments: ["Cybernetic Bulk"],
      comp: "Test",
      unitBuilds: [{ name: "Aatrox", starLevel: 2, items: ["WarmogsArmor"] }],
      traitLines: [
        { rawId: "TFT16_Brawler", numUnits: 2, tierCurrent: 1, tierTotal: 3 },
      ],
    };
    const enriched = pipelineLegacyRiotMatch(legacy);
    expect(enriched.match.units[0]?.items.length).toBe(1);
    expect(enriched.match.traits[0]?.numUnits).toBe(2);
  });

  it("maps legacy trait name strings with unit count 1", () => {
    const slots = legacyTraitNamesToSlots(["Brawler", "Bastion"]);
    expect(slots).toHaveLength(2);
    expect(slots[0]?.numUnits).toBe(1);
  });
});
