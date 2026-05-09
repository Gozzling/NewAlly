// TFT Item recipes -- Set 17 Space Gods
export const ITEM_RECIPES: Record<string, [string, string]> = {
  "Bloodthirster": ["B.F. Sword", "Negatron Cloak"],
  "Guardian Angel": ["B.F. Sword", "Chain Vest"],
  "Infinity Edge": ["B.F. Sword", "B.F. Sword"],
  "Last Whisper": ["B.F. Sword", "Giant's Belt"],
  "Rapid Firecannon": ["B.F. Sword", "Recurve Bow"],
  "Giant Slayer": ["B.F. Sword", "Tear of the Goddess"],
  "Guinsoo's Rageblade": ["Recurve Bow", "Recurve Bow"],
  "Rabadon's Deathcap": ["Needlessly Large Rod", "Needlessly Large Rod"],
  "Jeweled Gauntlet": ["Needlessly Large Rod", "Sparring Gloves"],
  "Blue Buff": ["Tear of the Goddess", "Tear of the Goddess"],
  "Spear of Shojin": ["B.F. Sword", "Tear of the Goddess"],
  "Morellonomicon": ["Needlessly Large Rod", "Giant's Belt"],
  "Warmog's Armor": ["Giant's Belt", "Giant's Belt"],
  "Sunfire Cape": ["Giant's Belt", "Chain Vest"],
  "Bramble Vest": ["Chain Vest", "Chain Vest"],
  "Titan's Resolve": ["Chain Vest", "Recurve Bow"],
  "Ionic Spark": ["Negatron Cloak", "Needlessly Large Rod"],
  "Redemption": ["Giant's Belt", "Tear of the Goddess"],
}

export const ALL_COMPONENTS = [
  "B.F. Sword", "Needlessly Large Rod", "Recurve Bow", "Tear of the Goddess",
  "Chain Vest", "Negatron Cloak", "Giant's Belt", "Sparring Gloves",
] as const

// Set 17 Emblems (crafted with Spatula + component)
export const EMBLEM_RECIPES: Record<string, [string, string]> = {
  "Brawler Emblem": ["Sparring Gloves", "Giant's Belt"],
  "Dark Star Emblem": ["Spatula", "Negatron Cloak"],
  "Psionic Emblem": ["Spatula", "Tear of the Goddess"],
  "Shepherd Emblem": ["Spatula", "Giant's Belt"],
  "N.O.V.A. Emblem": ["Spatula", "Needlessly Large Rod"],
  "Replicator Emblem": ["Spatula", "Recurve Bow"],
  "Anima Emblem": ["Spatula", "Chain Vest"],
  "Timebreaker Emblem": ["Spatula", "B.F. Sword"],
  "Voyager Emblem": ["Spatula", "Sparring Gloves"],
  "Conduit Emblem": ["Spatula", "Needlessly Large Rod"],
  "Marauder Emblem": ["Spatula", "B.F. Sword"],
  "Sniper Emblem": ["Spatula", "Recurve Bow"],
  "Arbiter Emblem": ["Spatula", "Tear of the Goddess"],
  "Mecha Emblem": ["Spatula", "Chain Vest"],
  "Vanguard Emblem": ["Spatula", "Giant's Belt"],
  "Bastion Emblem": ["Spatula", "Chain Vest"],
  "Space Groove Emblem": ["Spatula", "Negatron Cloak"],
  "Stargazer Emblem": ["Spatula", "Recurve Bow"],
  "Meeple Emblem": ["Spatula", "Sparring Gloves"],
}

// Set 17 Psionic Items
export interface PsionicItem {
  name: string
  stats: string
  recipe: [string, string]
  effect: string
}

export const PSIONIC_ITEMS: PsionicItem[] = [
  {
    name: "Biomatter Preserver",
    stats: "+250 Health",
    recipe: ["Psionic Component", "Giant's Belt"],
    effect:
      "Gain 0% max Health and deploy 3 Life Orbs. Every 8 seconds of combat, one drops restoring 18% of the holder's missing Health. At (4) Psionic: +22% increased healing from all sources.",
  },
  {
    name: "Drone Uplink",
    stats: "+25% Ability Power",
    recipe: ["Psionic Component", "B.F. Sword"],
    effect:
      "A drone repeats 20% of damage from the holder's attacks and Abilities to the same targets every 3 seconds. At (4) Psionic: gain a mini-drone that repeats 20% of damage.",
  },
  {
    name: "Malware Matrix",
    stats: "+15% Attack Damage, +15 Attack Speed",
    recipe: ["Psionic Component", "Tear of the Goddess"],
    effect:
      "Dealing physical damage reduces the target's Armor by 2 (Ability damage 0.75s CD). At (4) Psionic: every 3rd attack cleaves for 75 physical damage to nearby enemies.",
  },
  {
    name: "Sympathetic Implant",
    stats: "+20% Ability Power, +4 Mana Regen",
    recipe: ["Psionic Component", "Chain Vest"],
    effect:
      "Every 5 seconds, gain 1 additional Mana Per Second. At (4) Psionic: abilities deal 25% of ability damage as true damage instead.",
  },
  {
    name: "Target-Lock Optics",
    stats: "+25% Attack Damage, +35 Attack Speed",
    recipe: ["Psionic Component", "Sparring Gloves"],
    effect:
      "The holder's first attack on each enemy deals 150 bonus damage. At (4) Psionic: heal 20% max Health when the target dies.",
  },
]

// Set 17 Sona Command Mods
export interface SonaMod {
  name: string
  effect: string
}

export const SONAMODS: SonaMod[] = [
  { name: "Fortification", effect: "Increases the health of all meeps by 40% and grants them 20 armor and magic resistance." },
  { name: "Spatial Beacon", effect: "Sona's meeps now heal all allies within 2 hexes for 5% of their max HP every 3 seconds." },
  { name: "Overclock", effect: "Meeps attack 30% faster and their abilities cost 20 less mana. Sona gains 30% attack speed." },
  { name: "Encore", effect: "When Sona dies, all meeps become empowered for 10 seconds, gaining 50% increased damage and 50% lifesteal/omnivamp." },
]
