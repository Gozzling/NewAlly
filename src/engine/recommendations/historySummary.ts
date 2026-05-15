import type {
  HistoryPerformanceEntry,
  PlayerMatchHistorySummary,
  CompPreferenceEntry,
} from "@ally/shared-types";
import type { Match } from "@/types/riot";
import { SYNERGIES as BUNDLED_SYNERGIES } from "@/data/synergies";
import { UNITS as BUNDLED_UNITS } from "@/data/units";
import type { PersonalMatchRecord } from "@/services/indexedDbService";
import { unitMatchKey } from "@/utils/unitDisplay";

export function emptyPlayerMatchHistorySummary(): PlayerMatchHistorySummary {
  return {
    windowSize: 0,
    avgPlacement: null,
    top4Rate: null,
    favoriteComp: null,
    compFrequency: {},
    traitThresholdHistory: {},
    recentPlacements: [],
    traitPerformance: {},
    unitPerformance: {},
    compPreferences: [],
    itemPerformance: {},
    itemsByCompFrequency: {},
  };
}

/** Internal row after sort + slice (canonical for aggregation). */
interface HistoryRow {
  placement: number;
  units: string[];
  comp: string | null;
  items?: string[];
}

/**
 * Complexity: O(1) Map lookup.
 * Replaces O(N) .find() for significant speedup when processing large match histories.
 */
function canonicalUnitName(raw: string, championMap: Map<string, (typeof BUNDLED_UNITS)[number]>): string {
  const u = championMap.get(unitMatchKey(raw));
  return u?.name ?? raw;
}

/**
 * Complexity: O(U) where U is number of units (constant ~8-10).
 * Replaces O(U * C) where C is number of champions in set (~60).
 */
function traitCountsFromUnitNames(
  unitNames: string[],
  championMap: Map<string, (typeof BUNDLED_UNITS)[number]>,
): Record<string, number> {
  const c: Record<string, number> = {};
  for (const raw of unitNames) {
    const u = championMap.get(unitMatchKey(raw));
    if (!u) continue;
    for (const t of u.traits) {
      c[t] = (c[t] ?? 0) + 1;
    }
  }
  return c;
}

function pushPlacement(m: Map<string, number[]>, key: string, placement: number) {
  let arr = m.get(key);
  if (!arr) {
    arr = [];
    m.set(key, arr);
  }
  arr.push(placement);
}

function finalizeStats(placements: number[]): HistoryPerformanceEntry {
  const n = placements.length;
  if (n === 0) return { avgPlace: 0, winRate: 0, playCount: 0 };
  const sum = placements.reduce((a, b) => a + b, 0);
  const wins = placements.filter((p) => p === 1).length;
  return { avgPlace: sum / n, winRate: wins / n, playCount: n };
}

function mapToPerformance(m: Map<string, number[]>): Record<string, HistoryPerformanceEntry> {
  const out: Record<string, HistoryPerformanceEntry> = {};
  for (const [k, arr] of m.entries()) {
    out[k] = finalizeStats(arr);
  }
  return out;
}

/**
 * Complexity: O(M * U) where M = match history size, U = units/match (~8).
 * Optimized from O(M * U * C) where C = champion roster size (~60) by using Map lookups.
 * Also performs only a single pass over the match history (O(M)).
 */
