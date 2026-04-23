import type { Match, PlayerStats } from '../types/riot'

export function calculatePlayerStats(matches: Match[]): PlayerStats {
  const totalMatches = matches.length
  if (totalMatches === 0) {
    return {
      totalMatches: 0,
      top4Count: 0,
      top4Rate: 0,
      avgPlacement: 0,
      winCount: 0,
      winRate: 0,
      avgLevel: 0,
      mostPlayedComps: [],
      winRateByComp: {},
      mostPickedAugments: [],
      placements: [],
    }
  }

  const placements = matches.map((m) => m.placement)
  const top4Count = placements.filter((p) => p <= 4).length
  const winCount = placements.filter((p) => p === 1).length
  const avgPlacement = placements.reduce((a, b) => a + b, 0) / totalMatches
  const avgLevel = matches.reduce((a, m) => a + m.level, 0) / totalMatches

  // Comp stats
  const compStats: Record<string, { count: number; top4: number }> = {}
  for (const m of matches) {
    const key = m.comp ?? 'Unknown'
    if (!compStats[key]) compStats[key] = { count: 0, top4: 0 }
    compStats[key].count++
    if (m.placement <= 4) compStats[key].top4++
  }

  const mostPlayedComps = Object.entries(compStats)
    .map(([comp, s]) => ({
      comp,
      count: s.count,
      top4Rate: Math.round((s.top4 / s.count) * 100),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  const winRateByComp: Record<string, number> = {}
  for (const [comp, s] of Object.entries(compStats)) {
    const wins = matches.filter((m) => m.comp === comp && m.placement === 1).length
    winRateByComp[comp] = Math.round((wins / s.count) * 100)
  }

  // Augment stats
  const augStats: Record<string, number> = {}
  for (const m of matches) {
    for (const a of m.augments) {
      augStats[a] = (augStats[a] ?? 0) + 1
    }
  }

  const mostPickedAugments = Object.entries(augStats)
    .map(([augment, count]) => ({ augment, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  return {
    totalMatches,
    top4Count,
    top4Rate: Math.round((top4Count / totalMatches) * 100),
    avgPlacement: Math.round(avgPlacement * 10) / 10,
    winCount,
    winRate: Math.round((winCount / totalMatches) * 100),
    avgLevel: Math.round(avgLevel * 10) / 10,
    mostPlayedComps,
    winRateByComp,
    mostPickedAugments,
    placements,
  }
}
