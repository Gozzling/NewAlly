#!/usr/bin/env node
/**
 * Downloads champion square portraits from League Data Dragon into public/unit-icons/.
 * Matches units in src/data/units.ts to champions by normalized name (handles Kai'Sa vs Kaisa).
 *
 * TFT-original units (no League champion) are skipped with a warning — add manual art later.
 *
 * Usage: node scripts/download-unit-icons.mjs
 */
import fs from "fs/promises"
import path from "path"
import { fileURLToPath } from "url"
import { getLatestVersion, fetchJson, normAlnum } from "./lib/ddragon.mjs"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, "..")

/** Mirrors src/utils/unitDisplay.ts ICON_SLUG_BY_MATCH_KEY + unitIconSlug */
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

async function main() {
  const unitsPath = path.join(ROOT, "src/data/units.ts")
  const src = await fs.readFile(unitsPath, "utf8")
  const names = [
    ...new Set(
      [...src.matchAll(/\{id:"u_[^"]+",name:"([^"]+)"/g)].map((m) => m[1]),
    ),
  ]

  const version = await getLatestVersion()
  const champData = await fetchJson(
    `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`,
  )

  /** @type {Map<string, { file: string }>} */
  const byNorm = new Map()
  for (const ch of Object.values(champData.data)) {
    const n = normAlnum(ch.name)
    const id = normAlnum(ch.id)
    const payload = { file: ch.image.full }
    if (!byNorm.has(n)) byNorm.set(n, payload)
    if (!byNorm.has(id)) byNorm.set(id, payload)
  }

  const outDir = path.join(ROOT, "public/unit-icons")
  await fs.mkdir(outDir, { recursive: true })

  let ok = 0
  let skip = 0
  for (const name of names) {
    const slug = unitIconSlug(name)
    const key = normAlnum(name)
    const hit = byNorm.get(key)
    if (!hit) {
      console.warn(`[skip] No League champion match: "${name}" (slug ${slug})`)
      skip++
      continue
    }
    const url = `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${hit.file}`
    const res = await fetch(url)
    if (!res.ok) {
      console.warn(`[fail] HTTP ${res.status} ${url}`)
      skip++
      continue
    }
    const buf = Buffer.from(await res.arrayBuffer())
    await fs.writeFile(path.join(outDir, `${slug}.png`), buf)
    ok++
    console.log(`ok ${slug}.png ← ${hit.file}`)
  }

  console.log(`\nDone. ${ok} saved, ${skip} skipped/missing. Data Dragon ${version}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
