import type { Augment } from '@/data/augments'
import { deriveCanonicalAugmentId } from '@/lib/canonicalAugmentId'
import { normalizeAugmentApiKey } from '@/lib/augmentNormalize'
import type {
  CanonicalAugment,
  CanonicalAugmentSource,
  CanonicalAugmentTier,
  MergedAugmentCatalog,
} from '@/types/canonicalAugment'
import type { CanonicalDataVersion } from '@/types/canonicalCatalog'
import type { TFTStaticAugment } from '@/types/tftStaticData'
import { formatTftText } from '@/utils/formatTftText'
import { augmentIconUrl } from '@/utils/augmentDisplay'
import { gameIconDisplayUrl } from '@/utils/cdIconDisplay'

export type CdnAugmentRow = Augment & {
  apiName?: string
  rawDescription?: string
  effects?: Record<string, number>
}

function mapStaticTier(tier: TFTStaticAugment['tier']): CanonicalAugmentTier | undefined {
  if (tier === 'prismatic' || tier === 'gold' || tier === 'silver') return tier
  return undefined
}

function formatDescription(raw: string | undefined, effects?: Record<string, number>): string | undefined {
  if (!raw?.trim()) return undefined
  const formatted = formatTftText(raw, effects)
  return formatted?.trim() ? formatted : undefined
}

function pick<T>(cdn: T | undefined, stat: T | undefined, bundled: T | undefined): T | undefined {
  if (cdn !== undefined && cdn !== null && cdn !== ('' as T)) return cdn
  if (stat !== undefined && stat !== null && stat !== ('' as T)) return stat
  return bundled
}

function buildEntityMetadata(
  merged: Pick<
    CanonicalAugment,
    'effects' | 'formattedDescription' | 'stats' | 'source'
  >,
  sourceChain: CanonicalAugmentSource[],
): CanonicalAugment['metadata'] {
  return {
    sourceChain,
    completeness: {
      hasEffects: Boolean(merged.effects && Object.keys(merged.effects).length > 0),
      hasFormattedDescription: Boolean(merged.formattedDescription?.trim()),
      hasStats: Boolean(
        merged.stats &&
          (merged.stats.pickRate !== undefined ||
            merged.stats.winRate !== undefined ||
            merged.stats.avgPlacement !== undefined),
      ),
    },
  }
}

function staticPartial(row: TFTStaticAugment): Partial<CanonicalAugment> {
  const raw = row.rawDescription ?? row.description
  const effects = row.effects
  return {
    apiName: row.apiName,
    name: row.name,
    iconUrl: row.iconUrl ?? undefined,
    tier: mapStaticTier(row.tier),
    rawDescription: raw,
    formattedDescription: formatDescription(raw, effects) ?? row.description,
    effects,
    source: 'static',
    tags: [row.tier, 'augment'].filter((t) => t && t !== 'unknown'),
    comps: [],
    synergies: row.associatedTraits,
  }
}

function cdnPartial(row: CdnAugmentRow, apiName: string): Partial<CanonicalAugment> {
  const raw = row.rawDescription ?? row.description
  const effects = row.effects
  return {
    apiName,
    name: row.name,
    iconUrl: row.iconUrl,
    tier: row.tier,
    rawDescription: raw,
    formattedDescription: formatDescription(raw, effects) ?? row.description,
    effects,
    source: 'cdn',
    tags: row.tags,
    comps: row.bestComps,
    synergies: row.synergies,
    counters: row.counters,
    stats: {
      pickRate: row.pickRate,
      winRate: row.winRate,
      avgPlacement: row.avgPlacement,
    },
  }
}

function bundledPartial(row: Augment): Partial<CanonicalAugment> {
  return {
    apiName: row.apiName ?? row.id,
    name: row.name,
    iconUrl: row.iconUrl ?? augmentIconUrl(row.name),
    tier: row.tier,
    rawDescription: row.rawDescription ?? row.description,
    formattedDescription: row.description,
    effects: row.effects,
    source: 'bundled',
    tags: row.tags,
    comps: row.bestComps,
    synergies: row.synergies,
    counters: row.counters,
    stats: {
      pickRate: row.pickRate,
      winRate: row.winRate,
      avgPlacement: row.avgPlacement,
    },
  }
}

