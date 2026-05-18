/**
 * Fetches Community Dragon bundled TFT JSON (`cdragon/tft/en_us.json`), maps it to Ally reference
 * types, and caches the result in IndexedDB for 24h.
 */
import { UNITS, type Unit } from "@/data/units"
import { SYNERGIES, type Synergy } from "@/data/synergies"
import { AUGMENTS, type Augment } from "@/data/augments"
import { ITEM_GUIDE_ENTRIES, type ItemGuideEntry } from "@/data/itemGuideCatalog"
import { CURRENT_TFT_SET_NUMBER } from "@/meta/tftCurrentSet"
import { cdGameAssetUrl } from "@/utils/cdnIcons"
import { formatTftText, roundTftWhole } from "@/utils/formatTftText"
import { buildItemStatsFromEffects } from "@/utils/itemStatsFromEffects"

export { formatTftText } from "@/utils/formatTftText"

const CD_DRAGON_TFT_BASE = "https://raw.communitydragon.org/latest/cdragon/tft"

const DB_NAME = "tft-ally-cache"
const STORE_NAME = "set-data"
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000
/** Bump when cached payload shape / decoding logic changes (forces miss on first read). */
const CACHE_KEY = "current-set-v11"

export type Item = ItemGuideEntry

export interface TFTSetData {
  setNumber: number
  champions: Unit[]
  traits: Synergy[]
  items: Item[]
  augments: Augment[]
}

export interface CachedSetData {
  data: TFTSetData
  fetchedAt: number
  setVersion: string
}

function traitVariableMap(tr: CDragonTrait): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const e of tr.effects || []) {
    const v = e.variables
    if (v && typeof v === "object" && !Array.isArray(v)) Object.assign(out, v)
  }
  return out
}

/** Human-readable summary from Riot per-threshold `variables` (matches style in bundled Bastion-style rows). */
function formatTraitThresholdVariables(vars: Record<string, unknown> | undefined): string {
  if (!vars || typeof vars !== "object" || Array.isArray(vars)) return ""
  const skip = new Set(["MinUnits", "MaxUnits"])
  const parts: string[] = []
  for (const [rawKey, rawVal] of Object.entries(vars)) {
    if (skip.has(rawKey)) continue
    if (rawVal === null || rawVal === undefined) continue
    if (typeof rawVal === "number") {
      const lk = rawKey.toLowerCase()
      const maybeRatio = rawVal > 0 && rawVal <= 1 && !lk.includes("duration") && !lk.includes("count")
      const wantsPercent =
        maybeRatio &&
        (lk.includes("percent") ||
          lk.includes("pct") ||
          lk.includes("ratio") ||
          lk.includes("multiplier") ||
          lk.includes("bonus") ||
          lk.includes("dr") ||
          lk.includes("resist") ||
          lk.includes("vamp") ||
          lk.includes("crit") ||
          lk.includes("speed") ||
          lk.includes("heal"))
      let display: string
      if (wantsPercent) display = `${roundTftWhole(rawVal * 100)}%`
      else display = String(roundTftWhole(rawVal))
      parts.push(`${rawKey}: ${display}`)
    } else if (typeof rawVal === "boolean") {
      parts.push(`${rawKey}: ${rawVal ? "yes" : "no"}`)
    } else if (typeof rawVal === "string" && rawVal.trim()) {
      parts.push(`${rawKey}: ${rawVal.trim()}`)
    } else if (Array.isArray(rawVal) && rawVal.length > 0 && rawVal.every((x) => typeof x === "number")) {
      parts.push(`${rawKey}: ${rawVal.map((x) => roundTftWhole(x)).join("/")}`)
    }
  }
  return parts.join(" · ")
}

