/**
 * Parse Community Dragon TFT `en_us.json` into normalized static records.
 * @see scripts/parse-tft-static-data.mjs
 */

import { cdAssetUrlFromGamePath } from "./communityDragon.mjs"
import { isPlayableRosterUnit } from "./unitRosterFilter.mjs"

export const EN_US_URL_CANDIDATES = [
  process.env.TFT_EN_US_URL,
  "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/en_us.json",
  "https://raw.communitydragon.org/latest/cdragon/tft/en_us.json",
].filter(Boolean)

export const TFT_SETS_URL =
  "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/tftsets.json"

const BANNED_AUGMENT_RE =
  /Carousel|Tutorial|TFTTutorial|Test_|_Test\b|Deprecated|_Clone|Placeholder|BlankAugment|ArmoryTrait|_HR\b|ChoiceUI|LargeQuest|MediumQuest|SmallQuest/i

const MARKET_OFFERING_SKIP_RE =
  /^TFT\d+_MarketOffering_(XP|AugmentWheel|SilverAugment|GoldAugment|PrismaticAugment)/i

const TRAIT_EXCLUDE = [
  { display: "God-Blessed" },
  { display: "Stargazer", apiSuffix: "TFT17_Stargazer" },
]

/** Strip HTML/icons only — keep @placeholders@ for formatTftText at read time. */
export function stripHtmlKeepPlaceholders(html) {
  return String(html || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<expandRow>[\s\S]*?<\/expandRow>/gi, "")
    .replace(/<row>/gi, "\n")
    .replace(/<\/row>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/%i:[A-Za-z0-9_]+%/gi, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/ {2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

export function stripGameText(html) {
  return stripHtmlKeepPlaceholders(html)
    .replace(/@TFTUnitProperty\.trait:[^@]+@/gi, "")
    .replace(/\(@MinUnits@\)/g, "")
    .replace(/@[A-Za-z0-9_*]+@/g, "")
    .replace(/\s*%\s+/g, " ")
    .replace(/\s+%/g, " ")
    .trim()
}

export function detectCurrentSetNumber(enUs) {
  const keys = Object.keys(enUs.sets || {})
    .map((k) => parseInt(k, 10))
    .filter((n) => Number.isFinite(n))
  if (!keys.length) throw new Error("en_us.json has no sets")
  return Math.max(...keys)
}

export function setPrefix(setNumber) {
  return `TFT${setNumber}_`
}

export function setCoreName(setNumber) {
  return `TFTSet${setNumber}`
}

export function referencesSet(pathOrId, setNumber) {
  const s = String(pathOrId || "")
  const n = setNumber
  return (
    s.startsWith(setPrefix(n)) ||
    new RegExp(`Set${n}|TFT_Set${n}`, "i").test(s)
  )
}

export function referencesOlderSet(pathOrId, setNumber) {
  const s = String(pathOrId || "")
  const m = /^TFT(\d+)_/i.exec(s)
  if (m && parseInt(m[1], 10) < setNumber) return true
  const sm = /Set(\d+)/gi
  let match
  while ((match = sm.exec(s))) {
    if (parseInt(match[1], 10) < setNumber) return true
  }
  return false
}

function withIconFields(record, iconPath) {
  return {
    ...record,
    iconPath: iconPath || null,
    iconUrl: cdAssetUrlFromGamePath(iconPath),
  }
}

function baseRecord({ apiName, name, description, iconPath }) {
  return withIconFields(
    {
      apiName: apiName || "",
      name: name || apiName || "",
      description: stripGameText(description),
    },
    iconPath,
  )
}

export function shouldExcludeTrait(trait, setNumber) {
  const api = trait.apiName || ""
  if (api.includes("CarouselMarket")) return true
  for (const rule of TRAIT_EXCLUDE) {
    if (trait.name !== rule.display) continue
    if (rule.apiSuffix && api !== rule.apiSuffix) return true
    if (!rule.apiSuffix) return true
  }
  if (!referencesSet(api, setNumber) && !referencesSet(trait.icon, setNumber)) {
    return true
  }
  return false
}

export function parseUnits(enUs, setNumber) {
  const set = enUs.sets?.[String(setNumber)]
  if (!set?.champions) return []

  const prefix = setPrefix(setNumber)
  const units = []

  for (const ch of set.champions) {
    const apiName = ch.apiName || ch.characterName || ""
    if (!apiName.startsWith(prefix)) continue
    if (!isPlayableRosterUnit(apiName, ch.name)) continue
    if (/_TraitClone$/i.test(apiName)) continue
    const isElderDragon = /_PVE_ElderDragon$/i.test(apiName)
    if (!isElderDragon && !ch.traits?.length) continue

    const unitIconPath =
      ch.tileIcon && referencesSet(ch.tileIcon, setNumber)
        ? ch.tileIcon
        : ch.squareIcon && referencesSet(ch.squareIcon, setNumber)
          ? ch.squareIcon
          : ch.icon && referencesSet(ch.icon, setNumber)
            ? ch.icon
            : null
    units.push(
      withIconFields(
        {
          apiName,
          name: ch.name || apiName,
          description: stripHtmlKeepPlaceholders(ch.ability?.desc),
          cost: ch.cost ?? null,
          traits: (ch.traits || []).map((t) => (typeof t === "string" ? t : t.name)).filter(Boolean),
          ability: ch.ability
            ? {
                name: ch.ability.name || null,
                description: stripHtmlKeepPlaceholders(ch.ability.desc),
                variables: (ch.ability.variables || [])
                  .filter((v) => v && typeof v.name === "string")
                  .map((v) => ({ name: v.name, value: v.value })),
                iconPath: ch.ability.icon || null,
                iconUrl: cdAssetUrlFromGamePath(ch.ability.icon),
              }
            : null,
          stats: ch.stats || null,
          role: ch.role || null,
        },
        unitIconPath,
      ),
    )
  }

  units.sort((a, b) => a.name.localeCompare(b.name))
  return units
}

export function parseTraits(enUs, setNumber) {
  const set = enUs.sets?.[String(setNumber)]
  if (!set?.traits) return []

  const traits = []
  for (const tr of set.traits) {
    if (shouldExcludeTrait(tr, setNumber)) continue
    const thresholds = (tr.effects || [])
      .filter((e) => typeof e.minUnits === "number" && e.minUnits > 0)
      .map((e) => ({
        minUnits: e.minUnits,
        maxUnits: e.maxUnits ?? null,
        style: e.style ?? null,
        variables: e.variables || {},
      }))
      .sort((a, b) => a.minUnits - b.minUnits)

    traits.push(
      baseRecord({
        apiName: tr.apiName,
        name: tr.name,
        description: tr.desc,
        iconPath: tr.icon,
      }),
    )
    const last = traits[traits.length - 1]
    last.thresholds = thresholds
  }

  traits.sort((a, b) => a.name.localeCompare(b.name))
  return traits
}

function isAugmentItem(item) {
  return /augments/i.test(item.icon || "")
}

function isComponentItem(item) {
  return (item.tags || []).some((t) => String(t).toLowerCase() === "component")
}

function isFinishedItem(item) {
  return Array.isArray(item.composition) && item.composition.length === 2
}

function isRadiantItem(item, setNumber, setItemApis) {
  const api = item.apiName || ""
  const blob = `${api}|${item.icon}|${item.name}`
  if (!/radiant/i.test(blob)) return false
  if (setItemApis?.has(api)) return true
  if (referencesOlderSet(blob, setNumber) && !referencesSet(blob, setNumber)) {
    return false
  }
  return referencesSet(blob, setNumber) || api.startsWith("TFT_Item_")
}

function isArtifactItem(item, setNumber) {
  const api = item.apiName || ""
  const icon = item.icon || ""
  if (/augment/i.test(icon)) return false
  if (/CypherArmory|ArmoryItem|@\w+@|loot orb/i.test(api + item.name)) return false
  if (/^TFT\d+_Item_Artifact_/i.test(api) && referencesSet(api, setNumber)) return true
  if (api.startsWith("TFT_Item_Artifact_")) return true
  if (/TFT\d+_Item_Ornn/i.test(api) && referencesSet(api, setNumber)) return true
  if (/Items\/Ornn\//i.test(icon) && referencesSet(icon, setNumber)) return true
  return false
}

function isStandardCraftedItem(item) {
  const api = item.apiName || ""
  if (!api.startsWith("TFT_Item_")) return false
  if (api.includes("Artifact")) return false
  if (/radiant/i.test(api)) return false
  if (!isFinishedItem(item)) return false
  return true
}

export function augmentTier(item) {
  const icon = item.icon || ""
  const file = icon.split("/").pop() || ""
  if (
    /_III\b|[-_]III\.|_3\.|Tier3|Missing-T3|LevelUp3|Prismatic|Kit-III/i.test(
      icon,
    )
  ) {
    return "prismatic"
  }
  if (
    /_II\b|[-_]II\.|_2\.|Tier2|Missing-T2|_Gold\b|Trade2|Nest2|Spotlight2/i.test(
      icon + file,
    )
  ) {
    return "gold"
  }
  if (/_I\b|[-_]I\.|_1\.|Tier1|Missing-T1|_Bronze\b|Forge-I/i.test(icon + file)) {
    return "silver"
  }
  return "unknown"
}

export function isValidAugmentDisplayName(name) {
  if (!name || typeof name !== "string") return false
  if (/^TFT\d+_Augment_/i.test(name)) return false
  if (name.includes("@")) return false
  return name.trim().length > 0
}

/** Set 17 Space Gods — separate from Hextech augments. */
export function isGodBoon(item) {
  const api = item.apiName || ""
  const icon = item.icon || ""
  return /GodAugment/i.test(api) || /\/GodAugment/i.test(icon)
}

export function godBoonMeta(item) {
  const api = item.apiName || ""
  const m = /^TFT\d+_Augment_(.+?)GodAugment/.exec(api)
  const godKey = m?.[1] ?? "Unknown"
  const isPrimary = /^TFT\d+_Augment_[A-Za-z]+GodAugment$/.test(api)
  return { godKey, isPrimary }
}

export function formatGodName(godKey) {
  return String(godKey)
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .trim()
}

export function shouldIncludeGodBoon(item, setNumber) {
  if (!isGodBoon(item)) return false
  const api = item.apiName || ""
  const icon = item.icon || ""
  if (BANNED_AUGMENT_RE.test(api)) return false
  if (/ChoiceUI/i.test(icon)) return false
  if (!/Augments\/Hexcore/i.test(icon)) return false
  if (!isValidAugmentDisplayName(item.name)) return false
  if (referencesOlderSet(api, setNumber) && !referencesSet(api, setNumber)) {
    return false
  }
  if (referencesOlderSet(icon, setNumber) && !referencesSet(icon, setNumber)) {
    return false
  }
  const prefix = `${setPrefix(setNumber)}Augment_`
  return api.startsWith(prefix) && (referencesSet(api, setNumber) || referencesSet(icon, setNumber))
}

export function shouldIncludeAugment(item, setNumber) {
  if (isGodBoon(item)) return false
  if (!isAugmentItem(item)) return false
  const api = item.apiName || ""
  const icon = item.icon || ""
  if (BANNED_AUGMENT_RE.test(api)) return false
  if (/ChoiceUI/i.test(icon)) return false
  if (!/Augments\/Hexcore/i.test(icon)) return false
  if (!isValidAugmentDisplayName(item.name)) return false
  if (MARKET_OFFERING_SKIP_RE.test(api)) return false
  if (/^TFT\d+_Favored(Cause|Effect)/i.test(api)) return false

  if (referencesOlderSet(api, setNumber) && !referencesSet(api, setNumber)) {
    return false
  }
  if (referencesOlderSet(icon, setNumber) && !referencesSet(icon, setNumber)) {
    return false
  }

  const augmentApiPrefix = `${setPrefix(setNumber)}Augment_`
  if (api.startsWith(augmentApiPrefix)) {
    return referencesSet(api, setNumber) || referencesSet(icon, setNumber)
  }

  if (api.startsWith("TFT_Augment_") && referencesSet(icon, setNumber)) {
    return true
  }

  if (api.startsWith(`${setPrefix(setNumber)}MarketOffering_Augment_`)) {
    return true
  }

  return false
}

export function resolveSetItemApis(enUs, setNumber) {
  const apis = new Set()
  const blocks = Array.isArray(enUs.setData) ? enUs.setData : []
  const block =
    blocks.find((b) => b.number === setNumber) ?? blocks[blocks.length - 1]
  for (const api of block?.items || []) {
    if (typeof api === "string" && api.length > 0) apis.add(api)
  }
  return apis
}

function normalizeApiNameList(raw) {
  if (Array.isArray(raw)) {
    return raw.filter((x) => typeof x === "string" && x.length > 0)
  }
  if (raw && typeof raw === "object") {
    return Object.values(raw).filter((x) => typeof x === "string" && x.length > 0)
  }
  return []
}

/** Set-scoped augment pool from `setData[].augments` (same source as runtime CDN). */
export function resolveSetAugmentApis(enUs, setNumber) {
  const blocks = Array.isArray(enUs.setData) ? enUs.setData : []
  const block =
    blocks.find((b) => b.number === setNumber) ?? blocks[blocks.length - 1]
  return normalizeApiNameList(block?.augments)
}

function buildItemsByApi(enUs) {
  const m = new Map()
  for (const item of enUs.items || []) {
    if (item?.apiName) m.set(item.apiName, item)
  }
  return m
}

export function parseItems(enUs, setNumber, setItemApis = resolveSetItemApis(enUs, setNumber)) {
  const items = enUs.items || []
  const components = []
  const finished = []
  const radiants = []
  const artifacts = []
  const seen = new Set()

  const push = (bucket, item) => {
    const api = item.apiName
    if (!api || seen.has(api)) return
    seen.add(api)
    bucket.push(
      baseRecord({
        apiName: api,
        name: item.name,
        description: item.desc,
        iconPath: item.icon,
      }),
    )
    const rec = bucket[bucket.length - 1]
    rec.description = item.desc || ""
    rec.effects = item.effects || {}
    rec.composition = item.composition || []
    rec.from = item.from || null
    rec.tags = item.tags || []
    rec.unique = Boolean(item.unique)
    rec.associatedTraits = item.associatedTraits || []
  }

  for (const item of items) {
    if (isAugmentItem(item)) continue

    if (isComponentItem(item) && item.apiName?.startsWith("TFT_Item_")) {
      push(components, item)
      continue
    }
    if (isRadiantItem(item, setNumber, setItemApis)) {
      push(radiants, item)
      continue
    }
    if (isArtifactItem(item, setNumber)) {
      push(artifacts, item)
      continue
    }
    if (isStandardCraftedItem(item)) {
      push(finished, item)
    }
  }

  const sortByName = (a, b) => a.name.localeCompare(b.name)
  components.sort(sortByName)
  finished.sort(sortByName)
  radiants.sort(sortByName)
  artifacts.sort(sortByName)

  return { components, finished, radiants, artifacts }
}

export function parseGodBoons(enUs, setNumber) {
  const boons = []
  for (const item of enUs.items || []) {
    if (!shouldIncludeGodBoon(item, setNumber)) continue
    const { godKey, isPrimary } = godBoonMeta(item)
    boons.push({
      ...baseRecord({
        apiName: item.apiName,
        name: item.name,
        description: item.desc,
        iconPath: item.icon,
      }),
      tier: augmentTier(item),
      godKey,
      godName: formatGodName(godKey),
      isPrimary,
      associatedTraits: item.associatedTraits || [],
      effects: item.effects || {},
    })
  }
  boons.sort(
    (a, b) =>
      a.godName.localeCompare(b.godName) ||
      Number(b.isPrimary) - Number(a.isPrimary) ||
      a.name.localeCompare(b.name),
  )
  return boons
}

function pushAugmentRecord(augments, item) {
  const rawDescription = stripHtmlKeepPlaceholders(item.desc)
  augments.push({
    ...baseRecord({
      apiName: item.apiName,
      name: item.name,
      description: item.desc,
      iconPath: item.icon,
    }),
    rawDescription,
    tier: augmentTier(item),
    associatedTraits: item.associatedTraits || [],
    effects: item.effects || {},
  })
}

export function parseAugments(enUs, setNumber) {
  const augments = []
  const itemsByApi = buildItemsByApi(enUs)
  const poolApis = resolveSetAugmentApis(enUs, setNumber)
  const prefix = setPrefix(setNumber)

  if (poolApis.length > 0) {
    for (const apiName of poolApis) {
      const item = itemsByApi.get(apiName)
      if (!item) continue
      if (!item.apiName?.startsWith(`${prefix}Augment_`) && !item.apiName?.startsWith("TFT_Augment_")) {
        continue
      }
      if (!shouldIncludeAugment(item, setNumber)) continue
      pushAugmentRecord(augments, item)
    }
  } else {
    for (const item of enUs.items || []) {
      if (!shouldIncludeAugment(item, setNumber)) continue
      pushAugmentRecord(augments, item)
    }
  }

  augments.sort((a, b) => a.name.localeCompare(b.name))
  return augments
}

export function parseEnUsBundle(enUs, setNumber) {
  const setItemApis = resolveSetItemApis(enUs, setNumber)
  const items = parseItems(enUs, setNumber, setItemApis)
  return {
    meta: {
      setNumber,
      setPrefix: setPrefix(setNumber),
      setCoreName: setCoreName(setNumber),
      locale: "en_us",
    },
    units: parseUnits(enUs, setNumber),
    traits: parseTraits(enUs, setNumber),
    items,
    augments: parseAugments(enUs, setNumber),
    godBoons: parseGodBoons(enUs, setNumber),
  }
}
