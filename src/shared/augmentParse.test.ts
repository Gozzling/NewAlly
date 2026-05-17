import { describe, expect, it } from "vitest";
import {
  mergeAugmentSlots,
  normalizeAugmentDisplayName,
  parseAugmentList,
  parseAugmentsFromGepInfo,
  parsePickedAugments,
} from "./augmentParse";

describe("augmentParse", () => {
  it("normalizes TFT internal augment ids", () => {
    expect(normalizeAugmentDisplayName("TFT9_Augment_CyberneticBulk3")).toMatch(/Cybernetic/i);
    expect(normalizeAugmentDisplayName("TFT14_Augment_SylasCarry_combo")).toMatch(/Sylas/i);
  });

  it("parses GEP picked_augment slots", () => {
    const raw =
      '{"slot_1":{"name":"TFT9_Augment_CyberneticBulk3"}, "slot_2":{"name":"TFT9_Augment_SettTheBoss"}, "slot_3":{"name":""}}';
    const names = parsePickedAugments(raw);
    expect(names).toHaveLength(2);
    expect(names[0]).toMatch(/Cybernetic/i);
    expect(names[1]).toMatch(/Sett/i);
  });

  it("merges augment slots across updates", () => {
    expect(mergeAugmentSlots(["A"], ["A", "B", ""])).toEqual(["A", "B"]);
    expect(mergeAugmentSlots(["A", "B"], ["A", "B", "C"])).toEqual(["A", "B", "C"]);
  });

  it("parses augments feature info shape", () => {
    const info = {
      me: {
        picked_augment:
          '{"slot_1":{"name":"TFT6_Augment_SecondWind1"},"slot_2":{"name":"TFT7_Augment_PandorasBench"},"slot_3":{"name":""}}',
      },
    };
    const names = parseAugmentsFromGepInfo(info);
    expect(names.length).toBeGreaterThanOrEqual(2);
  });

  it("parses string arrays from active_player fallback", () => {
    expect(parseAugmentList(["TFT8_Augment_DefenderTrait", ""])).toHaveLength(1);
  });
});