function thresholdEffectLine(tr: CDragonTrait, e: CDragonTraitEffect): string {
  const min = typeof e.minUnits === "number" ? e.minUnits : 0
  const varMap = traitVariableMap(tr)
  const tierVars =
    e.variables && typeof e.variables === "object" && !Array.isArray(e.variables)
      ? (e.variables as Record<string, unknown>)
      : {}
  const merged = { ...varMap, ...tierVars }

  if (typeof e.description === "string" && e.description.trim()) {
    const line = formatTftText(e.description, merged).trim()
    if (line.length > 0) return line
  }

  const fromNumbers = formatTraitThresholdVariables(e.variables)
  if (fromNumbers.length > 0) return fromNumbers

  if (tr.desc) {
    const globalParsed = formatTftText(tr.desc, varMap).trim()
    const mergedParsed = formatTftText(tr.desc, merged).trim()
    if (mergedParsed.length > 0 && mergedParsed !== globalParsed) return mergedParsed
  }

  if (min > 0) {
    if (min === 1) return "Innate — details in the trait description above."
    return `${min}+ units: unlock the next tier of this trait (details in the description above).`
  }
  return "See trait description above."
}

function normalizeStringList(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.filter((x): x is string => typeof x === "string")
  if (raw && typeof raw === "object")
    return Object.values(raw as Record<string, unknown>).filter((x): x is string => typeof x === "string")
  return []
}

function synId(name: string): string {
  return (
    "syn_" +
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "")
  )
}

function clampCost(n: number): 1 | 2 | 3 | 4 | 5 {
  const c = Number.isFinite(n) ? Math.round(n) : 1
  return (Math.min(5, Math.max(1, c)) || 1) as 1 | 2 | 3 | 4 | 5
}

function abilityDamagePreview(champ: CDragonChampion): string {
  const vars = champ.ability?.variables
  if (!Array.isArray(vars) || vars.length === 0) return ""

  // Try to find a variable that looks like primary damage/scaling
  const dmgVar = vars.find(v => {
    const name = (v as any)?.name?.toLowerCase() || ""
    return name.includes("damage") || name.includes("healing") || name.includes("shield") || name.includes("value")
  }) || vars[0]

  const val = (dmgVar as any)?.value
  if (Array.isArray(val)) {
    const filtered = val.filter((v) => v !== 0)
    const src = filtered.length > 0 ? filtered : val
    return src.map((x: number) => roundTftWhole(Number(x))).join("/")
  }
  if (typeof val === "number" && Number.isFinite(val)) return String(roundTftWhole(val))
  if (val != null) return String(val)
  return ""
}

function champVariableMap(champ: CDragonChampion): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  const vars = champ.ability?.variables
  if (Array.isArray(vars)) {
    for (const v of vars) {
      if (v && typeof v === "object") {
        const name = (v as any).name
        const val = (v as any).value
        if (typeof name === "string") out[name] = val
      }
    }
  }
  return out
}

interface CDragonChampion {
  apiName?: string
  name?: string
  characterName?: string
  cost?: number
  traits?: string[]
  ability?: { name?: string; desc?: string; variables?: unknown[] }
  stats?: {
    hp?: number
    attackDamage?: number
    armor?: number
    magicResist?: number
    attackSpeed?: number
    range?: number
  }
}

interface CDragonTraitEffect {
  minUnits?: number
  maxUnits?: number
  style?: number
  variables?: Record<string, unknown>
  /** Some CD rows include a per-threshold blurb. */
  description?: string
}

interface CDragonTrait {
  apiName?: string
  name?: string
  desc?: string
  icon?: string
  effects?: CDragonTraitEffect[]
}

interface CDragonItemRow {
  apiName?: string
  name?: string
  desc?: string
  icon?: string
  tags?: unknown[]
  associatedTraits?: string[]
  composition?: unknown[]
  effects?: Record<string, unknown>
}

interface CDragonSetBlock {
  number?: number
  name?: string
  champions?: unknown
  traits?: unknown
  items?: unknown
  augments?: unknown
}

interface CDragonBundle {
  items?: CDragonItemRow[]
  setData?: CDragonSetBlock[]
}

function isAugmentRow(row: CDragonItemRow): boolean {
  return /\/Augments\//i.test(String(row.icon || ""))
}

