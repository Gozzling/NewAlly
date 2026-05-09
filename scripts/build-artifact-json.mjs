import fs from "fs"

const DUMP = process.argv[2]
if (!DUMP) {
  console.error("need dump path")
  process.exit(1)
}

const t = fs.readFileSync(DUMP, "utf8").replace(/\r\n/g, "\n")
const a0 = t.indexOf("## Artifact")
const a1 = t.indexOf("## Other")
const region = t.slice(a0, a1)

const titles = [
  "Aegis of Dawn",
  "Aegis of Dusk",
  "Ahri's Aura",
  "Blacksmith's Gloves",
  "Blighting Jewel",
  "Cappa Juice",
  "Dawncore",
  "Death's Defiance",
  "Ekko's Patience",
  "Eternal Pact",
  "Evelynn's Instinct",
  "Fishbones",
  "Flickerblades",
  "Gambler's Blade",
  "Gold Collector",
  "Hellfire Hatchet",
  "Horizon Focus",
  "Hullcrusher",
  "Infinity Force",
  "Lich Bane",
  "Lightshield Crest",
  "Luden's Tempest",
  "Mittens",
  "Mogul's Mail",
  "Prowler's Claw",
  "Rapid Firecannon",
  "Seeker's Armguard",
  "Silvermere Dawn",
  "Sniper's Focus",
  "Soraka's Miracle",
  "Statikk Shiv",
  "Talisman Of Ascension",
  "The Indomitable",
  "Thresh's Lantern",
  "Titanic Hydra",
  "Varus's Obsession",
  "Void Gauntlet",
  "Wit's End",
  "Yasuo's Bladework",
  "Zhonya's Paradox",
]

const out = []
let searchFrom = 0
for (let ti = 0; ti < titles.length; ti++) {
  const name = titles[ti]
  const needle = ti === 0 ? `${name}\n` : `\n${name}\n`
  let pos = region.indexOf(needle, searchFrom)
  if (pos < 0) {
    console.error("missing", name)
    continue
  }
  const titleStart = needle.startsWith("\n") ? pos + 1 : pos
  const lineEnd = region.indexOf("\n", titleStart)
  const end =
    ti + 1 < titles.length
      ? region.indexOf(`\n${titles[ti + 1]}\n`, lineEnd + 1)
      : region.length
  let body = region.slice(lineEnd + 1, end).trim()
  const lines = body.split("\n")
  const statLines = []
  let li = 0
  while (li < lines.length) {
    while (li < lines.length && !lines[li].trim()) li++
    if (li >= lines.length) break
    if (!lines[li].trim().startsWith("+")) break
    const s = lines[li].trim()
    if (s !== "+") statLines.push(s)
    li++
  }
  while (li < lines.length && !lines[li].trim()) li++
  const stats = statLines.join("\n")
  const effect = lines.slice(li).join("\n").trim()
  out.push({ name, stats, effect })
  searchFrom = lineEnd + 1
}

for (const row of out) {
  row.effect = row.effect.replace(/\ntft_[^\n]+/g, "")
}
const artifactsForFile = out.filter((x) => x.name !== "Rapid Firecannon")
fs.writeFileSync("src/data/itemGuideArtifacts.json", JSON.stringify(artifactsForFile, null, 2))
console.log("artifacts", out.length)

