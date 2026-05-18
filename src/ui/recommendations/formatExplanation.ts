import type {
  EntityRecommendationWithExplanation,
  RecommendationExplanation,
  RecommendationRationale,
} from '@/lib/intentQueryEngine'
import type { RecommendationIntent } from '@/types/recommendationIntent'
import type { BlendedIntent } from '@/types/recommendationIntent'
import {
  penalizeIfNearDuplicate,
  recordRationaleOutput,
  sessionExplanationSimilarity,
} from './explanationConsistency'
import {
  explanationTemplateHash,
  isTemplateFatigued,
  noveltyPenaltyForAugment,
  recordShownRecommendations,
} from './explanationSession'

let actionLineVariant = 0

export type FormattedEntityRecommendation = {
  canonicalId: string
  name: string
  confidence: number
  summaryLines: string[]
  topReasons: string[]
  hasExplanation: boolean
  /** Primary pick = decision-focused; others = comparison context */
  displayRole: 'primary' | 'comparison'
  actionLine?: string
  /** CDN icon when available */
  iconUrl?: string
  /** Full augment description for tooltips / detail */
  description?: string
}

export type GameExplanationContext = {
  hp?: number
  gold?: number
  stage?: string
  roundType?: string
  blendedLabel?: string
}

export type FormatExplanationOptions = {
  intent: RecommendationIntent
  listLimit?: number
  compressionMode?: boolean
  gameContext?: GameExplanationContext
  blendedIntent?: BlendedIntent
}

const INTENT_LINE_LIMITS: Record<RecommendationIntent, { min: number; max: number; maxChars: number }> = {
  tempo: { min: 2, max: 3, maxChars: 72 },
  econ: { min: 2, max: 4, maxChars: 88 },
  reroll: { min: 3, max: 5, maxChars: 96 },
  stabilization: { min: 3, max: 5, maxChars: 110 },
  transition: { min: 2, max: 4, maxChars: 88 },
}

const INTENT_PRIORITY_KEYWORDS: Record<RecommendationIntent, RegExp[]> = {
  tempo: [/tempo|win|damage|combat|hp|gold/i],
  econ: [/gold|interest|econ|\d+g/i],
  reroll: [/roll|shop|reroll|augment|item|gold/i],
  stabilization: [/shield|defense|survive|hp|bulk|patch/i],
  transition: [/pivot|transition|carousel|flex|path/i],
}

const REDUNDANT_LINE = [/^calibrated confidence/i, /^limited sample depth/i, /^fits \w+ intent:/i]

const GENERIC_PHRASES = [
  /\bstrong synergy\b/i,
  /\bhigh value\b/i,
  /\bgreat pick\b/i,
  /\bexcellent choice\b/i,
  /\bvery strong\b/i,
  /\bmeta staple\b/i,
  /\bhighly recommended\b/i,
  /\bgood synergy\b/i,
]

function normalizeLine(line: string): string {
  return line.trim().replace(/\s+/g, ' ')
}

function lineKey(line: string): string {
  return normalizeLine(line).toLowerCase().replace(/[^\w\s]/g, '')
}

function linesSimilar(a: string, b: string): boolean {
  const ka = lineKey(a)
  const kb = lineKey(b)
  if (!ka || !kb) return false
  if (ka === kb) return true
  if (ka.length > 12 && kb.length > 12 && (ka.includes(kb) || kb.includes(ka))) return true
  if (explanationTemplateHash(a) === explanationTemplateHash(b)) return true
  return false
}

function truncateChars(line: string, maxChars: number): string {
  if (line.length <= maxChars) return line
  return `${line.slice(0, maxChars - 1).trim()}…`
}

function applyCompressionLimits(
  intent: RecommendationIntent,
  compressionMode: boolean,
): { min: number; max: number; maxChars: number } {
  const base = INTENT_LINE_LIMITS[intent] ?? INTENT_LINE_LIMITS.stabilization
  if (!compressionMode) return base
  return {
    min: Math.max(1, base.min - 1),
    max: Math.max(1, Math.ceil(base.max * 0.65)),
    maxChars: Math.max(48, Math.floor(base.maxChars * 0.7)),
  }
}

