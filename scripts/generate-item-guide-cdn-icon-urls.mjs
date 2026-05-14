#!/usr/bin/env node
/**
 * Resolves Community Dragon PNG URLs for artifact / anima / divine guide rows
 * (Hexcore paths from tftitems.json — not maps/particles/tft/item_icons).
 *
 * Usage: node scripts/generate-item-guide-cdn-icon-urls.mjs
 * Output: src/data/itemGuideCdnIconUrls.json
 */
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, "..")

const TFT_ITEMS_URL =
  "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/tftitems.json"

function norm(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]/g, "")
}

function cdAssetUrl(squareIconPath) {
  if (!squareIconPath || typeof squareIconPath !== "string") return null
  const idx = squareIconPath.indexOf("/ASSETS/")
  if (idx === -1) return null
  const rest = squareIconPath.slice(idx + "/ASSETS/".length)
  const urlPath = rest
    .split("/")
    .map((s) => s.toLowerCase())
    .join("/")
  return `https://raw.communitydragon.org/latest/game/assets/${urlPath}`.replace(/\.tex$/i, ".png")
}

function pickSet17(rows) {
  if (!rows?.length) return null
  const s17 = rows.filter((r) => /set17|tft17_/i.test(r.squareIconPath || ""))
  return s17.length ? s17[s17.length - 1] : rows[rows.length - 1]
}

/** CD sometimes mis-tags rows (e.g. "Sniper's Focus" → wrong artifact icon). Prefer plausible paths. */
function pickItemRow(name, rows) {
  if (!rows?.length) return null
  let pool = rows
  if (name === "Sniper's Focus") {
    const noHorizon = rows.filter((r) => !/ornnhorizonfocus/i.test(r.squareIconPath || ""))
    if (noHorizon.length) pool = noHorizon
  }
  return pickSet17(pool)
}

async function main() {
  const res = await fetch(TFT_ITEMS_URL)
  if (!res.ok) throw new Error(`${res.status} ${TFT_ITEMS_URL}`)
  const j = await res.json()

  const byNorm = new Map()
  for (const x of Object.values(j)) {
    if (!x?.name || !x.squareIconPath) continue
    const n = norm(x.name)
    if (!byNorm.has(n)) byNorm.set(n, [])
    byNorm.get(n).push(x)
  }

  const names = new Set()
  for (const f of ["itemGuideArtifacts.json", "itemGuideAnima.json", "itemGuideDivine.json"]) {
    const arr = JSON.parse(fs.readFileSync(path.join(ROOT, "src/data", f), "utf8"))
    for (const r of arr) names.add(r.name)
  }

  /** CD has no separate Set17 row for non-Radiant Kayle sword — reuse Radiant art. */
  const MANUAL = {}
  const radiantKayle = pickSet17(byNorm.get(norm("Kayle's Radiant Exaltation")))
  if (radiantKayle) {
    const u = cdAssetUrl(radiantKayle.squareIconPath)
    if (u) MANUAL["Kayle's Exaltation"] = u
  }

  /** No Set17 tftitems row named "Horizon Focus" — fallback reuses Set13 artifact asset. */
  MANUAL["Horizon Focus"] =
    "https://raw.communitydragon.org/latest/game/assets/maps/tft/icons/items/hexcore/tft9_item_ornnhorizonfocus.tft_set13.png"

  /** CD mis-tags duplicate display rows; real asset lives under item_icons/ornn_items. */
  MANUAL["Sniper's Focus"] =
    "https://raw.communitydragon.org/latest/game/assets/maps/particles/tft/item_icons/ornn_items/tft9_ornnitem_snipersfocus.png"

  const out = { ...MANUAL }
  for (const name of names) {
    if (out[name]) continue
    const rows = byNorm.get(norm(name))
    const it = pickItemRow(name, rows)
    if (!it) {
      console.warn("[item icon] no tftitems match:", name)
      continue
    }
    const url = cdAssetUrl(it.squareIconPath)
    if (url) out[name] = url
  }

  const dest = path.join(ROOT, "src/data/itemGuideCdnIconUrls.json")
  fs.writeFileSync(dest, JSON.stringify(out, null, 2) + "\n")
  console.log("wrote", Object.keys(out).length, "entries →", path.relative(ROOT, dest))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
