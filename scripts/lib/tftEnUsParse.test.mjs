import { describe, expect, it } from "vitest"
import {
  detectCurrentSetNumber,
  parseEnUsBundle,
  referencesSet,
  shouldIncludeAugment,
  stripGameText,
} from "./tftEnUsParse.mjs"

const miniEnUs = {
  sets: {
    "17": {
      champions: [
        {
          apiName: "TFT17_Aatrox",
          name: "Aatrox",
          cost: 1,
          traits: ["Marauder"],
          icon: "ASSETS/Characters/TFT17_Aatrox/HUD/TFT17_Aatrox.tex",
          ability: { name: "Slash", desc: "Deal <magicDamage>100</magicDamage> damage." },
        },
        {
          apiName: "TFT16_Old",
          name: "Old",
          cost: 1,
          traits: ["Test"],
          icon: "ASSETS/Characters/TFT16_Old/HUD/TFT16_Old.tex",
        },
        {
          apiName: "TFT17_Clone_TraitClone",
          name: "Clone",
          cost: 1,
          traits: ["Test"],
          icon: "ASSETS/x.tex",
        },
      ],
      traits: [
        {
          apiName: "TFT17_Marauder",
          name: "Marauder",
          desc: "Gain armor.",
          icon: "ASSETS/UX/TraitIcons/Trait_Icon_17_Marauder.TFT_Set17.tex",
          effects: [{ minUnits: 2, maxUnits: 3, style: 1, variables: {} }],
        },
      ],
    },
  },
  items: [
    {
      apiName: "TFT_Item_BFSword",
      name: "B.F. Sword",
      desc: "AD",
      icon: "ASSETS/Maps/TFT/Icons/Items/Components/TFT_Item_BFSword.tex",
      tags: ["component"],
      composition: [],
    },
    {
      apiName: "TFT_Item_InfinityEdge",
      name: "Infinity Edge",
      desc: "Crit",
      icon: "ASSETS/Maps/TFT/Icons/Items/TFT_Item_InfinityEdge.tex",
      composition: ["TFT_Item_BFSword", "TFT_Item_SparringGloves"],
    },
    {
      apiName: "TFT17_Augment_TestAugment",
      name: "Test Augment",
      desc: "Bonus",
      icon: "ASSETS/Maps/TFT/Icons/Augments/Hexcore/TFT17_TestAugment_II.TFT_Set17.tex",
    },
    {
      apiName: "TFT17_Augment_AhriGodAugment",
      name: "Ahri's Boon",
      desc: "God path",
      icon: "ASSETS/Maps/TFT/Icons/Augments/Hexcore/GodAugmentAhri_II.TFT_Set17.tex",
    },
    {
      apiName: "TFT13_Augment_Old",
      name: "Old Augment",
      desc: "Old",
      icon: "ASSETS/Maps/TFT/Icons/Augments/Hexcore/Old_II.TFT_Set13.tex",
    },
  ],
}

describe("tftEnUsParse", () => {
  it("detects latest set number", () => {
    expect(detectCurrentSetNumber(miniEnUs)).toBe(17)
  })

  it("referencesSet matches prefix and SetNN paths", () => {
    expect(referencesSet("TFT17_Aatrox", 17)).toBe(true)
    expect(referencesSet("Trait_Icon_17_Foo.TFT_Set17.tex", 17)).toBe(true)
    expect(referencesSet("TFT13_Augment_X", 17)).toBe(false)
  })

  it("strips HTML from descriptions", () => {
    expect(stripGameText("Deal <magicDamage>100</magicDamage> damage.")).toBe(
      "Deal 100 damage.",
    )
  })

  it("parses bundle with set filters", () => {
    const bundle = parseEnUsBundle(miniEnUs, 17)
    expect(bundle.units).toHaveLength(1)
    expect(bundle.units[0].apiName).toBe("TFT17_Aatrox")
    expect(bundle.traits).toHaveLength(1)
    expect(bundle.items.components).toHaveLength(1)
    expect(bundle.items.finished).toHaveLength(1)
    expect(bundle.augments).toHaveLength(1)
    expect(bundle.augments[0].tier).toBe("gold")
    expect(bundle.godBoons).toHaveLength(1)
    expect(bundle.godBoons[0].godKey).toBe("Ahri")
    expect(bundle.godBoons[0].isPrimary).toBe(true)
  })

  it("includes shared TFT_Augment rows when icon references current set", () => {
    const withShared = {
      ...miniEnUs,
      items: [
        ...miniEnUs.items,
        {
          apiName: "TFT_Augment_SharedPool",
          name: "Shared Pool",
          desc: "Bonus",
          icon: "ASSETS/Maps/TFT/Icons/Augments/Hexcore/Shared_III.TFT_Set17.tex",
        },
      ],
    }
    const bundle = parseEnUsBundle(withShared, 17)
    expect(bundle.augments.some((a) => a.apiName === "TFT_Augment_SharedPool")).toBe(
      true,
    )
    expect(
      bundle.augments.find((a) => a.apiName === "TFT_Augment_SharedPool")?.tier,
    ).toBe("prismatic")
  })

  it("excludes older-set augments", () => {
    expect(
      shouldIncludeAugment(
        {
          apiName: "TFT13_Augment_Old",
          icon: "ASSETS/Maps/TFT/Icons/Augments/Hexcore/Old_II.TFT_Set13.tex",
        },
        17,
      ),
    ).toBe(false)
  })
})
