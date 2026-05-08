import { describe, it, expect } from "vitest";
import { summarizePersonalMatches } from "./historySummary";
import type { PersonalMatchRecord } from "@/services/indexedDbService";

function row(partial: Partial<PersonalMatchRecord>): PersonalMatchRecord {
  return {
    id: "x",
    syncStatus: "synced",
    placement: 4,
    units: [],
    items: [],
    augments: [],
    comp: "Test",
    duration: null,
    source: "gep_match_end",
    createdAt: 1,
    ...partial,
  };
}

describe("summarizePersonalMatches", () => {
  it("returns empty summary for no matches", () => {
    const s = summarizePersonalMatches([]);
    expect(s.windowSize).toBe(0);
    expect(s.avgPlacement).toBeNull();
  });

  it("computes avg placement, top4, favorite comp", () => {
    const s = summarizePersonalMatches(
      [
        row({ id: "1", placement: 2, comp: "A", compName: "A", createdAt: 300 }),
        row({ id: "2", placement: 6, comp: "B", compName: "B", createdAt: 200 }),
        row({ id: "3", placement: 5, comp: "A", compName: "A", createdAt: 100 }),
      ],
      10,
    );
    expect(s.windowSize).toBe(3);
    expect(s.avgPlacement).toBeCloseTo((2 + 6 + 5) / 3, 5);
    expect(s.top4Rate).toBeCloseTo(1 / 3, 5);
    expect(s.favoriteComp).toBe("A");
    expect(s.compFrequency.A).toBe(2);
  });
});
