#!/usr/bin/env node
/**
 * Downloads Summoner's Rift item icons from Data Dragon into public/item-icons/.
 * TFT-only names get a reasonable SR placeholder via TFT_FALLBACK (same slug rules as src/utils/itemDisplay.ts).
 *
 * Usage: node scripts/download-item-icons.mjs
 */
import fs from "fs/promises"
import path from "path"
import { fileURLToPath } from "url"
import { getLatestVersion, fetchJson, normAlnum } from "./lib/ddragon.mjs"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, "..")

function itemIconSlug(displayName) {
  return displayName.replace(/['\u2019\u0060\u00B4]/g, "").replace(/\s+/g, "")
}

/** TFT guide names → SR item name for icon (approximate visual placeholder). */
const TFT_FALLBACK = {
  "Giant Slayer": "Mortal Reminder",
  "Jeweled Gauntlet": "Iceborn Gauntlet",
  "Blue Buff": "Tear of the Goddess",
  "Sunfire Cape": "Sunfire Aegis",
  "Titan's Resolve": "Titanic Hydra",
  "Ionic Spark": "Statikk Shiv",
  "Sparring Gloves": "Vortex Glove",
}

/** Set-specific crafts — component icons as placeholders */
const PSIONIC_PLACEHOLDER = {
  "Biomatter Preserver": "Giant's Belt",
  "Drone Uplink": "B.F. Sword",
  "Malware Matrix": "Tear of the Goddess",
  "Sympathetic Implant": "Chain Vest",
  "Target-Lock Optics": "Sparring Gloves",
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

async function downloadOne(version, outDir, byNorm, name) {
  const slug = itemIconSlug(name)
  const n = normAlnum(name)
  const file = byNorm.get(n)
  if (!file) return { slug, ok: false, reason: "no-match" }
  const url = `https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${file}`
  const res = await fetch(url)
  if (!res.ok) return { slug, ok: false, reason: `http-${res.status}` }
  const buf = Buffer.from(await res.arrayBuffer())
  await fs.writeFile(path.join(outDir, `${slug}.png`), buf)
  return { slug, ok: true, file }
}

async function main() {
  const itemsTs = await fs.readFile(path.join(ROOT, "src/data/items.ts"), "utf8")
  let names = collectItemNamesFromItemsTs(itemsTs)
  for (const src of Object.values(TFT_FALLBACK)) {
    if (!names.includes(src)) names.push(src)
  }

  const version = await getLatestVersion()
  const itemJson = await fetchJson(
    `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/item.json`,
  )

  const byNorm = new Map()
  for (const [, it] of Object.entries(itemJson.data)) {
    const n = normAlnum(it.name)
    if (!byNorm.has(n)) byNorm.set(n, it.image.full)
  }

  const outDir = path.join(ROOT, "public/item-icons")
  await fs.mkdir(outDir, { recursive: true })

  let ok = 0
  let skip = 0
  for (const name of names) {
    const r = await downloadOne(version, outDir, byNorm, name)
    if (r.ok) {
      ok++
      console.log(`ok ${r.slug}.png`)
    } else {
      console.warn(`[skip] "${name}" (${r.reason})`)
      skip++
    }
  }

  for (const [tftName, srName] of Object.entries(TFT_FALLBACK)) {
    const fromSlug = itemIconSlug(srName)
    const toSlug = itemIconSlug(tftName)
    const fromPath = path.join(outDir, `${fromSlug}.png`)
    const toPath = path.join(outDir, `${toSlug}.png`)
    try {
      await fs.copyFile(fromPath, toPath)
      console.log(`fallback ${toSlug}.png ← ${fromSlug}.png (${tftName})`)
      ok++
    } catch {
      console.warn(`[fallback-fail] ${tftName}`)
    }
  }

  for (const [tftName, srcDisp] of Object.entries(PSIONIC_PLACEHOLDER)) {
    const fromSlug = itemIconSlug(srcDisp)
    const toSlug = itemIconSlug(tftName)
    const fromPath = path.join(outDir, `${fromSlug}.png`)
    const toPath = path.join(outDir, `${toSlug}.png`)
    try {
      await fs.copyFile(fromPath, toPath)
      console.log(`psionic ${toSlug}.png ← ${fromSlug}.png`)
      ok++
    } catch {
      console.warn(`[psionic-fail] ${tftName}`)
    }
  }

  console.log(`\nDone. ~${ok} writes, ${skip} unmatched in first pass. Data Dragon ${version}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
