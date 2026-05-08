import { UNITS } from '../data/units'
import { unitMatchKey } from '../utils/unitDisplay'

export interface ShopRecommendation {
  name: string
  reason: string
  priority: 'must-buy' | 'strong' | 'situational' | 'skip'
  bestComps: string[]
  value: number // 0-100
}

export function analyzeShop(
  shopUnits: string[],
  currentUnits: string[],
  currentGold: number,
  activeComp: string | null,
  rerollFrequency: 'fast' | 'standard' | 'slow' = 'standard'
): ShopRecommendation[] {
  const recs: ShopRecommendation[] = []
  const owned = new Set(currentUnits.map((u) => unitMatchKey(u)))

  for (const unitName of shopUnits) {
    const unit = UNITS.find((u) => unitMatchKey(u.name) === unitMatchKey(unitName))
    if (!unit) continue

    const isOwned = owned.has(unitMatchKey(unit.name))
    const isInComp = activeComp ? unit.bestComps.includes(activeComp) : false

    let priority: ShopRecommendation['priority']
    let reason: string
    let value: number

    if (isOwned && isInComp) {
      priority = 'must-buy'
      reason = `Duplicate for 2/3-star in ${activeComp}`
      value = 95
    } else if (isInComp) {
      priority = 'must-buy'
      reason = `Core unit for ${activeComp}`
      value = 90
    } else if (isOwned && unit.cost >= 4) {
      priority = 'strong'
      reason = `High-cost duplicate for econ/3-star potential`
      value = 75
    } else if (unit.cost <= 2 && !activeComp) {
      priority = 'situational'
      reason = 'Good early game unit to hold items'
      value = 55
    } else {
      priority = 'skip'
      reason = 'Not part of target comp'
      value = 20
    }

    // Adjust for reroll frequency
    if (rerollFrequency === 'fast' && unit.cost <= 2) {
      value += 10
      reason += ' (Fast 8 comp-friendly)'
    }
    if (rerollFrequency === 'slow' && unit.cost >= 4) {
      value += 10
      reason += ' (Slow roll comp-friendly)'
    }

    recs.push({
      name: unit.name,
      reason,
      priority,
      bestComps: unit.bestComps,
      value: Math.min(100, value),
    })
  }

  return recs.sort((a, b) => b.value - a.value)
}

export function shouldReroll(
  shopRecs: ShopRecommendation[],
  currentGold: number,
  currentHealth: number,
  stage: string
): { action: 'buy-all' | 'reroll' | 'save' | 'level'; reason: string } {
  const mustBuys = shopRecs.filter((r) => r.priority === 'must-buy').length
  const strongs = shopRecs.filter((r) => r.priority === 'strong').length

  if (mustBuys > 0 && currentGold >= mustBuys * 3) {
    return { action: 'buy-all', reason: `Buy ${mustBuys} must-have units` }
  }

  if (currentHealth < 30 && currentGold >= 10) {
    return { action: 'reroll', reason: 'Low HP — reroll for power spike' }
  }

  if (stage.startsWith('3-') && currentGold >= 50) {
    return { action: 'level', reason: 'Stage 3 with strong econ — level to 7' }
  }

  if (stage.startsWith('4-') && currentGold >= 40) {
    return { action: 'level', reason: 'Stage 4 with econ — level to 8 for 4-costs' }
  }

  if (strongs === 0 && currentGold >= 20) {
    return { action: 'reroll', reason: 'No strong units — reroll for better shop' }
  }

  return { action: 'save', reason: 'Save gold for interest/leveling' }
}
