import { AUGMENTS, type Augment } from '../data/augments'

export function getAugmentById(id: string): Augment | undefined {
  return AUGMENTS.find((a) => a.id === id)
}

export function getAugmentByName(name: string): Augment | undefined {
  return AUGMENTS.find((a) => a.name.toLowerCase() === name.toLowerCase())
}

export function getBestAugmentsForComp(compName: string): Augment[] {
  return AUGMENTS.filter((a) => a.bestComps.includes(compName))
    .sort((a, b) => b.winRate - a.winRate)
}

export function getAugmentsByTier(tier: Augment['tier']): Augment[] {
  return AUGMENTS.filter((a) => a.tier === tier)
}

export function getAugmentsByTag(tag: string): Augment[] {
  return AUGMENTS.filter((a) => a.tags.includes(tag))
}

export function searchAugments(query: string): Augment[] {
  const q = query.toLowerCase()
  return AUGMENTS.filter(
    (a) =>
      a.name.toLowerCase().includes(q) ||
      a.description.toLowerCase().includes(q) ||
      a.tags.some((t) => t.toLowerCase().includes(q))
  )
}

export function getAugmentTierColor(tier: Augment['tier']): string {
  const map = { prismatic: 'text-pink-400', gold: 'text-yellow-400', silver: 'text-gray-300' }
  return map[tier]
}

export function getAugmentTierBg(tier: Augment['tier']): string {
  const map = { prismatic: 'bg-pink-500/10 border-pink-500/30', gold: 'bg-yellow-500/10 border-yellow-500/30', silver: 'bg-gray-500/10 border-gray-500/30' }
  return map[tier]
}
