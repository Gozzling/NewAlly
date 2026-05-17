import type { PersonalTopComp } from "@ally/shared-types";
import { detectCompFromUnits } from "@/shared/gameEngine";
import type { PersonalMatchRecord } from "@/services/indexedDbService";
import { getMatchUnitBuilds } from "./unitBuilds";

export type BuildPersonalTopCompsOptions = {
  windowSize?: number;
  minGames?: number;
  nowMs?: number;
  /** Half-life for recency weighting (ms). */
  recencyHalfLifeMs?: number;
};

const DEFAULT_HALF_LIFE_MS = 14 * 24 * 60 * 60 * 1000;

function compKeyForMatch(m: PersonalMatchRecord): string {
  const raw = (m.compName ?? m.comp ?? detectCompFromUnits(m.units ?? []) ?? "Unknown").trim();
  return raw || "Unknown";
}

function recencyWeight(createdAt: number, nowMs: number, halfLifeMs: number): number {
  const age = Math.max(0, nowMs - createdAt);
  return Math.pow(0.5, age / halfLifeMs);
}

function placementPoints(placement: number): number {
  if (placement < 1 || placement > 8) return 0;
  return (9 - placement) / 8;
}

function pickDisplayName(names: string[]): string {
  const counts = new Map<string, number>();
  for (const n of names) {
    const key = n.trim();
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  let best = "Unknown";
  let bestN = 0;
  for (const [name, n] of counts) {
    if (n > bestN) {
      bestN = n;
      best = name;
    }
  }
  return best;
}

function topItemRates(
  itemCounts: Map<string, number>,
  gamesWithData: number,
  limit: number,
): Array<{ name: string; rate: number }> {
  if (gamesWithData <= 0) return [];
  return [...itemCounts.entries()]
    .map(([name, count]) => ({ name, rate: Math.round((count / gamesWithData) * 100) }))
    .sort((a, b) => b.rate - a.rate || a.name.localeCompare(b.name))
    .slice(0, limit);
}

/**
 * Builds ranked personal comp lines from cached GEP matches.
 * Uses placement + recency; attributes items to units when `unitBuilds` exist.
 */
export function buildPersonalTopComps(
  matches: PersonalMatchRecord[],
  options: BuildPersonalTopCompsOptions = {},
): PersonalTopComp[] {
  const windowSize = options.windowSize ?? 80;
  const minGames = options.minGames ?? 2;
  const nowMs = options.nowMs ?? Date.now();
  const halfLifeMs = options.recencyHalfLifeMs ?? DEFAULT_HALF_LIFE_MS;

  const slice = [...matches]
    .sort((a, b) => (b.createdAt ?? b.timestamp ?? 0) - (a.createdAt ?? a.timestamp ?? 0))
    .slice(0, windowSize)
    .filter((m) => m.placement != null && m.placement >= 1 && m.placement <= 8);

  type GroupAcc = {
    compKey: string;
    displayNames: string[];
    weightedGames: number;
    placementSum: number;
    top4Weight: number;
    winWeight: number;
    lastPlayedAt: number;
    unitCounts: Map<string, number>;
    carryItemCounts: Map<string, Map<string, number>>;
    carryGameCounts: Map<string, number>;
    gamesWithUnitBuilds: number;
  };

  const groups = new Map<string, GroupAcc>();

  for (const m of slice) {
    const compKey = compKeyForMatch(m).toLowerCase();
    const createdAt = m.createdAt ?? m.timestamp ?? nowMs;
    const w = recencyWeight(createdAt, nowMs, halfLifeMs);
    const placement = m.placement!;

    let g = groups.get(compKey);
    if (!g) {
      g = {
        compKey,
        displayNames: [],
        weightedGames: 0,
        placementSum: 0,
        top4Weight: 0,
        winWeight: 0,
        lastPlayedAt: 0,
        unitCounts: new Map(),
        carryItemCounts: new Map(),
        carryGameCounts: new Map(),
        gamesWithUnitBuilds: 0,
      };
      groups.set(compKey, g);
    }

    g.displayNames.push(compKeyForMatch(m));
    g.weightedGames += w;
    g.placementSum += placement * w;
    if (placement <= 4) g.top4Weight += w;
    if (placement === 1) g.winWeight += w;
    g.lastPlayedAt = Math.max(g.lastPlayedAt, createdAt);

    const builds = getMatchUnitBuilds(m);
    const hasAttributedItems = Boolean(m.unitBuilds?.length);
    if (hasAttributedItems) g.gamesWithUnitBuilds += 1;

    for (const u of builds) {
      const unitKey = u.name.trim();
      if (!unitKey) continue;
      g.unitCounts.set(unitKey, (g.unitCounts.get(unitKey) ?? 0) + 1);

      if (hasAttributedItems && u.items.length > 0) {
        g.carryGameCounts.set(unitKey, (g.carryGameCounts.get(unitKey) ?? 0) + 1);
        let itemMap = g.carryItemCounts.get(unitKey);
        if (!itemMap) {
          itemMap = new Map();
          g.carryItemCounts.set(unitKey, itemMap);
        }
        for (const item of u.items) {
          const ik = item.trim();
          if (!ik) continue;
          itemMap.set(ik, (itemMap.get(ik) ?? 0) + 1);
        }
      }
    }
  }

  const out: PersonalTopComp[] = [];

  for (const g of groups.values()) {
    const games = g.displayNames.length;
    if (games < minGames || g.weightedGames <= 0) continue;

    const avgPlacement = g.placementSum / g.weightedGames;
    const top4Rate = Math.round((g.top4Weight / g.weightedGames) * 100);
    const winRate = Math.round((g.winWeight / g.weightedGames) * 100);
    const performance = (top4Rate / 100) * 0.55 + placementPoints(Math.round(avgPlacement)) * 0.45;
    const volumeBoost = Math.min(1, games / 5);
    const score = Math.round(performance * volumeBoost * 1000) / 10;

    const coreUnits = [...g.unitCounts.entries()]
      .map(([name, count]) => ({ name, rate: Math.round((count / games) * 100) }))
      .sort((a, b) => b.rate - a.rate || a.name.localeCompare(b.name))
      .slice(0, 8);

    const carryThreshold = Math.max(2, Math.ceil(games * 0.35));
    const itemBuilds: PersonalTopComp["itemBuilds"] = [];

    for (const [unit, gameCount] of g.carryGameCounts) {
      if (gameCount < carryThreshold) continue;
      const itemMap = g.carryItemCounts.get(unit);
      if (!itemMap?.size) continue;
      itemBuilds.push({
        unit,
        items: topItemRates(itemMap, gameCount, 3),
      });
    }

    itemBuilds.sort((a, b) => {
      const ar = a.items[0]?.rate ?? 0;
      const br = b.items[0]?.rate ?? 0;
      return br - ar || a.unit.localeCompare(b.unit);
    });

    out.push({
      compKey: g.compKey,
      displayName: pickDisplayName(g.displayNames),
      games,
      weightedGames: Math.round(g.weightedGames * 10) / 10,
      avgPlacement: Math.round(avgPlacement * 10) / 10,
      top4Rate,
      winRate,
      score,
      coreUnits,
      itemBuilds: itemBuilds.slice(0, 4),
      lastPlayedAt: g.lastPlayedAt,
    });
  }

  return out.sort((a, b) => b.score - a.score || b.games - a.games || b.lastPlayedAt - a.lastPlayedAt);
}
