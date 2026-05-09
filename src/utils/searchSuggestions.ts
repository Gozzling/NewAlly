import { UNITS } from '@/data/units'
import { SYNERGIES } from '@/data/synergies'
import { AUGMENTS } from '@/data/augments'
import {
  ITEM_RECIPES,
  EMBLEM_RECIPES,
  ALL_COMPONENTS,
  PSIONIC_ITEMS,
} from '@/data/items'
import { ITEM_GUIDE_ENTRIES } from '@/data/itemGuideCatalog'
import { EXAMPLE_SUMMONERS } from '@/data/exampleSummoners'

export type SearchSuggestionKind = 'unit' | 'item' | 'trait' | 'augment' | 'summoner'

export interface SearchSuggestion {
  kind: SearchSuggestionKind
  id: string
  label: string
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

function buildCorpus(): SearchSuggestion[] {
  const out: SearchSuggestion[] = []
  const seen = new Set<string>()

  const addItem = (label: string) => {
    const key = `item:${label}`
    if (seen.has(key)) return
    seen.add(key)
    out.push({ kind: 'item', id: label, label })
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
  for (const e of ITEM_GUIDE_ENTRIES) addItem(e.name)

  for (const u of UNITS) {
    out.push({ kind: 'unit', id: u.id, label: u.name })
  }

  for (const s of SYNERGIES) {
    out.push({ kind: 'trait', id: s.id, label: s.name })
  }

  for (const a of AUGMENTS) {
    out.push({ kind: 'augment', id: a.id, label: a.name })
  }

  for (const name of EXAMPLE_SUMMONERS) {
    out.push({ kind: 'summoner', id: name, label: name })
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
