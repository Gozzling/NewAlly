import { explanationTemplateHash } from './explanationSession'

const recentRationaleLines: string[] = []
const recentAnchorPatterns: string[] = []
const MAX_RATIONALE_MEMORY = 40

function tokenSet(line: string): Set<string> {
  return new Set(
    line
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 2),
  )
}

/** Jaccard similarity 0–1 between two explanation lines. */
export function explanationSimilarityScore(a: string, b: string): number {
  const ta = tokenSet(a)
  const tb = tokenSet(b)
  if (ta.size === 0 || tb.size === 0) return 0
  let inter = 0
  for (const t of ta) {
    if (tb.has(t)) inter += 1
  }
  const union = ta.size + tb.size - inter
  return union > 0 ? inter / union : 0
}

function anchorPattern(line: string): string {
  return line
    .toLowerCase()
    .replace(/\d+/g, '#')
    .replace(/\b(hp|gold|g|pick|fit|vs|wr|meta)\b/g, '$')
    .trim()
}

export function isRepetitiveAnchor(line: string): boolean {
  const pattern = anchorPattern(line)
  if (!pattern) return false
  const hits = recentAnchorPatterns.filter((p) => p === pattern || explanationSimilarityScore(p, pattern) > 0.72)
  return hits.length >= 2
}

export function sessionExplanationSimilarity(): number {
  if (recentRationaleLines.length < 2) return 0
  let sum = 0
  let pairs = 0
  for (let i = 1; i < recentRationaleLines.length; i++) {
    sum += explanationSimilarityScore(recentRationaleLines[i - 1]!, recentRationaleLines[i]!)
    pairs += 1
  }
  return pairs > 0 ? sum / pairs : 0
}

export function penalizeIfNearDuplicate(line: string, threshold = 0.78): number {
  for (const prev of recentRationaleLines) {
    if (explanationSimilarityScore(prev, line) >= threshold) return -4
  }
  if (isRepetitiveAnchor(line)) return -3
  return 0
}

export function recordRationaleOutput(lines: string[]): void {
  for (const line of lines) {
    if (!line.trim()) continue
    recentRationaleLines.push(line)
    recentAnchorPatterns.push(anchorPattern(line))
    while (recentRationaleLines.length > MAX_RATIONALE_MEMORY) {
      recentRationaleLines.shift()
      recentAnchorPatterns.shift()
    }
  }
}

/** @internal Test-only */
export function resetExplanationConsistency(): void {
  recentRationaleLines.length = 0
  recentAnchorPatterns.length = 0
}