const itemsTs = fs.readFileSync("src/data/items.ts", "utf8").replace(/\r\n/g, "\n")
function recordKeys(ts, exportName) {
  const m = ts.match(
    new RegExp(`export const ${exportName}[^=]*=\\s*\\{([\\s\\S]*?)\\}\\s*\\n\\nexport const`),
  )
  if (!m) throw new Error(`missing ${exportName} block`)
  return [...m[1].matchAll(/^\s*"([^"]+)":\s*\[/gm)].map((x) => x[1])
}
const craftNames = recordKeys(itemsTs, "ITEM_RECIPES")
const craftRegion = t.slice(t.indexOf("## Craftable"), t.indexOf("## Emblem"))
const TFT_NAME = { "Guardian Angel": "Edge of Night" }
const coreOut = []
for (const name of craftNames) {
  const tftName = TFT_NAME[name] ?? name
  const needle = `\n${tftName}\n`
  const pos = craftRegion.indexOf(needle)
  if (pos < 0) {
    console.error("core missing", name, tftName)
    continue
  }
  const titleStart = pos + 1
  const lineEnd = craftRegion.indexOf("\n", titleStart)
  const rest = craftRegion.slice(lineEnd + 1)
  const nextTitle = rest.search(/\n[A-Za-z0-9][^\n]*\n\n\+/)
  const end = nextTitle > 0 ? lineEnd + 1 + nextTitle : craftRegion.length
  let body = craftRegion.slice(lineEnd + 1, end).trim()
  const lines = body.split("\n")
  const statLines = []
  let li = 0
  while (li < lines.length) {
    while (li < lines.length && !lines[li].trim()) li++
    if (li >= lines.length) break
    if (!lines[li].trim().startsWith("+")) break
    const s = lines[li].trim()
    if (s !== "+") statLines.push(s)
    li++
  }
  while (li < lines.length && !lines[li].trim()) li++
  const stats = statLines.join("\n")
  let effect = lines.slice(li).join("\n").trim()
  effect = effect.replace(/\ntft_[^\n]+/g, "").replace(/\ntft10_headliner_default\n*/g, "")
  coreOut.push({ name, stats, effect })
}
const rfcArt = out.find((x) => x.name === "Rapid Firecannon")
if (rfcArt) coreOut.push({ name: "Rapid Firecannon", stats: rfcArt.stats, effect: rfcArt.effect })
coreOut.push({
  name: "Redemption",
  stats: "+300 Health\n+1 Mana Regen",
  effect:
    "Every 5 seconds, heal allies within 2 hexes for 12% of their missing Health.\n\n(Not listed on tft.tools Set 17 sheet — confirm numbers in-game.)",
})

fs.writeFileSync("src/data/itemGuideCore.json", JSON.stringify(coreOut, null, 2))
console.log("core", coreOut.length)

const emblemNames = recordKeys(itemsTs, "EMBLEM_RECIPES")
const emblemRegion = t.slice(t.indexOf("## Emblem"), t.indexOf("## Radiant"))
const emblemOut = []
for (const name of emblemNames) {
  const tftName = name === "Mecha Emblem" ? "Primordian Emblem" : name
  const needle = `\n${tftName}\n`
  const pos = emblemRegion.indexOf(needle)
  if (pos < 0) {
    console.error("emblem missing", name, tftName)
    continue
  }
  const titleStart = pos + 1
  const lineEnd = emblemRegion.indexOf("\n", titleStart)
  const rest = emblemRegion.slice(lineEnd + 1)
  const nextM = rest.match(/\n[A-Z][^\n]+\n\n\+/)
  const end = nextM ? lineEnd + 1 + nextM.index : emblemRegion.length
  let body = emblemRegion.slice(lineEnd + 1, end).trim()
  const lines = body.split("\n")
  const statLines = []
  let li = 0
  while (li < lines.length) {
    while (li < lines.length && !lines[li].trim()) li++
    if (li >= lines.length) break
    if (!lines[li].trim().startsWith("+")) break
    const s = lines[li].trim()
    if (s !== "+") statLines.push(s)
    li++
  }
  while (li < lines.length && !lines[li].trim()) li++
  let effect = lines.slice(li).join("\n").trim()
  effect = effect.replace(/\ntft_[^\n]+/g, "").replace(/\ntft10_headliner_default\n*/g, "")
  if (name === "Mecha Emblem" && tftName === "Primordian Emblem") {
    effect = effect.replace(/Primordian/g, "Mecha (Primordian)")
  }
  emblemOut.push({ name, stats: statLines.join("\n"), effect })
}
if (!emblemOut.some((e) => e.name === "Replicator Emblem")) {
  emblemOut.push({
    name: "Replicator Emblem",
    stats: "+10% Attack Speed\n+15% Ability Power",
    effect: "The holder gains the Replicator trait.",
  })
}
if (!emblemOut.some((e) => e.name === "Conduit Emblem")) {
  emblemOut.push({
    name: "Conduit Emblem",
    stats: "+15% Ability Power\n+150 Health",
    effect: "The holder gains the Conduit trait.",
  })
}

