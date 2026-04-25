export function assessOpponentThreat(board: { units: any[] }): { threat: number; advice: string } {
  const unitCount = board?.units?.length ?? 0
  const hasCarry = board?.units?.some((u: any) => u?.starLevel >= 2)
  if (unitCount >= 8 && hasCarry) return { threat: 3, advice: 'High threat - strong board with 2-star carry.' }
  if (unitCount >= 6) return { threat: 2, advice: 'Medium threat - solid board but no clear carry yet.' }
  return { threat: 1, advice: 'Low threat - weak board, likely rolling or pivoting.' }
}
