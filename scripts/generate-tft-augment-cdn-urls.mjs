#!/usr/bin/env node
/**
 * One-shot: map AugmentGuide display names → Community Dragon raw URLs (tftitems Set17 augments).
 * Run: node scripts/generate-tft-augment-cdn-urls.mjs
 */
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, "..")

const TFT_ITEMS_URL =
  "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/tftitems.json"

function cdAssetUrl(squareIconPath) {
  if (!squareIconPath || typeof squareIconPath !== "string") return null
  const idx = squareIconPath.indexOf("/ASSETS/")
  if (idx === -1) return null
  const rest = squareIconPath.slice(idx + "/ASSETS/".length)
  const urlPath = rest.split("/").map((s) => s.toLowerCase()).join("/")
  return `https://raw.communitydragon.org/latest/game/assets/${urlPath}`
}

function norm(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]/g, "")
}

const GUIDE_NAMES = [
  "Space God Blessing",
  "Divine Right",
  "Arbiter's Gaze",
  "Meeple Mayhem",
  "N.O.V.A. Surge",
  "Stargazer's Call",
  "Cosmic Harmony",
  "Space Groove",
  "Vanguard's Might",
  "Bastion's Shield",
  "Primordial Swarm",
  "Brawler's Fury",
  "Rogue's Edge",
  "Challenger's Strike",
  "Sniper's Focus",
  "Timebreaker's Echo",
  "Psionic Overload",
  "Marauder's Charge",
  "Voyager's Journey",
  "Replicator's Field",
  "Shepherd's Blessing",
  "Anima's Grace",
  "Dark Star's Embrace",
  "Mecha's Might",
  "Conduit's Flow",
]

async function main() {
  const aliasRaw = await fs.promises
    .readFile(path.join(ROOT, "scripts/tft-augment-icon-aliases.json"), "utf8")
    .catch(() => "{}")
  const aliases = JSON.parse(aliasRaw)

  const res = await fetch(TFT_ITEMS_URL)
  if (!res.ok) throw new Error(`${res.status} tftitems`)
  const j = await res.json()

  const byNorm = new Map()
  for (const k of Object.keys(j)) {
    const it = j[k]
    if (!it?.name || !it.squareIconPath) continue
    if (!/Set17|TFT_Set17|TFT17_/i.test(it.squareIconPath)) continue
    if (!/Augments|Hexcore|Items\/Hexcore/i.test(it.squareIconPath)) continue
    const n = norm(it.name)
    if (!byNorm.has(n)) byNorm.set(n, [])
    byNorm.get(n).push(it)
  }

  const out = {}
  for (const g of GUIDE_NAMES) {
    const lookup = aliases[g] ?? g
    const pool = byNorm.get(norm(lookup)) ?? []
    const pick = pool[0]
    const url = pick ? cdAssetUrl(pick.squareIconPath) : null
    out[g] = url
    console.log(`${g} → ${pick?.name ?? "MISS"}`)
  }

  await fs.promises.writeFile(
    path.join(ROOT, "src/data/tftAugmentCdnUrls.json"),
    JSON.stringify(out, null, 2),
    "utf8",
  )
  console.log("Wrote src/data/tftAugmentCdnUrls.json")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
