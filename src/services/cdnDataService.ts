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

const CD_DRAGON_TFT_BASE = "https://raw.communitydragon.org/latest/cdragon/tft"

const DB_NAME = "tft-ally-cache"
const STORE_NAME = "set-data"
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000
/** Bump when cached payload shape / decoding logic changes (forces miss on first read). */
const CACHE_KEY = "current-set-v6"

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

function flattenEffectMap(effects: unknown): Record<string, number | string> {
  const out: Record<string, number | string> = {}
  if (!effects || typeof effects !== "object" || Array.isArray(effects)) return out
  for (const [k, v] of Object.entries(effects as Record<string, unknown>)) {
    if (typeof v === "number" || typeof v === "string") out[k] = v
    else if (typeof v === "boolean") out[k] = v ? "1" : "0"
    else if (Array.isArray(v)) {
      const nums = v.filter((x): x is number => typeof x === "number")
      if (nums.length === v.length && nums.length > 0) {
        out[k] = nums
          .map((n) => {
            if (n > 0 && n <= 1 && /percent|pct|ratio|bonus|increase|as|ad|ap|health|damage|shield|mana|crit|speed|resist|armor|mr|hp/i.test(k)) {
              return `${Math.round(n * 100)}%`
            }
            return String(n)
          })
          .join(" / ")
      } else {
        const parts = v.filter((x) => x != null).map(String)
        if (parts.length) out[k] = parts.join(" / ")
      }
    }
  }
  return out
}

function formatEffectDisplayValue(key: string, v: number | string): string {
  if (typeof v === "string") return v
  const k = key.toLowerCase()
  if ((k.includes("percent") || k.includes("pct") || k.endsWith("ratio") || k.includes("increase")) && v > 0 && v <= 1) {
    return `${Math.round(v * 100)}%`
  }
  return String(v)
}

function lookupEffectValue(map: Record<string, number | string>, key: string): number | string | undefined {
  const tryKeys = [key, key.replace(/_TOOLTIPONLY$/i, ""), key.replace(/_TOOLTIP$/i, "")]
  for (const tk of tryKeys) {
    if (Object.prototype.hasOwnProperty.call(map, tk)) return map[tk]
  }
  const lower = key.toLowerCase()
  for (const [mk, mv] of Object.entries(map)) {
    if (mk.toLowerCase() === lower) return mv
    const mShort = mk.toLowerCase().replace(/_tooltiponly$/i, "")
    const kShort = lower.replace(/_tooltiponly$/i, "")
    if (mShort === kShort) return mv
  }
  if (key.length >= 3) {
    for (const [mk, mv] of Object.entries(map)) {
      const ml = mk.toLowerCase()
      if (ml.length < 3) continue
      if (lower.endsWith(ml) || ml.endsWith(lower)) return mv
    }
  }
  return undefined
}

function effectKeyCandidates(base: string): string[] {
  const seen = new Set<string>()
  const add = (s: string) => {
    const t = s.trim()
    if (t.length > 0) seen.add(t)
  }
  add(base)
  for (const p of ["Modified", "Total", "Bonus", "Max", "Min", "TFT"]) {
    if (base.startsWith(p)) add(base.slice(p.length))
  }
  return [...seen]
}

/** e.g. AD*100 with value 0.35 → "35%" when mult is 100 and value looks like a ratio */
function formatScaledStat(key: string, value: number, multiplyBy: number): string {
  const scaled = value * multiplyBy
  const k = key.toLowerCase()
  const ratioLike =
    multiplyBy === 100 &&
    Math.abs(value) <= 2.5 &&
    /percent|pct|ratio|bonus|increase|damage|speed|as|ad|ap|health|shield|mana|crit|resist|armor|mr|hp|heal|pen|vamp|lifesteal|duration|chance/i.test(
      k,
    )
  if (ratioLike) return `${Math.round(scaled)}%`
  if (Number.isInteger(scaled)) return String(scaled)
  return String(Math.round(scaled * 100) / 100)
}

