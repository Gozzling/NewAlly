import coreJson from "./itemGuideCore.json"
import emblemsJson from "./itemGuideEmblems.json"
import artifactsJson from "./itemGuideArtifacts.json"
import animaJson from "./itemGuideAnima.json"
import divineJson from "./itemGuideDivine.json"
import { EMBLEM_RECIPES, ITEM_RECIPES, PSIONIC_ITEMS } from "./items"

export type ItemGuideCategory = "core" | "emblem" | "psionic" | "artifact" | "divine" | "anima"

export interface ItemGuideEntry {
  name: string
  category: ItemGuideCategory
  stats: string
  effect: string
  components: [string, string] | null
  tags: string[]
  tier: "S" | "A" | "B" | "C"
  bestOn: string[]
  iconSlug?: string
  /** Community Dragon PNG when loaded from `cdragon/tft` sync */
  iconUrl?: string
}

type RawRow = { name: string; stats: string; effect: string }

const CORE_TIER: Record<string, ItemGuideEntry["tier"]> = {
  Bloodthirster: "S",
  "Guardian Angel": "S",
  "Infinity Edge": "S",
  "Last Whisper": "A",
  "Rapid Firecannon": "A",
  "Giant Slayer": "A",
  "Guinsoo's Rageblade": "A",
  "Rabadon's Deathcap": "S",
  "Jeweled Gauntlet": "S",
  "Blue Buff": "S",
  "Spear of Shojin": "S",
  Morellonomicon: "A",
  "Warmog's Armor": "S",
  "Sunfire Cape": "S",
  "Bramble Vest": "A",
  "Titan's Resolve": "A",
  "Ionic Spark": "A",
  Redemption: "A",
}

const CORE_TAGS: Record<string, string[]> = {
  Bloodthirster: ["offense", "sustain", "core"],
  "Guardian Angel": ["offense", "defense", "core"],
  "Infinity Edge": ["offense", "crit", "core"],
  "Last Whisper": ["offense", "shred", "core"],
  "Rapid Firecannon": ["offense", "range", "core"],
  "Giant Slayer": ["offense", "core"],
  "Guinsoo's Rageblade": ["offense", "AS", "core"],
  "Rabadon's Deathcap": ["AP", "offense", "core"],
  "Jeweled Gauntlet": ["AP", "crit", "core"],
  "Blue Buff": ["mana", "AP", "core"],
  "Spear of Shojin": ["mana", "hybrid", "core"],
  Morellonomicon: ["AP", "grievous", "core"],
  "Warmog's Armor": ["tank", "HP", "core"],
  "Sunfire Cape": ["tank", "grievous", "core"],
  "Bramble Vest": ["tank", "armor", "core"],
  "Titan's Resolve": ["tank", "AS", "core"],
  "Ionic Spark": ["tank", "MR", "utility", "core"],
  Redemption: ["support", "heal", "core"],
}

const CORE_BEST: Record<string, string[]> = {
  Bloodthirster: ["Aatrox", "Samira", "Briar"],
  "Guardian Angel": ["Caitlyn", "Jhin", "Kai'Sa"],
  "Infinity Edge": ["Jhin", "Caitlyn", "Samira"],
  "Last Whisper": ["Jhin", "Corki", "Samira"],
  "Rapid Firecannon": ["Jhin", "Caitlyn", "Corki"],
  "Giant Slayer": ["Jhin", "Caitlyn", "Samira"],
  "Guinsoo's Rageblade": ["Kai'Sa", "Samira", "Jhin"],
  "Rabadon's Deathcap": ["Aurelion Sol", "Karma", "Zyra"],
  "Jeweled Gauntlet": ["Ezreal", "Karma", "Zyra"],
  "Blue Buff": ["Karma", "Ezreal", "Veigar"],
  "Spear of Shojin": ["Karma", "Bard", "Aurelion Sol"],
  Morellonomicon: ["Karma", "Zyra", "Lissandra"],
  "Warmog's Armor": ["Cho'Gath", "Aatrox", "Gnar"],
  "Sunfire Cape": ["Gnar", "Urgot", "Cho'Gath"],
  "Bramble Vest": ["Gnar", "Poppy", "Cho'Gath"],
  "Titan's Resolve": ["Aatrox", "Gnar", "Briar"],
  "Ionic Spark": ["Gnar", "Cho'Gath", "Diana"],
  Redemption: ["Karma", "Bard", "Sona"],
}

function buildCatalog(): ItemGuideEntry[] {
  const coreByName = Object.fromEntries((coreJson as RawRow[]).map((r) => [r.name, r]))
  const core: ItemGuideEntry[] = Object.keys(ITEM_RECIPES).map((name) => {
    const row = coreByName[name]
    if (!row) {
      return {
        name,
        category: "core" as const,
        stats: "",
        effect: "Stats not available.",
        components: ITEM_RECIPES[name],
        tags: CORE_TAGS[name] ?? ["core"],
        tier: CORE_TIER[name] ?? "B",
        bestOn: CORE_BEST[name] ?? [],
      }
    }
    return {
      name,
      category: "core",
      stats: row.stats,
      effect: row.effect,
      components: ITEM_RECIPES[name],
      tags: CORE_TAGS[name] ?? ["core"],
      tier: CORE_TIER[name] ?? "B",
      bestOn: CORE_BEST[name] ?? [],
    }
  })

  const emblemByName = Object.fromEntries((emblemsJson as RawRow[]).map((r) => [r.name, r]))
  const emblems: ItemGuideEntry[] = Object.keys(EMBLEM_RECIPES).map((name) => {
    const row = emblemByName[name]
    const stats = row?.stats ?? ""
    const effect =
      row?.effect ??
      `The holder gains the ${name.replace(/ Emblem$/, "")} trait.`
    return {
      name,
      category: "emblem",
      stats,
      effect,
      components: EMBLEM_RECIPES[name],
      tags: ["emblem", "trait"],
      tier: "A",
      bestOn: [],
    }
  })

  const psionic: ItemGuideEntry[] = PSIONIC_ITEMS.map((p) => ({
    name: p.name,
    category: "psionic",
    stats: p.stats,
    effect: p.effect,
    components: p.recipe,
    tags: ["psionic", "craft"],
    tier: "A",
    bestOn: [],
  }))

  const divine: ItemGuideEntry[] = (divineJson as RawRow[]).map((r) => ({
    name: r.name,
    category: "divine",
    stats: r.stats,
    effect: r.effect,
    components: null,
    tags: ["divine", "anima"],
    tier: "S",
    bestOn: [],
    iconSlug: "AnimaEmblem",
  }))

  const anima: ItemGuideEntry[] = (animaJson as RawRow[]).map((r) => ({
    name: r.name,
    category: "anima",
    stats: r.stats,
    effect: r.effect,
    components: null,
    tags: ["anima"],
    tier: "A",
    bestOn: [],
    iconSlug: "AnimaEmblem",
  }))

  const artifacts: ItemGuideEntry[] = (artifactsJson as RawRow[]).map((r) => ({
    name: r.name,
    category: "artifact",
    stats: r.stats,
    effect: r.effect,
    components: null,
    tags: ["artifact"],
    tier: "A",
    bestOn: [],
    iconSlug: "NeedlesslyLargeRod",
  }))

  return [...core, ...emblems, ...psionic, ...divine, ...artifacts, ...anima]
}

export const ITEM_GUIDE_ENTRIES: ItemGuideEntry[] = buildCatalog()

export function findGuideItem(name: string): ItemGuideEntry | undefined {
  return ITEM_GUIDE_ENTRIES.find((e) => e.name === name)
}
