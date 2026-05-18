import type { Augment } from '../data/augments'
import {
  listLegacyAugments,
  resolveAugment,
  resolveAugmentByName,
  toLegacyAugment,
} from '@/lib/augmentResolver'

export function getAugmentById(id: string): Augment | undefined {
  const resolved = resolveAugment(id)
  if (resolved) return toLegacyAugment(resolved)
  return listLegacyAugments().find((a) => a.id === id)
}

export function getAugmentByName(name: string): Augment | undefined {
  const resolved = resolveAugmentByName(name)
  if (resolved) return toLegacyAugment(resolved)
  return listLegacyAugments().find((a) => a.name.toLowerCase() === name.toLowerCase())
}

export function getBestAugmentsForComp(compName: string): Augment[] {
  return listLegacyAugments()
    .filter((a) => a.bestComps.includes(compName))
    .sort((a, b) => b.winRate - a.winRate)
}

export function getAugmentsByTier(tier: Augment['tier']): Augment[] {
  return listLegacyAugments().filter((a) => a.tier === tier)
}

export function getAugmentsByTag(tag: string): Augment[] {
  return listLegacyAugments().filter((a) => a.tags.includes(tag))
}

export function searchAugments(query: string): Augment[] {
  const q = query.toLowerCase()
  return listLegacyAugments().filter(
    (a) =>
      a.name.toLowerCase().includes(q) ||
      a.description.toLowerCase().includes(q) ||
      a.tags.some((t) => t.toLowerCase().includes(q)),
  )
}

export function getAugmentTierColor(tier: Augment['tier']): string {
  const map = { prismatic: 'text-pink-400', gold: 'text-yellow-400', silver: 'text-gray-300' }
  return map[tier]
}

export function getAugmentTierBg(tier: Augment['tier']): string {
  const map = {
    prismatic: 'bg-pink-500/10 border-pink-500/30',
    gold: 'bg-yellow-500/10 border-yellow-500/30',
    silver: 'bg-gray-500/10 border-gray-500/30',
  }
  return map[tier]
}
