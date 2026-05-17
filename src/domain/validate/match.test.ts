import { describe, expect, it } from "vitest";
import { pipelinePersonalMatch } from "../pipeline";
import type { PersonalMatchRecord } from "@/services/indexedDbService";
import { validateCanonicalMatch } from "./match";

function personalRow(overrides: Partial<PersonalMatchRecord>): PersonalMatchRecord {
  return {
    id: "t-1",
    createdAt: Date.now(),
    syncStatus: "synced",
    placement: 3,
    units: ["Yasuo", "Kayle"],
    items: [],
    unitBuilds: [
      { name: "Yasuo", items: ["Bloodthirster"], starLevel: 2 },
      { name: "Kayle", items: [], starLevel: 1 },
    ],
    augments: ["Cybernetic Bulk", "Pandora's Bench", "Second Wind"],
    comp: "Slayer Flex",
    compName: "Slayer Flex",
    duration: 1800,
    source: "gep_match_end",
    ...overrides,
  };
}

describe("validateCanonicalMatch", () => {
  it("flags missing placement as error", () => {
    const base = pipelinePersonalMatch(personalRow({ placement: null })).match;
    const v = validateCanonicalMatch({ ...base, placement: null });
    expect(v.valid).toBe(false);
    expect(v.issues.some((i) => i.code === "missing_placement")).toBe(true);
  });

  it("flags incomplete augments as warn", () => {
    const enriched = pipelinePersonalMatch(personalRow({ augments: ["One"] }));
    expect(enriched.validation.issues.some((i) => i.code === "incomplete_augments")).toBe(true);
  });

  it("scores high completeness for rich personal row", () => {
    const enriched = pipelinePersonalMatch(personalRow({}));
    expect(enriched.validation.completeness).toBeGreaterThan(70);
    expect(enriched.match.units[0].items[0]?.displayName).toBeTruthy();
  });
});