fs.writeFileSync("src/data/itemGuideEmblems.json", JSON.stringify(emblemOut, null, 2))
console.log("emblems", emblemOut.length)

const animaTitles = [
  "Animapocalypse",
  "Battle Bunny Crossbow",
  "Broken Prototype",
  "Bunny Prime Ballista",
  "Cyclonic Slicers",
  "Deep Freeze",
  "Echoing Batblades",
  "Evolved Embershot",
  "Iceblast Armor",
  "Leaky Prototype",
  "Leonine Lamentation",
  "Lioness's Lament",
  "Omniweapon",
  "OwO Blaster",
  "Radiant Field",
  "Rocket Swarm",
  "Savage Slicer",
  "Searing Shortbow",
  "Solar Eclipse",
  "Sparking Prototype",
  "Tentacle Slam",
  "The Annihilator",
  "Unceasing Cyclone",
  "UwU Blaster",
  "Vayne's Chromablades",
]

const other = t.slice(t.indexOf("## Other"))
const animaOut = []
searchFrom = 0
for (let ti = 0; ti < animaTitles.length; ti++) {
  const name = animaTitles[ti]
  const needle = ti === 0 ? `${name}\n` : `\n${name}\n`
  let pos = other.indexOf(needle, searchFrom)
  if (pos < 0) {
    console.error("anima missing", name)
    continue
  }
  const titleStart = needle.startsWith("\n") ? pos + 1 : pos
  const lineEnd = other.indexOf("\n", titleStart)
  const end =
    ti + 1 < animaTitles.length
      ? other.indexOf(`\n${animaTitles[ti + 1]}\n`, lineEnd + 1)
      : other.length
  let body = other.slice(lineEnd + 1, end).trim()
  const lines = body.split("\n")
  const statLines = []
  let li = 0
  while (li < lines.length) {
    while (li < lines.length && !lines[li].trim()) li++
    if (li >= lines.length) break
    if (!lines[li].trim().startsWith("+")) break
    const s = lines[li].trim()
    if (s !== "+") statLines.push(s)
    li++
  }
  while (li < lines.length && !lines[li].trim()) li++
  const stats = statLines.join("\n")
  let effect = lines.slice(li).join("\n").trim()
  effect = effect.replace(/\ntft_[^\n]+/g, "")
  animaOut.push({ name, stats, effect })
  searchFrom = lineEnd + 1
}

fs.writeFileSync("src/data/itemGuideAnima.json", JSON.stringify(animaOut, null, 2))
console.log("anima", animaOut.length)

const divineTitles = ["Kayle's Exaltation", "Kayle's Radiant Exaltation"]
const divineOut = []
searchFrom = 0
for (let ti = 0; ti < divineTitles.length; ti++) {
  const name = divineTitles[ti]
  const needle = ti === 0 ? `${name}\n` : `\n${name}\n`
  let pos = other.indexOf(needle, searchFrom)
  if (pos < 0) {
    console.error("divine missing", name)
    continue
  }
  const titleStart = needle.startsWith("\n") ? pos + 1 : pos
  const lineEnd = other.indexOf("\n", titleStart)
  const end =
    ti + 1 < divineTitles.length
      ? other.indexOf(`\n${divineTitles[ti + 1]}\n`, lineEnd + 1)
      : other.indexOf("\nLeaky Prototype\n", lineEnd + 1)
  let body = other.slice(lineEnd + 1, end).trim()
  const lines = body.split("\n")
  const statLines = []
  let li = 0
  while (li < lines.length) {
    while (li < lines.length && !lines[li].trim()) li++
    if (li >= lines.length) break
    if (!lines[li].trim().startsWith("+")) break
    const s = lines[li].trim()
    if (s !== "+") statLines.push(s)
    li++
  }
  while (li < lines.length && !lines[li].trim()) li++
  const stats = statLines.join("\n")
  const effect = lines.slice(li).join("\n").trim()
  divineOut.push({ name, stats, effect })
  searchFrom = lineEnd + 1
}

fs.writeFileSync("src/data/itemGuideDivine.json", JSON.stringify(divineOut, null, 2))
console.log("divine", divineOut.length)
