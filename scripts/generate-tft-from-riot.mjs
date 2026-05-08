#!/usr/bin/env node
/**
 * Pulls TFT Set data from Community Dragon (Riot TFT game JSON — same source as in-client).
 * Writes src/data/tftFromRiot.generated.ts and rewrites src/data/units.ts trait lines to use traitsForUnit().
 *
 * Run: node scripts/generate-tft-from-riot.mjs
 */
import fs from "fs/promises"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, "..")

const TFT_CHAMPIONS_URL =
  "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/tftchampions.json"
const TFT_TRAITS_URL =
  "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/tfttraits.json"

/** App unit label → tftchampions display_name when they differ */
const UNIT_NAME_TO_CD_DISPLAY = {
  Nunu: "Nunu & Willump",
  Leblanc: "LeBlanc",
}

const HUD_PATH = /\/Characters\/TFT17_[^/]+\/HUD\/TFT17_/

function normSynId(name) {
  return (
    "syn_" +
    String(name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "")
  )
}

function stripTooltip(html) {
  return String(html || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<expandRow>[\s\S]*?<\/expandRow>/gi, "")
    .replace(/<row>/gi, "\n")
    .replace(/<\/row>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/%i:[A-Za-z0-9_]+%/gi, "")
    .replace(/@TFTUnitProperty\.trait:[^@]+@/gi, "")
    .replace(/\(@MinUnits@\)/g, "")
    .replace(/@[A-Za-z0-9_*]+@/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s*%\s+/g, " ")
    .replace(/\s+%/g, " ")
    .replace(/ {2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

function formatConstants(constants) {
  if (!constants?.length) return ""
  return constants
    .map((c) => {
      const label = String(c.name).replace(/^ChannelerManaRegen/i, "ConduitManaRegen")
      let v = c.value
      if (
        typeof v === "number" &&
        Math.abs(v) > 0 &&
        Math.abs(v) <= 1 &&
        !Number.isInteger(v) &&
        !String(c.name).toLowerCase().includes("multiplier")
      ) {
        v = `${Math.round(v * 100)}%`
      }
      return `${label}: ${v}`
    })
    .join(" · ")
}

async function fetchJson(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${res.status} ${url}`)
  return res.json()
}

function pickChampionRecord(championsJson, appUnitName) {
  const display = UNIT_NAME_TO_CD_DISPLAY[appUnitName] ?? appUnitName
  let best = null
  for (const k of Object.keys(championsJson)) {
    const r = championsJson[k]?.character_record
    if (!r?.character_id?.startsWith("TFT17_")) continue
    if (r.display_name !== display) continue
    if (/_TraitClone$/i.test(r.character_id)) continue
    if (!HUD_PATH.test(r.squareIconPath || "")) continue
    if (!r.traits?.length) continue
    best = r
  }
  return best
}

function collectUnitNamesFromUnitsTs(src) {
  const names = new Set()
  for (const m of src.matchAll(/name:"([^"]+)",cost:\d+,traits:/g)) names.add(m[1])
  return [...names]
}

function buildUnitTraitsMap(championsJson, unitNames) {
  /** @type {Record<string, string[]>} */
  const out = {}
  for (const name of unitNames) {
    const rec = pickChampionRecord(championsJson, name)
    if (!rec) continue
    out[name] = rec.traits.map((t) => t.name)
  }
  return out
}

function reverseTraitToUnits(unitTraits) {
  /** @type {Map<string, string[]>} */
  const m = new Map()
  for (const [unit, traits] of Object.entries(unitTraits)) {
    for (const t of traits) {
      if (!m.has(t)) m.set(t, [])
      m.get(t).push(unit)
    }
  }
  for (const [k, arr] of m) {
    arr.sort((a, b) => a.localeCompare(b))
    m.set(k, [...new Set(arr)])
  }
  return m
}

function shouldIncludeTrait(tr) {
  if (!tr || tr.set !== "TFTSet17") return false
  if (String(tr.trait_id || "").includes("CarouselMarket")) return false
  if (tr.display_name === "God-Blessed") return false
  if (tr.display_name === "Stargazer" && tr.trait_id !== "TFT17_Stargazer") return false
  return true
}

function buildSynergies(traitsJson, traitToUnits) {
  const byName = new Map()
  for (const k of Object.keys(traitsJson)) {
    const tr = traitsJson[k]
    if (!shouldIncludeTrait(tr)) continue
    const name = tr.display_name
    if (!byName.has(name)) byName.set(name, tr)
  }

  const synergies = []
  for (const tr of byName.values()) {
    const name = tr.display_name
    const sets = tr.conditional_trait_sets || []
    const thresholds = sets
      .filter((s) => typeof s.min_units === "number" && s.min_units > 0)
      .map((s) => ({
        count: s.min_units,
        effect:
          formatConstants(s.constants) ||
          (sets.length ? "Tier bonus (see trait description)" : "Active"),
      }))
      .sort((a, b) => a.count - b.count)

    if (thresholds.length === 0 && (tr.innate_trait_sets || []).length) {
      thresholds.push({
        count: 1,
        effect:
          formatConstants(tr.innate_trait_sets[0]?.constants) ||
          "Innate (see description)",
      })
    }

    const desc = stripTooltip(tr.tooltip_text) || name
    const bestUnits = traitToUnits.get(name) ?? []

    synergies.push({
      id: normSynId(name),
      name,
      description: desc,
      thresholds,
      bestUnits,
      bestComps: [],
      counters: [],
      type: "hybrid",
    })
  }

  synergies.sort((a, b) => a.name.localeCompare(b.name))
  return synergies
}

function serializeTs(unitTraits, synergies) {
  const u = JSON.stringify(unitTraits, null, 2)
  const s = JSON.stringify(synergies, null, 2)
  return `/* eslint-disable */
// AUTO-GENERATED by scripts/generate-tft-from-riot.mjs — do not edit by hand.
// Source: Community Dragon → Riot TFT game data (tftchampions.json, tfttraits.json). Not League of Legends Summoner's Rift data.

export const TFT17_UNIT_TRAITS: Record<string, string[]> = ${u}

export const SYNERGIES_FROM_RIOT_DATA = ${s}

export function traitsForUnit(name: string, fallback: string[]): string[] {
  const t = TFT17_UNIT_TRAITS[name]
  return t?.length ? t : fallback
}
`
}

async function patchUnitsTs(unitsPath, src) {
  if (src.includes("traitsForUnit(")) {
    console.log("units.ts already uses traitsForUnit — skipping trait line patch")
    return
  }
  const importLine =
    'import { traitsForUnit } from "./tftFromRiot.generated"\n'
  const out =
    (src.includes("tftFromRiot.generated") ? src : importLine + src).replace(
      /name:"([^"]+)",cost:(\d+),traits:\[([^\]]*)\]/g,
      (_, name, cost, inner) =>
        `name:"${name}",cost:${cost},traits: traitsForUnit("${name}",[${inner}])`,
    )
  await fs.writeFile(unitsPath, out, "utf8")
}

async function main() {
  const [championsJson, traitsJson, unitsSrc] = await Promise.all([
    fetchJson(TFT_CHAMPIONS_URL),
    fetchJson(TFT_TRAITS_URL),
    fs.readFile(path.join(ROOT, "src/data/units.ts"), "utf8"),
  ])

  const unitNames = collectUnitNamesFromUnitsTs(unitsSrc)
  const unitTraits = buildUnitTraitsMap(championsJson, unitNames)
  const traitToUnits = reverseTraitToUnits(unitTraits)
  const synergies = buildSynergies(traitsJson, traitToUnits)

  const genPath = path.join(ROOT, "src/data/tftFromRiot.generated.ts")
  await fs.writeFile(genPath, serializeTs(unitTraits, synergies), "utf8")

  const unitsPath = path.join(ROOT, "src/data/units.ts")
  await patchUnitsTs(unitsPath, unitsSrc)

  console.log(
    `Wrote ${genPath} (${Object.keys(unitTraits).length} units, ${synergies.length} traits) and patched units.ts`,
  )
  const missing = unitNames.filter((n) => !unitTraits[n])
  if (missing.length)
    console.warn("No TFT17 CD match for units:", missing.join(", "))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