function mergePartials(
  bundled: Partial<CanonicalAugment>,
  stat: Partial<CanonicalAugment>,
  cdn: Partial<CanonicalAugment>,
  version: CanonicalDataVersion,
): CanonicalAugment {
  const sourceChain: CanonicalAugmentSource[] = []
  if (Object.keys(bundled).length > 0) sourceChain.push('bundled')
  if (Object.keys(stat).length > 0) sourceChain.push('static')
  if (Object.keys(cdn).length > 0) sourceChain.push('cdn')

  const apiName = pick(cdn.apiName, stat.apiName, bundled.apiName) ?? ''
  const name = pick(cdn.name, stat.name, bundled.name) ?? apiName
  const raw = pick(cdn.rawDescription, stat.rawDescription, bundled.rawDescription)
  const effects = { ...bundled.effects, ...stat.effects, ...cdn.effects }
  const formatted =
    pick(cdn.formattedDescription, stat.formattedDescription, bundled.formattedDescription) ??
    formatDescription(raw, effects) ??
    raw

  const winningSource = cdn.source ?? stat.source ?? bundled.source

  const merged: CanonicalAugment = {
    type: 'augment',
    canonicalId: deriveCanonicalAugmentId(apiName, version.set),
    apiName,
    name,
    set: version.set,
    patch: version.patch,
    locale: version.locale,
    version,
    iconUrl:
      pick(cdn.iconUrl, stat.iconUrl, bundled.iconUrl) ??
      gameIconDisplayUrl(undefined, augmentIconUrl(name)),
    tier: pick(cdn.tier, stat.tier, bundled.tier),
    rawDescription: raw,
    formattedDescription: formatted,
    effects: Object.keys(effects).length ? effects : undefined,
    source: winningSource,
    tags: [...new Set([...(bundled.tags ?? []), ...(stat.tags ?? []), ...(cdn.tags ?? [])])],
    comps: pick(cdn.comps, stat.comps, bundled.comps),
    synergies: pick(cdn.synergies, stat.synergies, bundled.synergies),
    counters: pick(cdn.counters, stat.counters, bundled.counters),
    stats: { ...bundled.stats, ...stat.stats, ...cdn.stats },
    metadata: buildEntityMetadata(
      {
        effects: Object.keys(effects).length ? effects : undefined,
        formattedDescription: formatted,
        stats: { ...bundled.stats, ...stat.stats, ...cdn.stats },
        source: winningSource,
      },
      sourceChain,
    ),
  }

  return merged
}

/** Merge CDN > static > bundled into a versioned catalog. */
export function mergeAugmentSources(input: {
  version: CanonicalDataVersion
  staticAugments: TFTStaticAugment[]
  cdnAugments: CdnAugmentRow[]
  bundledAugments: Augment[]
}): MergedAugmentCatalog {
  const bundledByApi = new Map<string, Partial<CanonicalAugment>>()
  const staticByApi = new Map<string, Partial<CanonicalAugment>>()
  const cdnByApi = new Map<string, Partial<CanonicalAugment>>()

  for (const row of input.bundledAugments) {
    const apiName = row.apiName ?? row.id
    bundledByApi.set(normalizeAugmentApiKey(apiName), bundledPartial(row))
  }

  for (const row of input.staticAugments) {
    staticByApi.set(normalizeAugmentApiKey(row.apiName), staticPartial(row))
  }

  for (const row of input.cdnAugments) {
    const apiName = row.apiName?.trim() || row.id.replace(/^aug_/, '')
    cdnByApi.set(normalizeAugmentApiKey(apiName), cdnPartial(row, apiName))
  }

  const keys = new Set([...bundledByApi.keys(), ...staticByApi.keys(), ...cdnByApi.keys()])

  const byApiName = new Map<string, CanonicalAugment>()
  const byCanonicalId = new Map<string, CanonicalAugment>()

  for (const key of keys) {
    const merged = mergePartials(
      bundledByApi.get(key) ?? {},
      staticByApi.get(key) ?? {},
      cdnByApi.get(key) ?? {},
      input.version,
    )
    if (!merged.apiName) continue
    byApiName.set(key, merged)
    byCanonicalId.set(merged.canonicalId, merged)
  }

  return {
    version: input.version,
    byApiName,
    byCanonicalId,
  }
}