/** Max summary lines for an intent (3–5 depending on intent). */
export function truncateByIntent(
  intent: RecommendationIntent,
  compressionMode = false,
): { min: number; max: number; maxChars: number } {
  return applyCompressionLimits(intent, compressionMode)
}

function isGenericOrLowTrust(line: string): boolean {
  return GENERIC_PHRASES.some((re) => re.test(line))
}

function enrichWithGameContext(
  line: string,
  intent: RecommendationIntent,
  ctx?: GameExplanationContext,
): string {
  if (!ctx) return line
  const parts: string[] = []
  if (ctx.hp != null && /hp|survive|defense|stabil/i.test(line)) {
    parts.push(`${ctx.hp} HP`)
  }
  if (ctx.gold != null && /gold|econ|roll|shop/i.test(line)) {
    parts.push(`${ctx.gold}g`)
  }
  if (ctx.stage && /stage|round/i.test(line)) {
    parts.push(ctx.stage)
  }
  if (parts.length === 0) return line
  if (line.includes(parts[0]!)) return line
  return `${line} (${parts.join(', ')})`
}

function rewriteConcreteLine(
  line: string,
  intent: RecommendationIntent,
  explanation: RecommendationExplanation | undefined,
  ctx?: GameExplanationContext,
): string | null {
  let text = normalizeLine(line)
  if (!text || isGenericOrLowTrust(text)) return null
  if (REDUNDANT_LINE.some((re) => re.test(text))) return null

  const wr = explanation?.historicalStats?.winRate
  const pick = explanation?.historicalStats?.pickRate
  const m = text.match(/win rate\s*([\d.]+)\s*%/i)
  if (m && wr != null) {
    text = `${wr.toFixed(1)}% WR in current meta samples`
  }
  if (/aligns with .* intent/i.test(text)) {
    const hints = explanation?.intentAlignment.matchedHints?.slice(0, 2).join(', ')
    if (hints) text = `${intent} plan: ${hints}`
    else return null
  }
  if (/patch drift/i.test(text) && ctx?.stage) {
    text = `Patch drift — weigh against ${ctx.stage} board timing`
  }
  if (pick != null && /pick/i.test(text) && !/\d/.test(text)) {
    text = `${pick.toFixed(1)}% pick rate in data`
  }

  return enrichWithGameContext(text, intent, ctx)
}

function scoreLine(
  line: string,
  intent: RecommendationIntent,
  canonicalId: string,
  numericBudgetUsed: boolean,
): number {
  let score = 1
  const keywords = INTENT_PRIORITY_KEYWORDS[intent] ?? []
  if (keywords.some((re) => re.test(line))) score += 2
  if (/\d/.test(line)) {
    score += numericBudgetUsed ? -1.5 : 1.5
  }
  score += penalizeIfNearDuplicate(line)
  if (isTemplateFatigued(line)) score -= 3
  score -= noveltyPenaltyForAugment(canonicalId) * 4
  if (isGenericOrLowTrust(line)) score -= 5
  return score
}

function preferSemanticOverStat(line: string, wr?: number, pick?: number): string {
  if (wr != null && /wr|win rate/i.test(line)) {
    if (wr >= 54) return 'Trending above-average in recent lobbies'
    if (wr < 50) return 'Underperforming in current meta — situational pick'
  }
  if (pick != null && /pick rate/i.test(line)) {
    return pick >= 10 ? 'Popular choice this patch' : 'Niche but viable in this plan'
  }
  return line
}

