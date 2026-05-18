import type {
  AnomalyTriageCategory,
  CondensedInsightGroup,
  PrioritizedFinding,
  TriagedAnomaly,
} from './types'
import { interpretabilityLabelForCategory } from './anomalyTriage'

const CATEGORY_ORDER: (AnomalyTriageCategory | 'finding')[] = [
  'ranking_mismatch',
  'ux_issue',
  'explanation_issue',
  'intent_misalignment',
  'finding',
  'noise',
]

/**
 * Groups triaged anomalies and prioritized findings by interpretability category.
 * Observational only — does not feed scoring or intent layers.
 */
export function condenseInsightsByCategory(
  triaged: TriagedAnomaly[],
  findings: PrioritizedFinding[],
): CondensedInsightGroup[] {
  const byCategory = new Map<AnomalyTriageCategory | 'finding', string[]>()

  for (const t of triaged) {
    if (t.category === 'noise') continue
    const list = byCategory.get(t.category) ?? []
    list.push(`${t.interpretabilityLabel}: ${t.summary}`)
    byCategory.set(t.category, list)
  }

  for (const f of findings) {
    const list = byCategory.get('finding') ?? []
    list.push(f.title)
    byCategory.set('finding', list)
  }

  return CATEGORY_ORDER.filter((cat) => byCategory.has(cat)).map((category) => {
    const items = byCategory.get(category) ?? []
    const interpretabilityLabel =
      category === 'finding'
        ? 'session finding'
        : interpretabilityLabelForCategory(category)
    return {
      category,
      interpretabilityLabel,
      items: [...new Set(items)],
      count: items.length,
    }
  })
}

/**
 * Merges findings with overlapping signal kinds or near-duplicate titles.
 */
export function mergeRelatedFindings(findings: PrioritizedFinding[]): PrioritizedFinding[] {
  if (findings.length <= 1) return findings

  const merged: PrioritizedFinding[] = []
  const absorbed = new Set<string>()

  for (let i = 0; i < findings.length; i++) {
    const a = findings[i]
    if (absorbed.has(a.id)) continue

    const cluster = [a]
    for (let j = i + 1; j < findings.length; j++) {
      const b = findings[j]
      if (absorbed.has(b.id)) continue
      if (findingsOverlap(a, b)) {
        cluster.push(b)
        absorbed.add(b.id)
      }
    }

    if (cluster.length === 1) {
      merged.push(a)
      continue
    }

    const top = cluster.sort((x, y) => y.impactScore - x.impactScore)[0]
    merged.push({
      ...top,
      id: `merged-${top.id}`,
      title: `${top.title} (+${cluster.length - 1} related)`,
      impactScore: Math.max(...cluster.map((c) => c.impactScore)),
      signalKinds: [...new Set(cluster.flatMap((c) => c.signalKinds))],
      relatedSurfaces: [...new Set(cluster.flatMap((c) => c.relatedSurfaces))],
      interpretationHint: top.interpretationHint,
    })
  }

  return merged.sort((a, b) => b.impactScore - a.impactScore)
}

function findingsOverlap(a: PrioritizedFinding, b: PrioritizedFinding): boolean {
  const normA = a.title.toLowerCase().slice(0, 28)
  const normB = b.title.toLowerCase().slice(0, 28)
  if (normA === normB) return true

  const sharedKinds = a.signalKinds.some((k) => b.signalKinds.includes(k))
  const sharedSurfaces = a.relatedSurfaces.some((s) => b.relatedSurfaces.includes(s))
  return sharedKinds && sharedSurfaces && Math.abs(a.impactScore - b.impactScore) < 0.15
}

/**
 * Collapses duplicate or near-duplicate triaged anomalies within a session.
 */
export function reduceRedundantAnomalies(triaged: TriagedAnomaly[]): TriagedAnomaly[] {
  const byKey = new Map<string, TriagedAnomaly>()

  for (const item of triaged) {
    const key = `${item.category}::${item.canonicalId ?? item.summary.slice(0, 48)}`
    const existing = byKey.get(key)
    if (!existing) {
      byKey.set(key, item)
      continue
    }
    if ((item.confidence ?? 0) > (existing.confidence ?? 0)) {
      byKey.set(key, item)
    }
  }

  const categoryCounts = new Map<AnomalyTriageCategory, number>()
  for (const item of byKey.values()) {
    categoryCounts.set(item.category, (categoryCounts.get(item.category) ?? 0) + 1)
  }

  const out: TriagedAnomaly[] = []
  const categoryEmitted = new Map<AnomalyTriageCategory, number>()

  for (const item of byKey.values()) {
    if (item.category === 'noise') {
      out.push(item)
      continue
    }
    const count = categoryCounts.get(item.category) ?? 1
    const emitted = categoryEmitted.get(item.category) ?? 0
    if (count > 3 && emitted >= 2) {
      continue
    }
    categoryEmitted.set(item.category, emitted + 1)
    if (count > 3 && emitted === 1) {
      out.push({
        ...item,
        summary: `${count} similar ${item.interpretabilityLabel} signals this session`,
      })
      continue
    }
    out.push(item)
  }

  return out
}
