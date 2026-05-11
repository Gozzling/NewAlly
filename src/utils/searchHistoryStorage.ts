import type { RiotRegion } from '@/types/riot'
import type { SearchSuggestion } from '@/utils/searchSuggestions'

const MH_KEY = 'tft-ally::mh-search-history'
const GLOBAL_KEY = 'tft-ally::global-search-history'
const MH_MAX = 10
const GLOBAL_MAX = 12

export type MhSearchHistoryEntry = {
  label: string
  region: RiotRegion
  at: number
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (raw == null || raw === '') return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function readMhSearchHistory(): MhSearchHistoryEntry[] {
  if (typeof localStorage === 'undefined') return []
  return safeParse<MhSearchHistoryEntry[]>(localStorage.getItem(MH_KEY), []).filter(
    (e) => typeof e?.label === 'string' && e.label.trim().length > 0 && typeof e?.region === 'string',
  )
}

export function pushMhSearchHistory(label: string, region: RiotRegion): void {
  if (typeof localStorage === 'undefined') return
  const trimmed = label.trim()
  if (!trimmed) return
  const prev = readMhSearchHistory().filter(
    (e) => !(e.label.toLowerCase() === trimmed.toLowerCase() && e.region === region),
  )
  const next: MhSearchHistoryEntry[] = [{ label: trimmed, region, at: Date.now() }, ...prev].slice(0, MH_MAX)
  localStorage.setItem(MH_KEY, JSON.stringify(next))
}

export function mhHistoryToSuggestions(entries: MhSearchHistoryEntry[]): SearchSuggestion[] {
  return entries.map((e) => ({
    kind: 'summoner' as const,
    id: `recent:${e.region}:${e.label}`,
    label: e.label,
    region: e.region,
  }))
}

export type GlobalSearchHistoryEntry = SearchSuggestion & { at: number }

export function readGlobalSearchHistory(): GlobalSearchHistoryEntry[] {
  if (typeof localStorage === 'undefined') return []
  const raw = safeParse<GlobalSearchHistoryEntry[]>(localStorage.getItem(GLOBAL_KEY), [])
  return raw.filter((e) => e && typeof e.label === 'string' && e.label.trim().length > 0 && typeof e.kind === 'string')
}

export function pushGlobalSearchHistory(entry: SearchSuggestion): void {
  if (typeof localStorage === 'undefined') return
  const prev = readGlobalSearchHistory().filter(
    (e) => !(e.kind === entry.kind && e.label === entry.label && e.id === entry.id),
  )
  const next: GlobalSearchHistoryEntry[] = [{ ...entry, at: Date.now() }, ...prev].slice(0, GLOBAL_MAX)
  localStorage.setItem(GLOBAL_KEY, JSON.stringify(next))
}

export function globalHistoryToSuggestions(entries: GlobalSearchHistoryEntry[]): SearchSuggestion[] {
  return entries.map(({ kind, id, label, region }) => {
    const s: SearchSuggestion = { kind, id, label }
    if (region) s.region = region
    return s
  })
}
