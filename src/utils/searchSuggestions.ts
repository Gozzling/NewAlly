import { listCanonicalAugments } from '@/lib/augmentResolver'
import { toSearchAugment } from '@/lib/augmentProjections'
import { useAppStore } from '@/store/useAppStore'
import { getFallbackSetData } from '@/services/cdnDataService'
import {
  ITEM_RECIPES,
  EMBLEM_RECIPES,
  ALL_COMPONENTS,
  PSIONIC_ITEMS,
} from '@/data/items'
import { EXAMPLE_SUMMONERS } from '@/data/exampleSummoners'
import type { RiotRegion } from '@/types/riot'

export type SearchSuggestionKind = 'unit' | 'item' | 'trait' | 'augment' | 'summoner'

export interface SearchSuggestion {
  kind: SearchSuggestionKind
  id: string
  label: string
  group?: string
  groupIcon?: string
  /** Region for summoner lookups (e.g. recent Match History searches). */
  region?: RiotRegion
}

export function normalizeSearchText(s: string): string {
  return s
    .toLowerCase()
    .replace(/'/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Folds punctuation/spacing so "nova" matches "N.O.V.A." and trait searches work. */
export function matchKey(s: string): string {
  return normalizeSearchText(s).replace(/[^a-z0-9]/g, '')
}

export function labelMatchesQuery(label: string, query: string): boolean {
  const n = normalizeSearchText(query)
  const nk = matchKey(query)
  if (n.length < 2 && nk.length < 2) return false
  const sn = normalizeSearchText(label)
  const sk = matchKey(label)
  return sn.includes(n) || (nk.length >= 2 && sk.includes(nk))
}

let corpusCache: SearchSuggestion[] | null = null

export function invalidateSearchCorpus(): void {
  corpusCache = null
}

function buildCorpus(): SearchSuggestion[] {
  const { gameData } = useAppStore.getState()
  const seed = getFallbackSetData()
  const champions = gameData.champions.length > 0 ? gameData.champions : seed.champions
  const traits = gameData.traits.length > 0 ? gameData.traits : seed.traits
  const guideItems = gameData.items.length > 0 ? gameData.items : seed.items

  const out: SearchSuggestion[] = []
  const seen = new Set<string>()

  const traitToType = new Map<string, string>()
  for (const s of traits) {
    traitToType.set(s.name, s.type)
  }

  const addItem = (label: string) => {
    const key = `item:${label}`
    if (seen.has(key)) return
    seen.add(key)

    const guide = guideItems.find((e) => e.name === label)
    let group = 'Items'
    let groupIcon = '📦'

    if (guide) {
      const tags = guide.tags.map((t) => t.toLowerCase())
      if (tags.some((t) => ['tank', 'defense', 'hp', 'armor', 'mr'].includes(t))) {
        group = 'Tank Items'
        groupIcon = '🛡️'
      } else if (tags.some((t) => ['ap', 'mana'].includes(t))) {
        group = 'AP Items'
        groupIcon = '🔮'
      } else if (tags.some((t) => ['offense', 'crit', 'as', 'shred', 'ad'].includes(t))) {
        group = 'AD Items'
        groupIcon = '⚔️'
      }
    }

    out.push({ kind: 'item', id: label, label, group, groupIcon })
  }

  for (const [crafted, pair] of Object.entries(ITEM_RECIPES)) {
    addItem(crafted)
    for (const c of pair) addItem(c)
  }
  for (const [crafted, pair] of Object.entries(EMBLEM_RECIPES)) {
    addItem(crafted)
    for (const c of pair) addItem(c)
  }
  for (const c of ALL_COMPONENTS) addItem(c)
  for (const p of PSIONIC_ITEMS) addItem(p.name)
  for (const e of guideItems) addItem(e.name)

  for (const u of champions) {
    let group = 'Units'
    let groupIcon = '👤'

    const unitTraitTypes = u.traits.map((t) => traitToType.get(t)).filter(Boolean)

    if (unitTraitTypes.includes('defense')) {
      group = 'Tanks'
      groupIcon = '🛡️'
    } else if (unitTraitTypes.includes('offense')) {
      // Heuristic: if they have AP scaling in ability, call them AP Carry, else AD
      const isAP =
        u.ability.damage.toLowerCase().includes('ap') ||
        u.stats.ap > u.stats.ad ||
        u.bestItems.some((i) =>
          ['Rabadon', 'Jeweled', 'Blue Buff', 'Spear of Shojin', 'Archangel'].some((m) =>
            i.includes(m),
          ),
        )
      if (isAP) {
        group = 'AP Carries'
        groupIcon = '🔮'
      } else {
        group = 'AD Carries'
        groupIcon = '⚔️'
      }
    } else if (unitTraitTypes.includes('utility')) {
      group = 'Utility Units'
      groupIcon = '🔮'
    }

    out.push({ kind: 'unit', id: u.id, label: u.name, group, groupIcon })
  }

  for (const s of traits) {
    let group = 'Traits'
    let groupIcon = '🌟'
    if (s.type === 'defense') {
      group = 'Defensive Traits'
      groupIcon = '🛡️'
    } else if (s.type === 'offense') {
      group = 'Offensive Traits'
      groupIcon = '⚔️'
    } else if (s.type === 'utility') {
      group = 'Utility Traits'
      groupIcon = '🔮'
    }

    out.push({ kind: 'trait', id: s.id, label: s.name, group, groupIcon })
  }

  for (const a of listCanonicalAugments().map(toSearchAugment)) {
    out.push({
      kind: 'augment',
      id: a.apiName,
      label: a.label,
      group: 'Augments',
      groupIcon: '🌀',
    })
  }

  for (const name of EXAMPLE_SUMMONERS) {
    out.push({
      kind: 'summoner',
      id: name,
      label: name,
      group: 'Summoners',
      groupIcon: '🔍',
    })
  }

  return out
}

export function getSearchCorpus(): SearchSuggestion[] {
  if (!corpusCache) corpusCache = buildCorpus()
  return corpusCache
}

export function filterSearchSuggestions(
  query: string,
  kinds: SearchSuggestionKind[] | 'all',
  limit = 8,
): SearchSuggestion[] {
  const n = normalizeSearchText(query)
  const nk = matchKey(query)
  if (n.length < 2 && nk.length < 2) return []

  let list = getSearchCorpus()
  if (kinds !== 'all') {
    const allow = new Set(kinds)
    list = list.filter((s) => allow.has(s.kind))
  }

  const scored: { s: SearchSuggestion; score: number }[] = []
  for (const s of list) {
    const sn = normalizeSearchText(s.label)
    const sk = matchKey(s.label)
    let idx = sn.indexOf(n)
    let score = 0
    if (idx !== -1) {
      score = (idx === 0 ? 1000 : 0) - idx
    } else if (nk.length >= 2) {
      const j = sk.indexOf(nk)
      if (j === -1) continue
      score = (j === 0 ? 800 : 0) - j
    } else {
      continue
    }
    scored.push({ s, score })
  }
  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, limit).map((x) => x.s)
}

const KIND_LABEL: Record<SearchSuggestionKind, string> = {
  unit: 'Unit',
  item: 'Item',
  trait: 'Trait',
  augment: 'Augment',
  summoner: 'Summoner',
}

export function suggestionKindLabel(kind: SearchSuggestionKind): string {
  return KIND_LABEL[kind]
}
