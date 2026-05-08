#!/usr/bin/env node
import { fetchJson } from "./lib/ddragon.mjs"

const TFT_ITEMS_URL =
  "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/tftitems.json"

function isAugmentIconPath(p) {
  return typeof p === "string" && /augments/i.test(p)
}

const j = await fetchJson(TFT_ITEMS_URL)
const out = []
for (const k of Object.keys(j)) {
  const it = j[k]
  if (!it?.squareIconPath || !isAugmentIconPath(it.squareIconPath)) continue
  if (!/Set17|TFT_Set17|set17/i.test(it.squareIconPath)) continue
  out.push(it.name)
}
out.sort()
console.log(out.join("\n"))
