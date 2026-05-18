export const RECOMMENDATION_INTENTS = [
  'tempo',
  'econ',
  'reroll',
  'stabilization',
  'transition',
] as const

export type RecommendationIntent = (typeof RECOMMENDATION_INTENTS)[number]

/** Weighted overlay intent mixture for explanations (observational / UI only). */
export type BlendedIntent = {
  primary: RecommendationIntent
  weights: Partial<Record<RecommendationIntent, number>>
  label: string
}

/** Maps product intent → preferred relationship signal types */
export const INTENT_SIGNAL_AFFINITY: Record<RecommendationIntent, string[]> = {
  tempo: ['tempo', 'core'],
  econ: ['fallback', 'core'],
  reroll: ['transition', 'fallback'],
  stabilization: ['synergy', 'core'],
  transition: ['transition', 'synergy'],
}

/** Maps intent → augment tag/name heuristics for entity ranking */
export const INTENT_ENTITY_HINTS: Record<RecommendationIntent, string[]> = {
  tempo: ['tempo', 'combat', 'damage', 'win'],
  econ: ['gold', 'interest', 'econ', 'rich'],
  reroll: ['roll', 'shop', 'reroll', 'trade'],
  stabilization: ['shield', 'hp', 'defense', 'survive', 'bulk'],
  transition: ['pivot', 'transition', 'flex', 'emblem'],
}
