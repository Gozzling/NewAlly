import type { Augment } from '@/data/augments'
import { deriveCanonicalAugmentId } from '@/lib/canonicalAugmentId'
import { CURRENT_TFT_SET_NUMBER } from '@/meta/tftCurrentSet'
import type { RecommendationIntent } from '@/types/recommendationIntent'
import type { FormattedEntityRecommendation } from '@/ui/recommendations/formatExplanation'
import { augmentIconUrl } from '@/utils/augmentDisplay'
import { gameIconDisplayUrl } from '@/utils/cdIconDisplay'

const INTENT_HINTS: Record<RecommendationIntent, string[]> = {
  tempo: ['attack', 'speed', 'damage', 'combat', 'strength', 'crit', 'as', 'tempo'],
  econ: ['gold', 'interest', 'economy', 'shop', 'cost', 'treasure', 'rich'],
  reroll: ['reroll', 'roll', 'refresh', 'champion', 'shop', 'dice'],
  stabilization: ['health', 'heal', 'shield', 'armor', 'durability', 'survive', 'regen', 'hp'],
  transition: ['trait', 'emblem', 'flex', 'transition', 'item', 'augment'],
}

function apiNameForAugment(aug: Augment): string {
  return aug.apiName ?? aug.id
}

function canonicalIdForAugment(aug: Augment): string {
  return deriveCanonicalAugmentId(apiNameForAugment(aug), CURRENT_TFT_SET_NUMBER)
}

function iconForAugment(aug: Augment): string {
  return gameIconDisplayUrl(aug.iconUrl, augmentIconUrl(aug.name))
}

function intentMatchScore(aug: Augment, intent: RecommendationIntent): number {
  const haystack = `${aug.name} ${aug.description} ${aug.effect} ${aug.tags.join(' ')}`.toLowerCase()
  const hints = INTENT_HINTS[intent]
  let hits = 0
  for (const hint of hints) {
    if (haystack.includes(hint)) hits += 1
  }
  const synergyBoost =
    aug.synergies.length > 0 && (intent === 'transition' || intent === 'tempo') ? 0.08 : 0
  const tierBoost =
    aug.tier === 'prismatic' ? 0.06 : aug.tier === 'gold' ? 0.03 : 0
  const raw = hits / Math.max(hints.length * 0.35, 1) + synergyBoost + tierBoost
  return Math.min(1, Math.max(0.12, raw))
}

export function rankStoreAugmentsForIntent(
  augments: Augment[],
  intent: RecommendationIntent,
  limit: number,
  excludeCanonicalIds: ReadonlySet<string> = new Set(),
): FormattedEntityRecommendation[] {
  if (limit <= 0 || augments.length === 0) return []

  const ranked = augments
    .map((aug) => {
      const canonicalId = canonicalIdForAugment(aug)
      const match = intentMatchScore(aug, intent)
      return { aug, canonicalId, match }
    })
    .filter((row) => !excludeCanonicalIds.has(row.canonicalId))
    .sort((a, b) => b.match - a.match || a.aug.name.localeCompare(b.aug.name))
    .slice(0, limit)

  return ranked.map((row, rank) => {
    const description = row.aug.description?.trim() || row.aug.effect || row.aug.name
    const summary =
      description.length > 140 ? `${description.slice(0, 137).trimEnd()}…` : description
    const confidence = Math.round((0.32 + row.match * 0.48) * 100) / 100

    return {
      canonicalId: row.canonicalId,
      name: row.aug.name,
      confidence,
      summaryLines: [summary],
      topReasons: [],
      hasExplanation: Boolean(summary),
      displayRole: rank === 0 ? 'primary' : 'comparison',
      iconUrl: iconForAugment(row.aug),
      description,
    }
  })
}

export function enrichFormattedAugmentsFromStore(
  formatted: FormattedEntityRecommendation[],
  augments: Augment[],
): FormattedEntityRecommendation[] {
  if (formatted.length === 0 || augments.length === 0) return formatted

  const byCanonical = new Map<string, Augment>()
  const byName = new Map<string, Augment>()
  for (const aug of augments) {
    byCanonical.set(canonicalIdForAugment(aug), aug)
    byName.set(aug.name.toLowerCase(), aug)
  }

  return formatted.map((pick) => {
    const row = byCanonical.get(pick.canonicalId) ?? byName.get(pick.name.toLowerCase())
    if (!row) return pick
    const description = row.description?.trim() || pick.description
    return {
      ...pick,
      iconUrl: iconForAugment(row),
      ...(description ? { description } : {}),
      ...(pick.summaryLines.length === 0 && description
        ? {
            summaryLines: [
              description.length > 140 ? `${description.slice(0, 137).trimEnd()}…` : description,
            ],
            hasExplanation: true,
          }
        : {}),
    }
  })
}
