import type { BoardState, BoardUnit } from '../types/tft'
import { normalizeChampionId } from '../shared/gameEngine'

export interface ParsedBoard {
  units: BoardUnit[]
  traits: Record<string, number>
  itemCount: number
  starDistribution: Record<number, number>
}

export function parseBoardState(board: BoardState): ParsedBoard {
  const traits: Record<string, number> = {}
  let itemCount = 0
  const starDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0 }

  for (const unit of board.units) {
    itemCount += unit.items.length
    starDistribution[unit.starLevel] = (starDistribution[unit.starLevel] ?? 0) + 1
  }

  return {
    units: board.units,
    traits,
    itemCount,
    starDistribution,
  }
}

export function getBoardRecommendations(board: BoardState, currentComp: string | null): string[] {
  const unitNames = new Set(board.units.map((u) => normalizeChampionId(u.name).toLowerCase()))
  const recommendations: string[] = []

  if (unitNames.size === 0) {
    recommendations.push('Start building an early game comp')
    return recommendations
  }

  if (!currentComp) {
    recommendations.push('Your board does not match a known meta comp')
    recommendations.push('Consider pivoting to a stronger early game comp')
  }

  const hasItems = board.units.some((u) => u.items.length > 0)
  if (!hasItems) {
    recommendations.push('Place items on your carries for immediate power spike')
  }

  if (board.units.length < 5) {
    recommendations.push(`Add more units — you only have ${board.units.length} on board`)
  }

  return recommendations
}

export function calculateBoardStrength(board: BoardState): number {
  if (board.units.length === 0) return 0

  let score = 0
  for (const unit of board.units) {
    score += unit.starLevel * 10
    score += unit.items.length * 5
  }

  // Bonus for having a full board
  if (board.units.length >= 7) score += 20

  return Math.min(100, Math.round(score))
}
