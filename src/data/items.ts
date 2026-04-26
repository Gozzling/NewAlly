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
  "Channeler Emblem": ["Spatula", "Needlessly Large Rod"],
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
  { name: "Biomatter Preserver", stats: "150 HP, 25 AP, 15% Omnivamp", recipe: ["Psionic Component", "Giant's Belt"], effect: "Heals all allies for 20% of their max HP upon the holder's death." },
  { name: "Drone Uplink", stats: "150 HP, 35 AD, 15% AS", recipe: ["Psionic Component", "B.F. Sword"], effect: "Summons a drone that attacks the holder's target every second, dealing 15% of the holder's AD as true damage." },
  { name: "Malware Matrix", stats: "150 HP, 25 AP, 15 Mana", recipe: ["Psionic Component", "Tear of the Goddess"], effect: "The holder's ability infects the target with a virus that spreads to adjacent enemies on death, dealing 100% of the ability's damage." },
  { name: "Sympathetic Implant", stats: "150 HP, 20 Armor/MR", recipe: ["Psionic Component", "Chain Vest"], effect: "Links the holder to the ally with the lowest HP, redirecting 30% of damage they take to the holder." },
  { name: "Target-Lock Optics", stats: "150 HP, 25% Crit, 15% AS", recipe: ["Psionic Component", "Sparring Gloves"], effect: "Grants 25% crit chance. The holder's attacks cannot miss and ignore 15% of the target's armor." },
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