/** Dedupe, drop noisy lines, cap count and length. */
export function formatSummaryLines(
  lines: string[],
  intent: RecommendationIntent,
  options?: { compressionMode?: boolean; canonicalId?: string; numericBudget?: { used: number; max: number } },
): string[] {
  const { max, maxChars } = truncateByIntent(intent, options?.compressionMode)
  const canonicalId = options?.canonicalId ?? ''
  const budget = options?.numericBudget
  const scored = lines
    .map((raw) => {
      const normalized = normalizeLine(raw)
      const numericUsed = budget != null && budget.used >= budget.max && /\d/.test(normalized)
      return { raw: normalized, score: scoreLine(normalized, intent, canonicalId, numericUsed) }
    })
    .filter((x) => x.raw && !REDUNDANT_LINE.some((re) => re.test(x.raw)))
    .sort((a, b) => b.score - a.score)

  const unique: string[] = []
  for (const { raw } of scored) {
    const line = truncateChars(raw, maxChars)
    if (!line || isGenericOrLowTrust(line)) continue
    if (isTemplateFatigued(line) && unique.length > 0) continue
    if (unique.some((u) => linesSimilar(u, line))) continue
    unique.push(line)
    if (/\d/.test(line) && budget) budget.used += 1
    if (unique.length >= max) break
  }

  return unique
}

/** Order global rationale lines by intent relevance with concrete anchors. */
export function prioritizeTopReasons(
  reasons: string[],
  intent: RecommendationIntent,
  ctx?: GameExplanationContext,
  blended?: BlendedIntent,
): string[] {
  const keywords = INTENT_PRIORITY_KEYWORDS[intent] ?? []
  const plan = blended?.label ?? ctx?.blendedLabel ?? intent
  const anchor =
    ctx?.hp != null && ctx.hp < 40
      ? `Low HP — prioritize ${plan}`
      : ctx?.gold != null
        ? `Economy window — ${plan} augments`
        : `Board plan: ${plan}`

  const scored = [
    { text: anchor, score: 12 },
    ...reasons.map((r, index) => {
      const text = normalizeLine(r)
      const boost = keywords.some((re) => re.test(text)) ? 8 : 0
      const concrete = /\d/.test(text) ? 3 : 0
      const generic = isGenericOrLowTrust(text) ? -6 : 0
      return { text, score: boost + concrete + generic - index * 0.01 }
    }),
  ]

  return scored
    .filter((s) => s.text && !isGenericOrLowTrust(s.text))
    .sort((a, b) => b.score - a.score)
    .map((s) => s.text)
    .filter((line, i, arr) => arr.findIndex((x) => linesSimilar(x, line)) === i)
    .slice(0, truncateByIntent(intent).max)
}

function intentFilterLines(lines: string[], intent: RecommendationIntent): string[] {
  if (intent === 'tempo') {
    return lines.filter((l) => !/patch drift|detailed/i.test(l))
  }
  if (intent === 'reroll') {
    return [...lines].sort((a, b) => {
      const sa = /synergy|augment|roll|shop|gold/i.test(a) ? 1 : 0
      const sb = /synergy|augment|roll|shop|gold/i.test(b) ? 1 : 0
      return sb - sa
    })
  }
  return lines
}

function linesFromExplanation(
  explanation: RecommendationExplanation | undefined,
  intent: RecommendationIntent,
  ctx?: GameExplanationContext,
  compressionMode = false,
  canonicalId = '',
  numericBudget?: { used: number; max: number },
): string[] {
  if (!explanation) return []
  const wr = explanation.historicalStats?.winRate
  const pick = explanation.historicalStats?.pickRate
  const raw = intentFilterLines(explanation.summaryLines, intent)
    .map((l) => rewriteConcreteLine(l, intent, explanation, ctx))
    .filter((l): l is string => Boolean(l))
    .map((l) => preferSemanticOverStat(l, wr, pick))

  return formatSummaryLines(raw, intent, { compressionMode, canonicalId, numericBudget })
}