/** Resolve @inner@ using Riot-style formulas (AD*100) and effect maps */
function resolveAtPlaceholder(inner: string, map: Record<string, number | string>): string {
  const trimmed = inner.trim()
  if (!trimmed) return ""

  if (/^TFTUnitProperty\./i.test(trimmed) || (/^TFT[A-Za-z]+_[A-Za-z0-9_.]+$/i.test(trimmed) && trimmed.length > 48)) {
    return ""
  }

  const mulMatch = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*\*\s*([0-9.]+)$/)
  if (mulMatch) {
    const mult = Number(mulMatch[2])
    if (Number.isFinite(mult)) {
      for (const base of effectKeyCandidates(mulMatch[1])) {
        const v = lookupEffectValue(map, base)
        if (typeof v === "number") return formatScaledStat(base, v, mult)
        if (typeof v === "string") return v
      }
    }
  }

  for (const cand of effectKeyCandidates(trimmed)) {
    if (/^[A-Za-z0-9_]+$/.test(cand)) {
      const v = lookupEffectValue(map, cand)
      if (v !== undefined) return typeof v === "string" ? v : formatEffectDisplayValue(cand, v)
    }
  }

  return ""
}

/** Strip HTML then substitute `@EffectKey@` from Riot `effects` objects (cdragon tft items/augments). */
export function formatTftText(raw: string | undefined | null, effects: unknown): string {
  let s = String(raw || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/%i:[A-Za-z0-9_]+%/gi, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/\*\*/g, "")
  const map = flattenEffectMap(effects)
  s = s.replace(/@([^@]+)@/g, (_, inner: string) => resolveAtPlaceholder(inner, map))
  // Strip unresolved @...@ (still unknown after formula / key resolution)
  s = s.replace(/@[^@]*@/g, "")
  s = s.replace(/@[^%\n]+%/g, "")
  s = s.replace(/\s*\+\s*%+\s*/g, " ")
  return s.replace(/\s+/g, " ").trim()
}

function traitVariableMap(tr: CDragonTrait): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const e of tr.effects || []) {
    const v = e.variables
    if (v && typeof v === "object" && !Array.isArray(v)) Object.assign(out, v)
  }
  return out
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
  const v0 = vars[0] as { value?: unknown }
  const val = v0?.value
  if (Array.isArray(val)) return val.map(String).join("/")
  if (val != null) return String(val)
  return ""
}

interface CDragonChampion {
  apiName?: string
  name?: string
  characterName?: string
  cost?: number
  traits?: string[]
  ability?: { name?: string; desc?: string; variables?: unknown[] }
}

interface CDragonTrait {
  apiName?: string
  name?: string
  desc?: string
  icon?: string
  effects?: Array<{ minUnits?: number; maxUnits?: number; style?: number; variables?: Record<string, unknown> }>
}

interface CDragonItemRow {
  apiName?: string
  name?: string
  desc?: string
  /** Some CDN rows use `description` instead of `desc`. */
  description?: string
  effect?: string
  icon?: string
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

function cleanDescription(desc: string, fallback = ""): string {
  if (!desc || !desc.trim()) return fallback

  let s = desc
    // Remove ALL @...@ template variables (any content between @ symbols)
    .replace(/@[^@]*@/g, "")
    // @Formula% when there is no closing @ (e.g. +@AD*100@% Attack Damage)
    .replace(/@[^%\n]+%/g, "")
    // Remove {{TFT_Keyword_*}} and any {{...}} tokens
    .replace(/\{\{[^}]+\}\}/g, "")
    // Leftover "+ @ ... %" fragments become "+%" — drop those runs
    .replace(/\s*\+\s*%+\s*/g, " ")
    // Remove threshold pattern artifacts like "() " or "( ) "
    .replace(/\(\s*\)\s*/g, "")
    // Remove "Recommended Roles: ..." lines entirely
    .replace(/Recommended Roles:[^\n.]*/gi, "")
    // Remove lines that are ONLY a number (leftover substitution blanks)
    .replace(/^\s*\d+\.?\d*\s*$/gm, "")
    // Remove HTML tags if any slip through
    .replace(/<[^>]+>/g, "")
    // Clean up multiple spaces
    .replace(/\s{2,}/g, " ")
    // Clean up spaces before punctuation
    .replace(/\s+([.,;%])/g, "$1")
    // Clean up doubled periods
    .replace(/\.{2,}/g, ".")
    // Clean up lines starting with just punctuation
    .replace(/^\s*[.,;:]\s*/gm, "")
    // Remove empty parentheses
    .replace(/\(\s*\)/g, "")
    // Final trim
    .trim()

