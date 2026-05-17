#!/usr/bin/env node
/**
 * Fetches Community Dragon TFT English static data, parses it into normalized JSON files.
 *
 * Note: The Riot plugin path `.../v1/en_us.json` often 404s; this script falls back to
 * `https://raw.communitydragon.org/latest/cdragon/tft/en_us.json` (CDragon TFT bundle).
 *
 * Usage:
 *   node scripts/parse-tft-static-data.mjs
 *   node scripts/parse-tft-static-data.mjs --set 17 --out data/tft-static
 *   TFT_EN_US_URL=<url> node scripts/parse-tft-static-data.mjs
 *
 * Output (under --out, default `data/tft-static/en`):
 *   meta.json
 *   units.json
 *   traits.json
 *   items/components.json | finished.json | radiants.json | artifacts.json
 *   augments.json
 *   godBoons.json
 */
import fs from "fs/promises"
import path from "path"
import { fileURLToPath } from "url"
import { fetchJson } from "./lib/ddragon.mjs"
import {
  EN_US_URL_CANDIDATES,
  TFT_SETS_URL,
  detectCurrentSetNumber,
  parseEnUsBundle,
  setCoreName,
} from "./lib/tftEnUsParse.mjs"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, "..")

function parseArgs(argv) {
  const opts = { set: null, out: path.join(ROOT, "data/tft-static/en") }
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--set" && argv[i + 1]) {
      opts.set = parseInt(argv[++i], 10)
    } else if (argv[i] === "--out" && argv[i + 1]) {
      opts.out = path.resolve(ROOT, argv[++i])
    }
  }
  return opts
}

async function fetchEnUsJson() {
  const errors = []
  for (const url of EN_US_URL_CANDIDATES) {
    try {
      const data = await fetchJson(url)
      if (!data?.sets || !data?.items) {
        throw new Error("Unexpected shape: missing sets/items")
      }
      return { url, data }
    } catch (e) {
      errors.push(`${url}: ${e.message}`)
    }
  }
  throw new Error(`Failed to fetch en_us.json:\n${errors.join("\n")}`)
}

async function resolveSetNumber(requestedSet, enUs) {
  if (requestedSet != null && Number.isFinite(requestedSet)) return requestedSet
  try {
    const setsMeta = await fetchJson(TFT_SETS_URL)
    const active = setsMeta?.LCTFTModeData?.mActiveSets || []
    const live = active.find(
      (s) =>
        s.SetName === s.SetCoreName &&
        /^TFTSet\d+$/.test(String(s.SetCoreName || "")),
    )
    if (live?.SetCoreName) {
      const n = parseInt(String(live.SetCoreName).replace("TFTSet", ""), 10)
      if (Number.isFinite(n)) return n
    }
  } catch {
    /* use en_us sets max */
  }
  return detectCurrentSetNumber(enUs)
}

async function writeJson(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8")
}

async function main() {
  const opts = parseArgs(process.argv)
  const { url, data: enUs } = await fetchEnUsJson()
  const setNumber = await resolveSetNumber(opts.set, enUs)
  const bundle = parseEnUsBundle(enUs, setNumber)

  bundle.meta = {
    ...bundle.meta,
    generatedAt: new Date().toISOString(),
    sourceUrl: url,
    setCoreName: setCoreName(setNumber),
    counts: {
      units: bundle.units.length,
      traits: bundle.traits.length,
      items: {
        components: bundle.items.components.length,
        finished: bundle.items.finished.length,
        radiants: bundle.items.radiants.length,
        artifacts: bundle.items.artifacts.length,
      },
      augments: bundle.augments.length,
      godBoons: bundle.godBoons.length,
    },
  }

  const outDir = opts.out
  await Promise.all([
    writeJson(path.join(outDir, "meta.json"), bundle.meta),
    writeJson(path.join(outDir, "units.json"), bundle.units),
    writeJson(path.join(outDir, "traits.json"), bundle.traits),
    writeJson(path.join(outDir, "items/components.json"), bundle.items.components),
    writeJson(path.join(outDir, "items/finished.json"), bundle.items.finished),
    writeJson(path.join(outDir, "items/radiants.json"), bundle.items.radiants),
    writeJson(path.join(outDir, "items/artifacts.json"), bundle.items.artifacts),
    writeJson(path.join(outDir, "augments.json"), bundle.augments),
    writeJson(path.join(outDir, "godBoons.json"), bundle.godBoons),
  ])

  console.log(`Source: ${url}`)
  console.log(`Set ${setNumber} (${bundle.meta.setCoreName}) → ${outDir}`)
  console.log(JSON.stringify(bundle.meta.counts, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