const ACTION_LINE_BUILDERS: ((
  name: string,
  confidence: number,
  intent: RecommendationIntent,
  ctx?: GameExplanationContext,
  blended?: BlendedIntent,
) => string)[] = [
  (name, confidence, intent, ctx, blended) => {
    const plan = blended?.label ?? intent
    const qual = confidence >= 0.7 ? 'Best' : confidence >= 0.5 ? 'Solid' : 'Situational'
    return `${qual} pick: ${name} for ${plan}`
  },
  (name, _confidence, _intent, ctx, blended) => {
    const plan = blended?.label ?? ctx?.blendedLabel ?? 'this board'
    if (ctx?.hp != null && ctx.hp < 35) return `Take ${name} to stabilize (${ctx.hp} HP)`
    if (ctx?.gold != null && ctx.gold >= 50) return `Take ${name} — bank with ${ctx.gold}g (${plan})`
    return `Take ${name} — fits ${plan}`
  },
  (name, confidence, intent, ctx) => {
    const pct = Math.round(confidence * 100)
    const state =
      ctx?.hp != null && ctx.hp < 35
        ? 'stabilize'
        : ctx?.gold != null && ctx.gold < 12
          ? 'reroll plan'
          : `${intent} tempo`
    return `${name} — top ${state} option (${pct}% match)`
  },
]

function buildActionLine(
  name: string,
  confidence: number,
  intent: RecommendationIntent,
  ctx?: GameExplanationContext,
  blended?: BlendedIntent,
): string {
  actionLineVariant = (actionLineVariant + 1) % ACTION_LINE_BUILDERS.length
  return ACTION_LINE_BUILDERS[actionLineVariant]!(name, confidence, intent, ctx, blended)
}

function buildComparisonLine(
  name: string,
  primaryName: string,
  confidence: number,
  primaryConfidence: number,
  rank: number,
): string {
  const delta = Math.round((confidence - primaryConfidence) * 100)
  if (rank === 1) {
    return delta >= -5
      ? `Backup: ${name} if ${primaryName} unavailable`
      : `Backup: ${name} — lower fit than ${primaryName}`
  }
  return delta >= 0
    ? `Alt: ${name} — similar ceiling to ${primaryName}`
    : `Alt: ${name} — niche vs ${primaryName}`
}

/**
 * Ensures top-N list items do not repeat the same headline reasoning.
 */
export function diversifyExplanationsAcrossList(
  items: { id: string; lines: string[] }[],
  maxPerEntity: number,
): Map<string, string[]> {
  const usedKeys = new Set<string>()
  const usedTemplates = new Set<string>()
  const out = new Map<string, string[]>()

  for (const item of items) {
    const picked: string[] = []
    for (const line of item.lines) {
      const key = lineKey(line)
      const tpl = explanationTemplateHash(line)
      if (usedKeys.has(key) || usedTemplates.has(tpl)) continue
      if (isTemplateFatigued(line) && picked.length > 0) continue
      picked.push(line)
      usedKeys.add(key)
      usedTemplates.add(tpl)
      if (picked.length >= maxPerEntity) break
    }
    if (picked.length === 0 && item.lines[0]) {
      picked.push(item.lines[0])
    }
    out.set(item.id, picked)
  }

  return out
}

