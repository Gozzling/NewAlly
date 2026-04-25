export interface PatchNote {
  version: string; date: string; highlights: string[];
  buffs: Array<{ target: string; type: 'unit' | 'augment' | 'trait' | 'item'; change: string }>;
  nerfs: Array<{ target: string; type: 'unit' | 'augment' | 'trait' | 'item'; change: string }>;
  newMechanics: string[];
  compViability: Array<{ comp: string; direction: 'up' | 'down' | 'same'; reason: string }>;
}

export const PATCHES: PatchNote[] = [
  {
    version: '17.1', date: '2026-04-24',
    highlights: [
      'Set 17: Space Gods launches with Divine Boon mechanic',
      'New traits: Divine, Meeple, Dark Star, Mecha, Anima, Groovian, Stargazer, Psion, Primordian, Arbiter, N.O.V.A.',
      '5-costs: Fiora, Jhin, Aatrox, Vex, MF + 4-costs: Bard, Ezreal, LeBlanc, Karma, Aurelion Sol, Corki',
      'Orbital carousel: units orbit center before selection',
    ],
    buffs: [
      { target: 'Fiora', type: 'unit', change: 'True damage 400/800/2000 -> 450/850/2200' },
      { target: 'Divine (5)', type: 'trait', change: 'Divine HP bonus 15% -> 20%' },
      { target: 'Groovian (5)', type: 'trait', change: 'Overflow shields 200 -> 250 HP' },
      { target: 'Bard', type: 'unit', change: 'Stasis duration 1.5/2/3s -> 1.75/2.25/3.5s' },
    ],
    nerfs: [
      { target: 'Jhin', type: 'unit', change: 'Shot damage 150/275/750 -> 140/260/700 per shot' },
      { target: 'Kai\'Sa', type: 'unit', change: 'Missile AD 75/150/350 -> 70/140/325' },
      { target: 'Meeple (5)', type: 'trait', change: 'Clone stats 40% -> 35%, duration 6s -> 5s' },
      { target: "Pandora's Bench", type: 'augment', change: 'No longer randomizes completed items into components' },
    ],
    newMechanics: [
      'Divine Boon: choose 1 of 3 boons at combat start when running Divine',
      'Orbital Carousel: units slowly orbit allowing timing of selection',
      'Meeple clones now expire after set duration instead of persisting',
    ],
    compViability: [
      { comp: 'Divine Duelists', direction: 'up', reason: 'Fiora buff + boon mechanic extremely strong' },
      { comp: 'Meeple Mayhem', direction: 'down', reason: 'Clone nerf hurts late scaling' },
      { comp: 'Groove Gang', direction: 'up', reason: 'Groovian overflow buff + Bard addition' },
      { comp: 'Arbiter Court', direction: 'same', reason: 'Bard buff offset by Jhin nerf' },
    ],
  },
  {
    version: '17.0', date: '2026-04-10',
    highlights: [
      'Set 17 PBE release: Space Gods theme',
      'New mechanics: Divine Boons, Orbital Carousel, Meeple Clones',
      'Full unit roster revealed: 28 champions',
    ],
    buffs: [
      { target: 'Anima (4)', type: 'trait', change: 'First CC immunity added to tier 4' },
      { target: 'Arbiter (4)', type: 'trait', change: 'Damage bonus vs highest HP 35% -> 40%' },
    ],
    nerfs: [
      { target: 'Mecha (8)', type: 'trait', change: 'DR 20% -> 15%' },
      { target: 'Supernova', type: 'augment', change: 'Explosion 15% -> 12% max HP true damage' },
    ],
    newMechanics: [
      'Divine Boon system: 12 unique boons across 3 tiers',
      'Meeple clone decay mechanic introduced',
      'Orbital carousel replaces standard carousel',
    ],
    compViability: [
      { comp: 'Divine Duelists', direction: 'up', reason: 'Boon system is fundamentally strong' },
      { comp: 'Mecha Frontline', direction: 'down', reason: '8-Mecha DR nerf reduces late ceiling' },
      { comp: 'Arbiter Court', direction: 'up', reason: 'Reveal + focus fire is powerful in new set' },
    ],
  },
];

export const CURRENT_PATCH = PATCHES[0];
