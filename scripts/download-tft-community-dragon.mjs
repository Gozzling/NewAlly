#!/usr/bin/env node
/**
 * Downloads Teamfight Tactics Set 17 icons from Community Dragon (CommunityDragon.org raw).
 * Overwrites / complements Data Dragon outputs:
 *   - public/unit-icons/<slug>.png — tftchampions.json (prefer TFT17_* characters)
 *   - public/item-icons/<slug>.png — tftitems.json (prefer paths containing Set17 / TFT_Set17)
 *   - public/augment-icons/<slug>.png — tftitems rows whose icon path looks like an augment;
 *       resolves guide names via exact CD name match, then scripts/tft-augment-icon-aliases.json
 *   - Finished items / emblems: scripts/tft-item-icon-aliases.json maps Ally labels → CD `name`
 *     when tftitems uses different display strings (e.g. TFT_Item_Redemption → "Spirit Visage").
 *
 * Aliases JSON shape: { "Your Guide Name": "Exact CD tftitems name" }
 *
 * Usage: node scripts/download-tft-community-dragon.mjs
 */
import fs from "fs/promises"
import path from "path"
import { fileURLToPath } from "url"
import {
  cdAssetUrl,
  tftSetFromCharacterId,
  setRankFromIconPath,
} from "./lib/communityDragon.mjs"
import { normAlnum } from "./lib/ddragon.mjs"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, "..")

const TFT_ITEMS_URL =
  "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/tftitems.json"
const TFT_CHAMPIONS_URL =
  "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/tftchampions.json"

/** When TFT display_name differs from our units.ts label (CD uses full champion title). */
const UNIT_DISPLAY_ALIAS = {
  Nunu: "Nunu & Willump",
}

/** Mirrors src/utils/unitDisplay.ts */
const ICON_SLUG_BY_MATCH_KEY = {
  kaisa: "Kaisa",
  chogath: "ChoGath",
  belveth: "Belveth",
  reksai: "RekSai",
}

