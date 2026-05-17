import { describe, expect, it } from "vitest";
import type { PersonalMatchRecord } from "@/services/indexedDbService";
import { buildPersonalTopComps } from "./buildPersonalTopComps";

function row(
  partial: Partial<PersonalMatchRecord> & Pick<PersonalMatchRecord, "id" | "placement" | "compName">,
): PersonalMatchRecord {
  const { id, placement, compName, ...rest } = partial;
  return {
    createdAt: Date.now(),
    syncStatus: "synced",
    units: [],
    items: [],
    augments: [],
    comp: compName ?? null,
    duration: null,
    source: "gep_match_end",
    ...rest,
    id,
    placement,
    compName,
  };
}

describe("buildPersonalTopComps", () => {
  const now = 1_700_000_000_000;

  it("ranks comps by weighted placement and groups core units", () => {
    const matches = [
      row({
        id: "1",
        placement: 2,
        compName: "Slayer Flex",
        createdAt: now - 1000,
        units: ["Yasuo", "Kayle", "Briar"],
        unitBuilds: [
          { name: "Yasuo", items: ["Bloodthirster", "Titans Resolve"] },
          { name: "Kayle", items: ["Guinsoos Rageblade"] },
        ],
      }),
      row({
        id: "2",
        placement: 6,
        compName: "Slayer Flex",
        createdAt: now - 2000,
        units: ["Yasuo", "Poppy"],
        unitBuilds: [{ name: "Yasuo", items: ["Bloodthirster"] }],
      }),
      row({
        id: "3",
        placement: 7,
        compName: "Invoker Reroll",
        createdAt: now - 3000,
        units: ["Ahri", "Karma"],
      }),
      row({
        id: "4",
        placement: 5,
        compName: "Invoker Reroll",
        createdAt: now - 4000,
        units: ["Ahri", "Syndra"],
      }),
    ];

    const tops = buildPersonalTopComps(matches, { nowMs: now, minGames: 2 });
    expect(tops.length).toBe(2);
    expect(tops[0].displayName).toBe("Slayer Flex");
    expect(tops[0].coreUnits.some((u) => u.name === "Yasuo")).toBe(true);
    expect(tops[0].itemBuilds.some((b) => b.unit === "Yasuo" && b.items[0]?.name === "Bloodthirster")).toBe(
      true,
    );
  });

  it("omits comps below minGames", () => {
    const matches = [
      row({ id: "a", placement: 1, compName: "One-off", units: ["A"] }),
      row({ id: "b", placement: 3, compName: "Slayer Flex", units: ["Y", "K"] }),
      row({ id: "c", placement: 4, compName: "Slayer Flex", units: ["Y", "K"] }),
    ];
    const tops = buildPersonalTopComps(matches, { minGames: 2, nowMs: now });
    expect(tops.every((t) => t.games >= 2)).toBe(true);
    expect(tops.find((t) => t.displayName === "One-off")).toBeUndefined();
  });
});