function isJunkItemApi(api: string): boolean {
  return (
    /ChampionItem|MarketOffering|CypherArmory|Consumable_|ThiefsGloves|_Chosen_|Carousel|Orbs|GoldGroup|Salvager|SizeUp|SpeedUp|ArmoryItem/i.test(
      api,
    ) || /^TFT1[14]_/i.test(api) || /^TFT16_Consumable_/i.test(api)
  )
}

/** Finished components / set items — not augments, not shop champions, not PVE armory rows. */
function isGuideItemRow(row: CDragonItemRow): boolean {
  if (isAugmentRow(row)) return false
  const icon = String(row.icon || "")
  if (!/\/Maps\/TFT\/Icons\/Items\//i.test(icon)) return false
  const api = String(row.apiName || "")
  if (isJunkItemApi(api)) return false
  if (/^\d+-cost:/i.test(String(row.name || ""))) return false
  return true
}

function humanizeAugmentApiName(api: string): string {
  const core = api.replace(/^TFT\d+_Augment_/i, "").replace(/_II$|_I$|_III$/i, "")
  if (!core) return "Augment"
  return core
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim()
}

function inferAugmentTier(apiName: string, displayName: string): Augment["tier"] {
  const s = `${apiName} ${displayName}`.toLowerCase()
  if (/prismatic|godaugment|\biii\b|portal/i.test(s)) return "prismatic"
  if (/silver/i.test(s)) return "silver"
  return "gold"
}

function pickSetBlock(raw: CDragonBundle, setNumber: number): CDragonSetBlock | undefined {
  const blocks = Array.isArray(raw.setData) ? raw.setData : []
  return blocks.find((b) => b.number === setNumber) ?? blocks[blocks.length - 1]
}

function buildItemsByApi(rows: CDragonItemRow[] | undefined): Map<string, CDragonItemRow> {
  const m = new Map<string, CDragonItemRow>()
  if (!Array.isArray(rows)) return m
  for (const row of rows) {
    const api = row.apiName
    if (typeof api === "string" && api.length > 0) m.set(api, row)
  }
  return m
}

export function transformChampions(setBlock: CDragonSetBlock): Unit[] {
  const raw = setBlock.champions
  const arr: CDragonChampion[] = Array.isArray(raw)
    ? (raw as CDragonChampion[])
    : Object.values((raw as Record<string, CDragonChampion>) || {})

  const setPrefix = `TFT${setBlock.number ?? CURRENT_TFT_SET_NUMBER}_`
  const out: Unit[] = []
  for (const champ of arr) {
    if (!champ || typeof champ !== "object") continue
    const api = champ.apiName || ""
    if (typeof api === "string" && api.length > 0 && !api.startsWith(setPrefix)) continue
    if (/dummy|practice|bluegolem|shop|carousel/i.test(api)) continue
    const name = champ.name || champ.characterName || "Unknown"
    const traits = Array.isArray(champ.traits) ? champ.traits : []
    const dmg = abilityDamagePreview(champ)
    const varMap = champVariableMap(champ)
    const s = champ.stats || {}

    out.push({
      id: `u_${api.replace(new RegExp(`^${setPrefix}`, 'i'), "").toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
      name,
      cost: clampCost(champ.cost ?? 1),
      traits,
      ability: {
        name: champ.ability?.name ?? "Ability",
        description: formatTftText(champ.ability?.desc ?? "", varMap),
        damage: dmg || "—",
      },
      stats: {
        hp: s.hp ?? 0,
        ad: s.attackDamage ?? 0,
        ap: 0,
        armor: s.armor ?? 0,
        mr: s.magicResist ?? 0,
        atkSpeed: s.attackSpeed ? Number(s.attackSpeed.toFixed(2)) : 0,
        range: s.range ?? 1
      },
      bestItems: [],
      bestComps: [],
      tier: "B",
    })
  }
  out.sort((a, b) => a.name.localeCompare(b.name))
  return out
}

export function transformTraits(setBlock: CDragonSetBlock): Synergy[] {
  const rawTraits = setBlock.traits
  const arr: CDragonTrait[] = Array.isArray(rawTraits)
    ? (rawTraits as CDragonTrait[])
    : Object.values((rawTraits as Record<string, CDragonTrait>) || {})

  const out: Synergy[] = []
  for (const tr of arr) {
    if (!tr?.name) continue
    const effects = Array.isArray(tr.effects) ? [...tr.effects] : []
    effects.sort((a, b) => (a.minUnits ?? 0) - (b.minUnits ?? 0))
    const thresholds = effects
      .filter((e) => typeof e.minUnits === "number" && e.minUnits > 0)
      .map((e) => ({
        count: e.minUnits as number,
        effect: thresholdEffectLine(tr, e),
      }))

    if (thresholds.length === 0) {
      thresholds.push({ count: 1, effect: thresholdEffectLine(tr, { minUnits: 1 }) })
    }

    const iconUrl = cdGameAssetUrl(tr.icon)
    const varMap = traitVariableMap(tr)
    const description = formatTftText(tr.desc || tr.name, varMap)

    out.push({
      id: synId(tr.name),
      name: tr.name,
      description,
      thresholds,
      bestUnits: [],
      bestComps: [],
      counters: [],
      type: "hybrid",
      ...(iconUrl ? { iconUrl } : {}),
    })
  }
  out.sort((a, b) => a.name.localeCompare(b.name))
  return out
}

function inferCdnItemCategory(row: CDragonItemRow): ItemGuideEntry["category"] {
  const api = String(row.apiName || "")
  const name = String(row.name || "")
  const blob = `${api}|${name}`
  if (/radiant/i.test(blob)) return "core"
  if (/^TFT\d+_Item_Artifact_/i.test(api) || /artifact/i.test(api)) return "artifact"
  if ((row.tags as string[] | undefined)?.some((t) => String(t).toLowerCase() === "component")) {
    return "core"
  }
  return "core"
}

function inferCdnItemTags(row: CDragonItemRow, category: ItemGuideEntry["category"]): string[] {
  const tags = new Set<string>()
  const api = String(row.apiName || "")
  const name = String(row.name || "")
  if (/radiant/i.test(`${api}|${name}`)) tags.add("radiant")
  if (category === "artifact") tags.add("artifact")
  for (const t of row.tags || []) {
    const s = String(t).toLowerCase()
    if (s.length > 2 && !s.startsWith("{")) tags.add(s)
  }
  return [...tags]
}

export function transformItems(setItemApis: string[], itemsByApi: Map<string, CDragonItemRow>): ItemGuideEntry[] {
  const seen = new Set<string>()
  const out: ItemGuideEntry[] = []
  for (const api of setItemApis) {
    const row = itemsByApi.get(api)
    if (!row?.name) continue
    if (!isGuideItemRow(row)) continue
    const displayName = formatTftText(row.name, row.effects)
    const effect = formatTftText(row.desc || "", row.effects)
    if (!displayName || /@/.test(displayName)) continue
    if (seen.has(displayName)) continue
    seen.add(displayName)
    const iconUrl = cdGameAssetUrl(row.icon)
    const category = inferCdnItemCategory(row)
    const curated = ITEM_GUIDE_ENTRIES.find((e) => e.name === displayName)

    out.push({
      name: displayName,
      category,
      stats:
        curated?.stats ||
        buildItemStatsFromEffects(row.effects as Record<string, number | undefined> | undefined),
      effect: curated?.effect || effect || displayName,
      components: null,
      tags: inferCdnItemTags(row, category),
      tier: curated?.tier ?? "B",
      bestOn: curated?.bestOn ?? [],
      ...(iconUrl ? { iconUrl } : {}),
    })
  }
  out.sort((a, b) => a.name.localeCompare(b.name))
  return out
}

export function transformAugments(augmentApiNames: string[], itemsByApi: Map<string, CDragonItemRow>): Augment[] {
  const out: Augment[] = []
  for (const apiName of augmentApiNames) {
    const row = itemsByApi.get(apiName)
    if (!row) continue
    if (!isAugmentRow(row)) continue
    const id = `aug_${apiName.replace(/[^a-zA-Z0-9]+/g, "_").toLowerCase()}`
    const description = formatTftText(row.desc || row.name || "", row.effects)
    let name = formatTftText(row.name || "", row.effects)
    if (!name || /@/.test(name)) name = formatTftText(row.desc || "", row.effects)
    if (!name || /@/.test(name)) name = humanizeAugmentApiName(apiName)
    const effect = (description || name).slice(0, 160)
    const iconUrl = cdGameAssetUrl(row.icon)
    out.push({
      id,
      name,
      tier: inferAugmentTier(apiName, name),
      description: description || name,
      effect: effect || "—",
      bestComps: [],
      pickRate: 0,
      winRate: 0,
      avgPlacement: 0,
      synergies: [],
      counters: [],
      tags: ["cdn"],
      ...(iconUrl ? { iconUrl } : {}),
    })
  }
  out.sort((a, b) => a.name.localeCompare(b.name))
  return out
}

export async function fetchLatestSetData(): Promise<TFTSetData> {
  const response = await fetch(`${CD_DRAGON_TFT_BASE}/en_us.json`)
  if (!response.ok) throw new Error(`CDN fetch failed: ${response.status}`)

  const raw = (await response.json()) as CDragonBundle
  const setNumber = CURRENT_TFT_SET_NUMBER
  const setBlock = pickSetBlock(raw, setNumber)
  if (!setBlock) throw new Error("CDN: no setData block")

  const itemsByApi = buildItemsByApi(raw.items)
  const setItemApis = normalizeStringList(setBlock.items)
  const augmentApis = normalizeStringList(setBlock.augments)

  return {
    setNumber: setBlock.number ?? setNumber,
    champions: transformChampions(setBlock),
    traits: transformTraits(setBlock),
    items: transformItems(setItemApis, itemsByApi),
    augments: transformAugments(augmentApis, itemsByApi),
  }
}

function isStale(cached: CachedSetData): boolean {
  return Date.now() - cached.fetchedAt > CACHE_DURATION_MS
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error ?? new Error("IndexedDB open failed"))
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
  })
}

export async function getCachedSetData(): Promise<CachedSetData | null> {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, "readonly")
    const cached = await new Promise<CachedSetData | undefined>((resolve, reject) => {
      const r = tx.objectStore(STORE_NAME).get(CACHE_KEY)
      r.onsuccess = () => resolve(r.result as CachedSetData | undefined)
      r.onerror = () => reject(r.error)
    })
    return cached ?? null
  } catch {
    return null
  }
}

export async function cacheSetData(data: TFTSetData): Promise<void> {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, "readwrite")
  const payload: CachedSetData = {
    data,
    fetchedAt: Date.now(),
    setVersion: `set${data.setNumber}`,
  }
  await new Promise<void>((resolve, reject) => {
    const r = tx.objectStore(STORE_NAME).put(payload, CACHE_KEY)
    r.onsuccess = () => resolve()
    r.onerror = () => reject(r.error)
  })
}

export const BUNDLED_SET_DATA: TFTSetData = {
  setNumber: CURRENT_TFT_SET_NUMBER,
  champions: UNITS,
  traits: SYNERGIES,
  items: ITEM_GUIDE_ENTRIES,
  augments: AUGMENTS,
}

export async function getSetData(): Promise<{ data: TFTSetData; source: "cdn" | "bundled" }> {
  try {
    const cached = await getCachedSetData()
    if (cached && !isStale(cached)) {
      return { data: cached.data, source: "cdn" }
    }
  } catch (e) {
    console.warn("CDN Cache read failed", e)
  }

  try {
    const fresh = await fetchLatestSetData()
    try {
      await cacheSetData(fresh)
    } catch {
      /* ignore cache write failures */
    }
    return { data: fresh, source: "cdn" }
  } catch (e) {
    console.error("CDN fetch failed, falling back to bundled data", e)
    return { data: BUNDLED_SET_DATA, source: "bundled" }
  }
}

export function preloadCommonIcons(champions: Unit[]) {
  if (typeof window === "undefined" || typeof Image === "undefined") return [];
  // Simple background preloader for common icons
  const images = champions.slice(0, 20).map((u) => {
    const img = new Image();
    img.src = u.iconUrl || "";
    return img;
  });
  return images;
}