function aggregateHistoryRows(
  sortedSlice: HistoryRow[],
  contextData?: { champions?: typeof BUNDLED_UNITS; traits?: typeof BUNDLED_SYNERGIES },
): PlayerMatchHistorySummary {
  const n = sortedSlice.length;
  if (n === 0) {
    return emptyPlayerMatchHistorySummary();
  }

  const champions = contextData?.champions ?? BUNDLED_UNITS;
  const traitRoster = contextData?.traits ?? BUNDLED_SYNERGIES;

  /** Pre-build lookup maps for O(1) complexity within the match iteration loop. */
  const championMap = new Map<string, (typeof BUNDLED_UNITS)[number]>();
  for (const c of champions) championMap.set(unitMatchKey(c.name), c);

  const traitMap = new Map<string, (typeof BUNDLED_SYNERGIES)[number]>();
  for (const t of traitRoster) traitMap.set(t.name, t);

  const placements = sortedSlice.map((m) => m.placement).filter((p) => p > 0);
  const avgPlacement = placements.length > 0 ? placements.reduce((a, b) => a + b, 0) / placements.length : null;
  const top4Count = placements.filter((p) => p <= 4).length;
  const top4Rate = placements.length > 0 ? top4Count / placements.length : null;

  const compFrequency: Record<string, number> = {};
  const compPlacements = new Map<string, number[]>();
  const traitPlacements = new Map<string, number[]>();
  const unitPlacements = new Map<string, number[]>();
  const itemPlacements = new Map<string, number[]>();
  const itemsByCompFrequency: Record<string, Record<string, number>> = {};

  /**
   * Merged logic from buildTraitThresholdHistory to eliminate a redundant full pass
   * over the match history.
   */
  type ThresholdAcc = { games: number; top4: number; placementSum: number; placementN: number };
  const thresholdBuckets = new Map<string, ThresholdAcc>();

  for (const m of sortedSlice) {
    const p = m.placement;
    if (p < 1) continue;
    const isTop4 = p <= 4;

    const c = m.comp?.trim() || null;
    if (c) {
      compFrequency[c] = (compFrequency[c] ?? 0) + 1;
      pushPlacement(compPlacements, c, p);
    }

    const traitCounts = traitCountsFromUnitNames(m.units, championMap);
    for (const [traitName, cnt] of Object.entries(traitCounts)) {
      if (cnt > 0) {
        pushPlacement(traitPlacements, traitName, p);
      }

      // Update trait threshold stats (previously in buildTraitThresholdHistory)
      const syn = traitMap.get(traitName);
      if (!syn) continue;
      for (const th of syn.thresholds) {
        if (cnt >= th.count) {
          const key = `${traitName}:${th.count}`;
          let acc = thresholdBuckets.get(key);
          if (!acc) {
            acc = { games: 0, top4: 0, placementSum: 0, placementN: 0 };
            thresholdBuckets.set(key, acc);
          }
          acc.games += 1;
          if (isTop4) acc.top4 += 1;
          acc.placementSum += p;
          acc.placementN += 1;
        }
      }
    }

    const seenUnits = new Set<string>();
    for (const raw of m.units) {
      const name = canonicalUnitName(raw, championMap);
      if (seenUnits.has(name)) continue;
      seenUnits.add(name);
      pushPlacement(unitPlacements, name, p);
    }

    const compBucket = c ?? "—";
    if (!itemsByCompFrequency[compBucket]) itemsByCompFrequency[compBucket] = {};
    for (const it of m.items ?? []) {
      const label = it.trim();
      if (!label) continue;
      pushPlacement(itemPlacements, label, m.placement);
      const row = itemsByCompFrequency[compBucket]!;
      row[label] = (row[label] ?? 0) + 1;
    }
  }

  let favoriteComp: string | null = null;
  let best = 0;
  for (const [k, v] of Object.entries(compFrequency)) {
    if (v > best) {
      best = v;
      favoriteComp = k;
    }
  }

  const compPreferences: CompPreferenceEntry[] = [...compPlacements.entries()]
    .map(([compKey, ps]) => {
      const st = finalizeStats(ps);
      return {
        compKey,
        playCount: st.playCount,
        avgPlace: st.avgPlace,
        winRate: st.winRate,
      };
    })
    .sort((a, b) => b.playCount - a.playCount || a.avgPlace - b.avgPlace);

  /** Finalize trait threshold history from accumulated buckets. */
  const traitThresholdHistory: PlayerMatchHistorySummary["traitThresholdHistory"] = {};
  for (const [key, acc] of thresholdBuckets.entries()) {
    traitThresholdHistory[key] = {
      games: acc.games,
      top4Rate: acc.games > 0 ? acc.top4 / acc.games : null,
      avgPlacement: acc.placementN > 0 ? acc.placementSum / acc.placementN : null,
    };
  }

  return {
    windowSize: n,
    avgPlacement,
    top4Rate,
    favoriteComp,
    compFrequency,
    traitThresholdHistory,
    recentPlacements: placements.slice(0, 20),
    traitPerformance: mapToPerformance(traitPlacements),
    unitPerformance: mapToPerformance(unitPlacements),
    compPreferences,
    itemPerformance: mapToPerformance(itemPlacements),
    itemsByCompFrequency,
  };
}

function sortRowsFromPersonal(matches: PersonalMatchRecord[], windowSize: number): HistoryRow[] {
  return [...matches]
    .filter((m) => m.placement != null && m.placement > 0)
    .sort((a, b) => {
      const tb = b.createdAt ?? b.timestamp ?? 0;
      const ta = a.createdAt ?? a.timestamp ?? 0;
      return tb - ta;
    })
    .slice(0, windowSize)
    .map((m) => ({
      placement: m.placement!,
      units: m.units ?? [],
      comp: m.compName ?? m.comp ?? null,
      items: m.items,
    }));
}

function sortRowsFromRiotMatches(matches: Match[], windowSize: number): HistoryRow[] {
  return [...matches]
    .filter((m) => m.placement > 0)
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, windowSize)
    .map((m) => ({
      placement: m.placement,
      units: m.units ?? [],
      comp: m.comp,
      items: undefined,
    }));
}

export function summarizePersonalMatches(
  matches: PersonalMatchRecord[],
  windowSize = 20,
  contextData?: { champions?: typeof BUNDLED_UNITS; traits?: typeof BUNDLED_SYNERGIES },
): PlayerMatchHistorySummary {
  const slice = sortRowsFromPersonal(matches, windowSize);
  return aggregateHistoryRows(slice, contextData);
}

/** Build summary from Riot-style match rows (API / cache). */
export function buildPlayerHistorySummary(matches: Match[], windowSize = 20): PlayerMatchHistorySummary {
  const slice = sortRowsFromRiotMatches(matches, windowSize);
  return aggregateHistoryRows(slice);
}
