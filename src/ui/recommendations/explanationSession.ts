/**
 * Session-scoped explanation fatigue + novelty tracking (UI layer only).
 */

const MAX_AUGMENT_HISTORY = 24
const MAX_TEMPLATE_HISTORY = 48
const TEMPLATE_REPEAT_CAP = 2

const recentAugmentIds: string[] = []
const templateUseCount = new Map<string, number>()
const recentTemplateOrder: string[] = []

function bumpBounded<T>(arr: T[], item: T, max: number): void {
  const idx = arr.indexOf(item)
  if (idx >= 0) arr.splice(idx, 1)
  arr.push(item)
  while (arr.length > max) arr.shift()
}

/** Normalize line into a template key (numbers → #). */
export function explanationTemplateHash(line: string): string {
  return line
    .toLowerCase()
    .replace(/\d+(\.\d+)?/g, '#')
    .replace(/[^\w#\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function isTemplateFatigued(line: string): boolean {
  const hash = explanationTemplateHash(line)
  if (!hash) return false
  return (templateUseCount.get(hash) ?? 0) >= TEMPLATE_REPEAT_CAP
}

export function noveltyPenaltyForAugment(canonicalId: string): number {
  const idx = recentAugmentIds.indexOf(canonicalId)
  if (idx < 0) return 0
  const age = recentAugmentIds.length - idx
  if (age <= 2) return 0.45
  if (age <= 5) return 0.25
  if (age <= 10) return 0.12
  return 0
}

export function recordShownRecommendations(
  items: { canonicalId: string; lines: string[] }[],
): void {
  for (const item of items) {
    bumpBounded(recentAugmentIds, item.canonicalId.toLowerCase(), MAX_AUGMENT_HISTORY)
    for (const line of item.lines) {
      const hash = explanationTemplateHash(line)
      if (!hash) continue
      templateUseCount.set(hash, (templateUseCount.get(hash) ?? 0) + 1)
      bumpBounded(recentTemplateOrder, hash, MAX_TEMPLATE_HISTORY)
    }
  }
}

/** @internal Test-only */
export function resetExplanationSession(): void {
  recentAugmentIds.length = 0
  templateUseCount.clear()
  recentTemplateOrder.length = 0
}
