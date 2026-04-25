import type { BoardUnit } from '../types/tft'

export interface DamageResult {
  totalDPS: number
  totalBurst: number
  expectedKills: number
  survivabilityScore: number
}

const ITEM_DMG: Record<string, number> = {
  "Infinity Edge": 35, "Jeweled Gauntlet": 30, "Rabadon's Deathcap": 50,
  "Shadowflame": 25, "Giant Slayer": 25, "Deathblade": 40,
}

const ITEM_SURV: Record<string, number> = {
  "Warmog's Armor": 25, "Bramble Vest": 20, "Dragon's Claw": 20,
  "Gargoyle Stoneplate": 18, "Sunfire Cape": 10, "Redemption": 15,
}

const BASE_AD: Record<string, number> = { '1': 45, '2': 55, '3': 65, '4': 75, '5': 85 }
const BASE_HP: Record<string, number> = { '1': 500, '2': 650, '3': 800, '4': 950, '5': 1100 }

export function calculateDamage(units: BoardUnit[], costs: Record<string, number> = {}): DamageResult {
  if (!units.length) return { totalDPS: 0, totalBurst: 0, expectedKills: 0, survivabilityScore: 0 }
  let dps = 0, burst = 0, surv = 0
  for (const u of units) {
    const c = costs[u.name] || 2
    const s = u.starLevel === 3 ? 2.25 : u.starLevel === 2 ? 1.5 : 1
    let dmg = (BASE_AD[c] || 50) * s
    let hp = (BASE_HP[c] || 600) * s
    for (const i of u.items) {
      dmg *= 1 + (ITEM_DMG[i] || 0) / 100
      hp += (ITEM_SURV[i] || 0) * 10
    }
    dps += dmg * 0.75 + dmg * 0.4
    burst += dmg * 1.5 + dmg * 2
    surv += hp / 10
  }
  return {
    totalDPS: Math.round(dps),
    totalBurst: Math.round(burst),
    expectedKills: Math.min(8, Math.round(burst / 800)),
    survivabilityScore: Math.min(100, Math.round(surv / units.length)),
  }
}