  const result = s
  return result.length > 0 ? result : fallback
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

function abilityVariablesAsEffects(champ: CDragonChampion): Record<string, unknown> {
  const vars = champ.ability?.variables
  if (!Array.isArray(vars)) return {}
  const flat: Record<string, unknown> = {}
  for (const row of vars) {
    if (!row || typeof row !== "object") continue
    const r = row as { name?: string; value?: unknown }
    if (typeof r.name === "string" && r.name.length > 0) flat[r.name] = r.value
  }
  return flat
}

export function transformChampions(setBlock: CDragonSetBlock): Unit[] {
  const raw = setBlock.champions
  const arr: CDragonChampion[] = Array.isArray(raw)
    ? (raw as CDragonChampion[])
    : Object.values((raw as Record<string, CDragonChampion>) || {})

  const out: Unit[] = []
  for (const champ of arr) {
    if (!champ || typeof champ !== "object") continue
    const api = champ.apiName || ""
    if (typeof api === "string" && api.length > 0 && !/^TFT17_/i.test(api)) continue
    if (/dummy|practice|bluegolem|shop|carousel/i.test(api)) continue
    const name = champ.name || champ.characterName || "Unknown"
    const abilityName = champ.ability?.name ?? "Ability"
    const traits = Array.isArray(champ.traits) ? champ.traits : []
    const dmg = abilityDamagePreview(champ)
    out.push({
      id: `u_${api.replace(/^TFT17_/i, "").toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
      name,
      cost: clampCost(champ.cost ?? 1),
      traits,
      ability: {
        name: abilityName,
        description: cleanDescription(
          formatTftText(champ.ability?.desc ?? "", abilityVariablesAsEffects(champ)),
          `${name} — ${abilityName}`,
        ),
        damage: dmg || "—",
      },
      stats: { hp: 0, ad: 0, ap: 0, armor: 0, mr: 0, atkSpeed: 0, range: 1 },
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
        effect: "Tier bonus (see trait description)",
      }))

    if (thresholds.length === 0) {
      thresholds.push({ count: 1, effect: "Innate (see description)" })
    }

    const iconUrl = cdGameAssetUrl(tr.icon)
    const varMap = traitVariableMap(tr)
    const traitFallback = `${tr.name} trait bonus`
    out.push({
      id: synId(tr.name),
      name: tr.name,
      description: cleanDescription(formatTftText(tr.desc || tr.name, varMap), traitFallback),
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

export function transformItems(setItemApis: string[], itemsByApi: Map<string, CDragonItemRow>): ItemGuideEntry[] {
  const seen = new Set<string>()
  const out: ItemGuideEntry[] = []
  for (const api of setItemApis) {
    const row = itemsByApi.get(api)
    if (!row?.name) continue
    if (!isGuideItemRow(row)) continue
    const displayName = formatTftText(row.name, row.effects)
    const description = cleanDescription(
      formatTftText(row.desc || row.description || "", row.effects),
      displayName,
    )
    const effect = cleanDescription(formatTftText(row.effect || "", row.effects), displayName)
    if (!displayName || /@/.test(displayName)) continue
    if (seen.has(displayName)) continue
    seen.add(displayName)
    const iconUrl = cdGameAssetUrl(row.icon)
    out.push({
      name: displayName,
      category: "core",
      stats: "",
      effect: effect || description || displayName,
      components: null,
      tags: [],
      tier: "B",
      bestOn: [],
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
    const rawNameForTier = formatTftText(row.name || "", row.effects) || humanizeAugmentApiName(apiName)
    const augmentTier = inferAugmentTier(apiName, rawNameForTier)
    const augmentFallback = `${augmentTier} augment`
    const description = cleanDescription(
      formatTftText(row.desc || row.name || "", row.effects),
      augmentFallback,
    )
    let name = cleanDescription(formatTftText(row.name || "", row.effects), augmentFallback)
    if (!name || /@/.test(name)) name = cleanDescription(formatTftText(row.desc || "", row.effects), augmentFallback)
    if (!name || /@/.test(name)) name = humanizeAugmentApiName(apiName)
    const effect = (description || name).slice(0, 160) || "—"
    const iconUrl = cdGameAssetUrl(row.icon)
    out.push({
      id,
      name,
      tier: augmentTier,
      description: description || name,
      effect,
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
