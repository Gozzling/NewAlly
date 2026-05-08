// TFT Augments — curated guide copy for Set 17. Riot does not ship augment *descriptions*
// in the same tftitems.json we use for icons; verify augments in the TFT client.
// Icons: `npm run data:tft-cd` (Community Dragon tftitems augment paths).
export interface Augment {
  id: string
  name: string
  tier: 'prismatic' | 'gold' | 'silver'
  description: string
  effect: string
  bestComps: string[]
  pickRate: number
  winRate: number
  avgPlacement: number
  synergies: string[]
  counters: string[]
  tags: string[]
}

export const AUGMENTS: Augment[] = [
  // === Set 17: Boons Mechanic Augments ===
  {
    id: "aug_space_god_blessing",
    name: "Space God Blessing",
    tier: "prismatic",
    description: "At the start of each combat, choose 1 of 3 Divine Boons. Boons grant powerful team-wide buffs for that round.",
    effect: "1 Divine Boon per round (choice of 3)",
    bestComps: ["Divine Ascension", "Arbiter Court", "Any"],
    pickRate: 15.2,
    winRate: 54.1,
    avgPlacement: 3.5,
    synergies: ["Divine Right", "Arbiter's Gaze"],
    counters: [],
    tags: ["boon", "prismatic", "combat"]
  },
  {
    id: "aug_divine_right",
    name: "Divine Right",
    tier: "gold",
    description: "Divine units gain a bonus boon effect permanently after each combat they survive. Stacks up to 3 times.",
    effect: "Divine units scale permanently via boons",
    bestComps: ["Divine Ascension", "Space Groove"],
    pickRate: 21.5,
    winRate: 52.8,
    avgPlacement: 3.6,
    synergies: ["Space God Blessing", "Meeple Mayhem"],
    counters: ["Anti-Divine"],
    tags: ["boon", "trait", "gold", "combat"]
  },
  {
    id: "aug_arbiters_gaze",
    name: "Arbiter's Gaze",
    tier: "gold",
    description: "Your Arbiter units reveal the enemy board before combat, allowing you to reposition. Arbiter units deal +15% damage to the highest HP enemy.",
    effect: "Pre-combat reveal + focus fire bonus",
    bestComps: ["Arbiter Court", "Anima Force"],
    pickRate: 18.3,
    winRate: 51.5,
    avgPlacement: 3.7,
    synergies: ["Space God Blessing", "Divine Right"],
    counters: [],
    tags: ["trait", "gold", "combat", "info"]
  },
  {
    id: "aug_meeple_mayhem",
    name: "Meeple Mayhem",
    tier: "gold",
    description: "Meeple units have a 30% chance to summon a mini-Meeple clone on death. Clone has 25% stats and lasts 4 seconds.",
    effect: "Meeple death clones",
    bestComps: ["Meeple Mayhem", "Divine Ascension"],
    pickRate: 17.8,
    winRate: 50.2,
    avgPlacement: 3.8,
    synergies: ["Divine Right", "Space God Blessing"],
    counters: ["AOE", "Shred"],
    tags: ["trait", "gold", "combat"]
  },
  {
    id: "aug_cosmic_conductor",
    name: "Cosmic Conductor",
    tier: "prismatic",
    description: "Space Groovian units grant a permanent +2% AS and +3 AP to all allies each time they cast. Stacks infinitely.",
    effect: "Infinite team scaling via Groovian casts",
    bestComps: ["Space Groove", "Anima Force"],
    pickRate: 12.1,
    winRate: 53.5,
    avgPlacement: 3.5,
    synergies: ["Meeple Mayhem", "Arbiter's Gaze"],
    counters: ["Assassin"],
    tags: ["trait", "prismatic", "combat"]
  },
  {
    id: "aug_anima_surge",
    name: "Anima Surge",
    tier: "gold",
    description: "Anima units regenerate 5% max HP per second while below 50% HP. First Anima cast each combat is empowered (+50% effect).",
    effect: "Anima sustain + empowered opener",
    bestComps: ["Anima Force", "Bruiser Brawl"],
    pickRate: 19.4,
    winRate: 51.0,
    avgPlacement: 3.7,
    synergies: ["Cosmic Conductor", "Space God Blessing"],
    counters: ["Grievous Wounds", "Burst"],
    tags: ["trait", "gold", "combat"]
  },
  // === Economy Augments ===
  {
    id: "aug_galactic_interest",
    name: "Galactic Interest",
    tier: "silver",
    description: "Interest cap increased to 70 gold. At 70 gold, gain a free reroll each round.",
    effect: "70g interest cap + free reroll at cap",
    bestComps: ["Any"],
    pickRate: 32.5,
    winRate: 48.5,
    avgPlacement: 4.0,
    synergies: ["High End Shopping", "March of Progress"],
    counters: [],
    tags: ["econ", "silver"]
  },
  {
    id: "aug_nebula_divest",
    name: "Nebula Divest",
    tier: "silver",
    description: "Selling a unit refunds its full cost +1 gold. Does not apply to 5-cost units.",
    effect: "Full refund +1g on sells (except 5-cost)",
    bestComps: ["Any", "Pivot-heavy"],
    pickRate: 28.7,
    winRate: 47.9,
    avgPlacement: 4.1,
    synergies: ["Galactic Interest", "Item Grab Bag"],
    counters: [],
    tags: ["econ", "silver"]
  },
  {
    id: "aug_wormhole_gambit",
    name: "Wormhole Gambit",
    tier: "gold",
    description: "After losing a combat, next shop is guaranteed to contain a unit from your active traits. 2 gold refunded on loss.",
    effect: "Loss mitigation + targeted shop",
    bestComps: ["Any", "Stabilize"],
    pickRate: 24.3,
    winRate: 50.8,
    avgPlacement: 3.8,
    synergies: ["Nebula Divest", "Galactic Interest"],
    counters: [],
    tags: ["econ", "gold"]
  },
  // === Item Augments ===
  {
    id: "aug_pandoras_items_2",
    name: "Pandora's Bench",
    tier: "prismatic",
    description: "At round start, items on your bench are randomized into other items. Components become random components. Completed items become random completed items.",
    effect: "Full bench reroll each round",
    bestComps: ["Flexible", "Any"],
    pickRate: 10.5,
    winRate: 51.2,
    avgPlacement: 3.7,
    synergies: ["Item Grab Bag", "Cosmic Conductor"],
    counters: [],
    tags: ["item", "prismatic"]
  },
  {
    id: "aug_orbital_armory",
    name: "Orbital Armory",
    tier: "gold",
    description: "Gain 2 random completed items at the start of Stage 3 and Stage 5.",
    effect: "+4 items at stage breakpoints",
    bestComps: ["Item Heavy", "Divine Ascension"],
    pickRate: 16.2,
    winRate: 49.5,
    avgPlacement: 3.9,
    synergies: ["Pandora's Bench", "Item Grab Bag"],
    counters: [],
    tags: ["item", "gold"]
  },
  {
    id: "aug_component_cache",
    name: "Component Cache",
    tier: "silver",
    description: "Gain 2 random components now and 1 component at the start of Stage 4.",
    effect: "+3 components (2 now, 1 later)",
    bestComps: ["Any"],
    pickRate: 36.8,
    winRate: 48.1,
    avgPlacement: 4.1,
    synergies: ["Orbital Armory", "Pandora's Bench"],
    counters: [],
    tags: ["item", "silver"]
  },
  // === Combat Augments ===
  {
    id: "aug_gravitational_shred",
    name: "Gravitational Shred",
    tier: "silver",
    description: "All attacks and spells apply Gravitational Shred, reducing armor and MR by 30% for 5 seconds. Stacks up to 2 times.",
    effect: "30% armor/MR shred, stacks 2x",
    bestComps: ["AD Comps", "Space Groove"],
    pickRate: 26.4,
    winRate: 50.3,
    avgPlacement: 3.8,
    synergies: ["Anima Surge", "Meeple Mayhem"],
    counters: ["Tanky Comps"],
    tags: ["combat", "silver"]
  },
  {
    id: "aug_void_shield",
    name: "Void Shield",
    tier: "gold",
    description: "At combat start, all units gain a shield equal to 25% of the team's total HP for 8 seconds.",
    effect: "25% team HP as opening shield",
    bestComps: ["Bruiser Brawl", "Divine Ascension"],
    pickRate: 20.1,
    winRate: 51.7,
    avgPlacement: 3.7,
    synergies: ["Divine Right", "Anima Surge"],
    counters: ["Gravitational Shred", "Burst"],
    tags: ["combat", "gold"]
  },
  {
    id: "aug_supernova",
    name: "Supernova",
    tier: "prismatic",
    description: "When a unit dies, it explodes dealing 15% of its max HP as true damage to adjacent enemies and healing allies for 5%.",
    effect: "Death explosions + team heal",
    bestComps: ["Meeple Mayhem", "Bruiser Brawl"],
    pickRate: 13.8,
    winRate: 53.9,
    avgPlacement: 3.5,
    synergies: ["Void Shield", "Meeple Mayhem"],
    counters: ["Backline Comps"],
    tags: ["combat", "prismatic"]
  },
]

export const AUGMENT_TIERS = ['prismatic', 'gold', 'silver'] as const