export function formatEntityRecommendation(
  row: EntityRecommendationWithExplanation,
  intent: RecommendationIntent,
  options: {
    rank: number
    primaryName?: string
    primaryConfidence?: number
    globalReasons?: string[]
    gameContext?: GameExplanationContext
    compressionMode?: boolean
    blendedIntent?: BlendedIntent
    numericBudget?: { used: number; max: number }
  },
): FormattedEntityRecommendation {
  const name = row.entity.name
  const compressionMode = options.compressionMode ?? false
  const lines = linesFromExplanation(
    row.explanation,
    intent,
    options.gameContext,
    compressionMode,
    row.entity.canonicalId,
    options.numericBudget,
  )

  const isPrimary = options.rank === 0
  const globalAnchors = prioritizeTopReasons(
    options.globalReasons ?? [],
    intent,
    options.gameContext,
    options.blendedIntent,
  )

  let summaryLines = lines
  let topReasons: string[] = []
  let actionLine: string | undefined

  if (isPrimary) {
    actionLine = buildActionLine(
      name,
      row.calibratedConfidence,
      intent,
      options.gameContext,
      options.blendedIntent,
    )
    const maxPrimary = compressionMode ? 1 : 2
    summaryLines = formatSummaryLines(
      [actionLine, ...lines, ...globalAnchors.slice(0, 1)],
      intent,
      { compressionMode, canonicalId: row.entity.canonicalId },
    ).slice(0, maxPrimary)
    topReasons = compressionMode ? [] : globalAnchors.slice(0, 1)
  } else {
    const comparison = buildComparisonLine(
      name,
      options.primaryName ?? 'top pick',
      row.calibratedConfidence,
      options.primaryConfidence ?? row.calibratedConfidence,
      options.rank,
    )
    const maxCompare = compressionMode ? 1 : 2
    summaryLines = formatSummaryLines(
      [comparison, ...lines.slice(0, 1)],
      intent,
      { compressionMode, canonicalId: row.entity.canonicalId },
    ).slice(0, maxCompare)
    topReasons = []
  }

  const entityIcon =
    'iconUrl' in row.entity && typeof row.entity.iconUrl === 'string'
      ? row.entity.iconUrl
      : undefined
  const entityDescription =
    'formattedDescription' in row.entity && typeof row.entity.formattedDescription === 'string'
      ? row.entity.formattedDescription
      : 'rawDescription' in row.entity && typeof row.entity.rawDescription === 'string'
        ? row.entity.rawDescription
        : undefined

  return {
    canonicalId: row.entity.canonicalId,
    name,
    confidence: row.calibratedConfidence,
    summaryLines,
    topReasons,
    actionLine: isPrimary ? actionLine : undefined,
    displayRole: isPrimary ? 'primary' : 'comparison',
    hasExplanation: Boolean(row.explanation && (summaryLines.length > 0 || actionLine)),
    ...(entityIcon ? { iconUrl: entityIcon } : {}),
    ...(entityDescription ? { description: entityDescription } : {}),
  }
}

export function formatRecommendationList(
  entities: EntityRecommendationWithExplanation[],
  rationale: RecommendationRationale | null | undefined,
  options: FormatExplanationOptions,
): FormattedEntityRecommendation[] {
  const { intent, listLimit = 5, compressionMode = false, gameContext, blendedIntent } = options
  const globalReasons = rationale?.topReasons?.length
    ? prioritizeTopReasons(rationale.topReasons, intent, gameContext, blendedIntent)
    : []

  const slice = entities.slice(0, listLimit)
  const primary = slice[0]
  const numericBudget = { used: 0, max: compressionMode ? 2 : 3 }

  const draft = slice.map((row, rank) =>
    formatEntityRecommendation(row, intent, {
      rank,
      primaryName: primary?.entity.name,
      primaryConfidence: primary?.calibratedConfidence,
      globalReasons,
      gameContext,
      compressionMode,
      blendedIntent,
      numericBudget,
    }),
  )

  const maxPer = compressionMode
    ? Math.max(1, Math.floor(truncateByIntent(intent, true).max * 0.7))
    : truncateByIntent(intent).max

  const diversified = diversifyExplanationsAcrossList(
    draft.map((d) => ({ id: d.canonicalId, lines: d.summaryLines })),
    maxPer,
  )

  const result = draft.map((d) => ({
    ...d,
    summaryLines: diversified.get(d.canonicalId) ?? d.summaryLines,
    hasExplanation: (diversified.get(d.canonicalId)?.length ?? 0) > 0 || Boolean(d.actionLine),
  }))

  const allLines = result.flatMap((d) => [...d.summaryLines, ...d.topReasons, d.actionLine ?? ''])
  recordRationaleOutput(allLines.filter(Boolean))
  recordShownRecommendations(
    result.map((d) => ({ canonicalId: d.canonicalId, lines: [...d.summaryLines, ...d.topReasons] })),
  )

  return result
}

export function getSessionExplanationSimilarity(): number {
  return sessionExplanationSimilarity()
}

export function hasUsableRationale(rationale: RecommendationRationale | null | undefined): boolean {
  if (!rationale) return false
  return (
    rationale.topReasons.length > 0 ||
    rationale.entitySummaries.length > 0 ||
    rationale.entitySummaries.some((s) => s.summaryLines.length > 0)
  )
}