function unitIconSlug(displayName) {
  const key = normAlnum(displayName)
  if (ICON_SLUG_BY_MATCH_KEY[key]) return ICON_SLUG_BY_MATCH_KEY[key]
  return displayName.replace(/['\u2019\u0060\u00B4]/g, "").replace(/\s+/g, "")
}

function itemIconSlug(displayName) {
  return displayName.replace(/['\u2019\u0060\u00B4]/g, "").replace(/\s+/g, "")
}

/** Mirrors src/utils/augmentDisplay.ts */
function augmentIconSlug(displayName) {
  return displayName
    .replace(/['\u2019\u0060\u00B4]/g, "")
    .replace(/\s+/g, "")
    .replace(/[^a-zA-Z0-9_-]/g, "")
}

function normName(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]/g, "")
}

async function fetchJson(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${res.status} ${url}`)
  return res.json()
}

async function saveUrlToFile(url, destPath) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${res.status} ${url}`)
  const buf = Buffer.from(await res.arrayBuffer())
  await fs.mkdir(path.dirname(destPath), { recursive: true })
  await fs.writeFile(destPath, buf)
}

function extractUnitNames(ts) {
  return [
    ...new Set(
      [...ts.matchAll(/\{id:"u_[^"]+",name:"([^"]+)"/g)].map((m) => m[1]),
    ),
  ]
}

function collectItemNamesFromItemsTs(src) {
  const names = new Set()
  for (const m of src.matchAll(/^\s*"([^"]+)":\s*\[/gm)) names.add(m[1])
  const arrayStrings = src.match(/ALL_COMPONENTS\s*=\s*\[([\s\S]*?)\]\s*as const/)
  if (arrayStrings) {
    for (const m of arrayStrings[1].matchAll(/"([^"]+)"/g)) names.add(m[1])
  }
  const psionicBlock = src.match(
    /export const PSIONIC_ITEMS:[^\]]*=\s*\[([\s\S]*?)\]\s*\n/,
  )
  if (psionicBlock) {
    for (const m of psionicBlock[1].matchAll(/\{\s*name:\s*"([^"]+)"/g)) names.add(m[1])
  }
  return [...names]
}

function extractAugmentGuideNames(augSrc) {
  const block = augSrc.split("export const AUGMENTS")[1]
  if (!block) return []
  const names = []
  for (const m of block.matchAll(/\n\s*name:\s*"([^"]+)"/g)) names.push(m[1])
  return [...new Set(names)]
}

function pickBestChampion(records) {
  if (!records?.length) return null
  const s17 = records.filter((r) => String(r.character_id).startsWith("TFT17_"))
  if (s17.length) return s17[0]
  return [...records].sort(
    (a, b) =>
      tftSetFromCharacterId(b.character_id) -
      tftSetFromCharacterId(a.character_id),
  )[0]
}

function groupChampionsByDisplay(championsJson) {
  /** @type {Map<string, any[]>} */
  const map = new Map()
  for (const k of Object.keys(championsJson)) {
    const rec = championsJson[k]?.character_record
    if (!rec?.display_name || !rec.squareIconPath) continue
    const n = normName(rec.display_name)
    if (!map.has(n)) map.set(n, [])
    map.get(n).push(rec)
  }
  return map
}

function pickBestItem(itemsForName) {
  if (!itemsForName?.length) return null
  return [...itemsForName].sort(
    (a, b) =>
      setRankFromIconPath(b.squareIconPath) -
      setRankFromIconPath(a.squareIconPath),
  )[0]
}

function groupItemsByNormName(itemsJson) {
  /** @type {Map<string, any[]>} */
  const map = new Map()
  for (const k of Object.keys(itemsJson)) {
    const it = itemsJson[k]
    if (!it?.name || !it.squareIconPath) continue
    const n = normName(it.name)
    if (!map.has(n)) map.set(n, [])
    map.get(n).push(it)
  }
  return map
}

function isAugmentIconPath(p) {
  return typeof p === "string" && /augments/i.test(p)
}

async function main() {
  const [unitsTs, itemsTs, augTs, aliasRaw, itemAliasRaw] = await Promise.all([
    fs.readFile(path.join(ROOT, "src/data/units.ts"), "utf8"),
    fs.readFile(path.join(ROOT, "src/data/items.ts"), "utf8"),
    fs.readFile(path.join(ROOT, "src/data/augments.ts"), "utf8"),
    fs.readFile(path.join(ROOT, "scripts/tft-augment-icon-aliases.json"), "utf8").catch(() => "{}"),
    fs.readFile(path.join(ROOT, "scripts/tft-item-icon-aliases.json"), "utf8").catch(() => "{}"),
  ])

  let aliases = {}
  try {
    aliases = JSON.parse(aliasRaw)
  } catch {
    aliases = {}
  }
  let itemAliases = {}
  try {
    itemAliases = JSON.parse(itemAliasRaw)
  } catch {
    itemAliases = {}
  }

  const [championsJson, itemsJson] = await Promise.all([
    fetchJson(TFT_CHAMPIONS_URL),
    fetchJson(TFT_ITEMS_URL),
  ])

  const byDisplay = groupChampionsByDisplay(championsJson)
  const byItemName = groupItemsByNormName(itemsJson)

  const unitDir = path.join(ROOT, "public/unit-icons")
  const itemDir = path.join(ROOT, "public/item-icons")
  const augDir = path.join(ROOT, "public/augment-icons")

  let unitOk = 0
  let unitSkip = 0
  for (const name of extractUnitNames(unitsTs)) {
    const slug = unitIconSlug(name)
    let rec = pickBestChampion(
      byDisplay.get(normName(UNIT_DISPLAY_ALIAS[name] ?? name)) ?? [],
    )
    if (!rec) {
      rec = pickBestChampion(byDisplay.get(normName(name)) ?? [])
    }
    const url = rec ? cdAssetUrl(rec.squareIconPath) : null
    if (!url) {
      console.warn(`[unit skip] "${name}"`)
      unitSkip++
      continue
    }
    try {
      await saveUrlToFile(url, path.join(unitDir, `${slug}.png`))
      console.log(`unit ${slug}.png ← CD ${rec.character_id}`)
      unitOk++
    } catch (e) {
      console.warn(`[unit fail] ${name}`, e.message)
      unitSkip++
    }
  }

  let itemOk = 0
  let itemSkip = 0
  for (const name of collectItemNamesFromItemsTs(itemsTs)) {
    const slug = itemIconSlug(name)
    const aliasTarget = itemAliases[name]
    const lookupName = aliasTarget ?? name
    const candidates = byItemName.get(normName(lookupName)) ?? []
    const it = candidates.length ? pickBestItem(candidates) : null
    const url = it ? cdAssetUrl(it.squareIconPath) : null
    if (!url) {
      console.warn(`[item skip] "${name}"`)
      itemSkip++
      continue
    }
    try {
      await saveUrlToFile(url, path.join(itemDir, `${slug}.png`))
      console.log(
        `item ${slug}.png ← "${it.name}"${aliasTarget ? " (alias)" : ""}`,
      )
      itemOk++
    } catch (e) {
      console.warn(`[item fail] ${name}`, e.message)
      itemSkip++
    }
  }

  /** CD tftitems rows whose icon lives under Augments (rank Set17 inside pickBestItem). */
  const augmentRecordsByNorm = new Map()
  for (const k of Object.keys(itemsJson)) {
    const it = itemsJson[k]
    if (!it?.name || !it.squareIconPath) continue
    if (!isAugmentIconPath(it.squareIconPath)) continue
    const n = normName(it.name)
    if (!augmentRecordsByNorm.has(n)) augmentRecordsByNorm.set(n, [])
    augmentRecordsByNorm.get(n).push(it)
  }

  let augOk = 0
  let augSkip = 0
  const guideNames = extractAugmentGuideNames(augTs)

  for (const guideName of guideNames) {
    const aliasTarget = aliases[guideName]
    const lookupName = aliasTarget ?? guideName
    const pool = augmentRecordsByNorm.get(normName(lookupName)) ?? []
    const it = pool.length ? pickBestItem(pool) : null
    const url = it ? cdAssetUrl(it.squareIconPath) : null
    const outSlug = augmentIconSlug(guideName)
    if (!url) {
      console.warn(`[augment skip] "${guideName}"`)
      augSkip++
      continue
    }
    try {
      await saveUrlToFile(url, path.join(augDir, `${outSlug}.png`))
      console.log(
        `augment ${outSlug}.png ← "${it.name}"${aliasTarget ? " (alias)" : ""}`,
      )
      augOk++
    } catch (e) {
      console.warn(`[augment fail] ${guideName}`, e.message)
      augSkip++
    }
  }

  console.log(
    `\nCommunity Dragon TFT: units ${unitOk}/${unitOk + unitSkip}, items ${itemOk}/${itemOk + itemSkip}, augments ${augOk}/${augOk + augSkip}. Edit tft-augment-icon-aliases.json / tft-item-icon-aliases.json when CD names differ from Ally.`,
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
