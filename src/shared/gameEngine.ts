import type {
  RosterPlayer, BoardState, BoardUnit,
  ActiveCompTracker, ItemTracker, CraftableItem, MissingItem,
  MetaComp, ItemRecipes,
} from '../types/tft'
import { UNITS } from '../data/units'
import { unitMatchKey } from '../utils/unitDisplay'

// ─── Normalizers ──────────────────────────────────────────────────────────────

export function normalizeChampionId(rawId: string): string {
  if (!rawId.startsWith('TFT')) return rawId
  return rawId.split('_').at(-1) ?? rawId
}

export function normalizeItemId(rawId: string): string {
  if (!rawId.startsWith('TFT')) return rawId
  return rawId.split('_').at(-1) ?? rawId
}

// ─── Parsers ──────────────────────────────────────────────────────────────────

export function parseRoster(infoRoster: unknown): RosterPlayer[] {
  try {
    const raw = (infoRoster as Record<string, unknown>)?.player_status
    if (raw == null) return []
    const players = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (!Array.isArray(players)) return []
    return (players as Record<string, unknown>[])
      .map((p) => ({
        name:          String(p.name ?? 'Unknown'),
        health:        Number(p.health) || 0,
        isLocalPlayer: Boolean(p.localplayer),
        isEliminated:  Boolean(p.eliminated),
        rank:          Number(p.rank) || 0,
      }))
      .sort((a, b) => b.health - a.health)
  } catch (e) {
    console.error('[GE] Roster parse error:', e)
    return []
  }
}

export function parseBoard(infoBoard: unknown): BoardState {
  const empty: BoardState = { units: [], grid: {} }
  try {
    const info = infoBoard as Record<string, unknown> | undefined
    const raw = info?.board_piece ?? info?.board_pieces ?? info?.units ?? info?.board
    if (raw == null) return empty
    const pieces = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (!Array.isArray(pieces)) return empty

    const units: BoardUnit[] = []
    const grid: Record<string, BoardUnit> = {}

    for (const piece of pieces as Record<string, unknown>[]) {
      const location = String(piece.location ?? 'board')
      const idx      = Number(piece.board_index) || 0
      const x        = idx % 7
      const y        = Math.floor(idx / 7)
      const items    = Array.isArray(piece.items)
        ? (piece.items as string[]).map(normalizeItemId)
        : []

      const unit: BoardUnit = {
        name:       String(piece.display_name ?? piece.name ?? 'Unknown'),
        boardIndex: idx,
        x, y,
        starLevel:  Number(piece.level) || 1,
        items,
        location,
      }

      if (location === 'board') {
        units.push(unit)
        grid[`${x},${y}`] = unit
      }
    }

    return { units, grid }
  } catch (e) {
    console.error('[GE] Board parse error:', e)
    return empty
  }
}

export function parseBenchComponents(infoItems: unknown): string[] {
  try {
    const info = infoItems as Record<string, unknown>
    const raw  = info?.player_items ?? info?.item_list
    if (raw == null) return []
    const list = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (!Array.isArray(list)) return []
    return (list as unknown[]).map((item) => normalizeItemId(String(item))).filter(Boolean)
  } catch (e) {
    console.error('[GE] Bench components parse error:', e)
    return []
  }
}

// ─── Matchers ─────────────────────────────────────────────────────────────────

export function calculateBestCompMatch(
  boardUnits: BoardUnit[],
  metaComps: MetaComp[],
): ActiveCompTracker {
  const empty: ActiveCompTracker = { bestMatchName: null, matchPercentage: 0, missingUnits: [] }
  if (boardUnits.length === 0 || metaComps.length === 0) return empty

  const onBoard = new Set(boardUnits.map((u) => unitMatchKey(normalizeChampionId(u.name))))

  let best: ActiveCompTracker | null = null
  for (const comp of metaComps) {
    const matchCount = comp.requiredUnits.filter((u) => onBoard.has(unitMatchKey(u))).length
    const pct        = Math.round((matchCount / comp.requiredUnits.length) * 100)
    if (!best || pct > best.matchPercentage) {
      best = {
        bestMatchName:   comp.compName,
        matchPercentage: pct,
        missingUnits:    comp.requiredUnits.filter((u) => !onBoard.has(unitMatchKey(u))),
      }
    }
  }
  return best ?? empty
}

export function detectCompFromUnits(units: string[]): string {
  if (!units.length) return 'Mixed'

  const normalized = units.map((u) => unitMatchKey(normalizeChampionId(u)))
  const traitCounts: Record<string, number> = {}

  for (const unitName of normalized) {
    const unit = UNITS.find((x) => unitMatchKey(x.name) === unitName)
    if (!unit) continue
    for (const trait of unit.traits) {
      traitCounts[trait] = (traitCounts[trait] ?? 0) + 1
    }
  }

  const topTraits = Object.entries(traitCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([name]) => name)

  if (topTraits.length === 0) {
    return units.slice(0, 3).join(' / ') || 'Mixed'
  }

  return topTraits.join(' / ')
}

export function calculateItemCrafting(
  bestMatchName: string | null,
  boardUnits: BoardUnit[],
  benchComponents: string[],
  metaComps: MetaComp[],
  itemRecipes: ItemRecipes,
): ItemTracker {
  const empty: ItemTracker = { craftable: [], missing: [] }
  if (!bestMatchName) return empty

  const comp = metaComps.find((c) => c.compName === bestMatchName)
  if (!comp?.carries?.length) return empty

  const inventory: Record<string, number> = {}
  for (const component of benchComponents) {
    const key = component.toLowerCase()
    inventory[key] = (inventory[key] ?? 0) + 1
  }

  const craftable: CraftableItem[] = []
  const missing: MissingItem[]     = []

  for (const carry of comp.carries) {
    const boardUnit = boardUnits.find(
      (u) => unitMatchKey(normalizeChampionId(u.name)) === unitMatchKey(carry.name),
    )
    const equipped = new Set((boardUnit?.items ?? []).map((i) => i.toLowerCase()))

    for (const bisItem of carry.bisItems) {
      if (equipped.has(bisItem.toLowerCase())) continue

      const recipe = itemRecipes[bisItem]
      if (!recipe) continue

      const [c1, c2] = recipe.map((c) => c.toLowerCase()) as [string, string]
      const same     = c1 === c2
      const inv1     = inventory[c1] ?? 0
      const inv2     = inventory[c2] ?? 0
      const canCraft = same ? inv1 >= 2 : inv1 >= 1 && inv2 >= 1

      if (canCraft) {
        craftable.push({ item: bisItem, carry: carry.name, recipe })
        inventory[c1]--
        if (!same) inventory[c2]--
      } else {
        const missingComponents: string[] = []
        if (same) {
          for (let i = inv1; i < 2; i++) missingComponents.push(recipe[0])
        } else {
          if (inv1 < 1) missingComponents.push(recipe[0])
          if (inv2 < 1) missingComponents.push(recipe[1])
        }
        missing.push({ item: bisItem, carry: carry.name, missingComponents })
      }
    }
  }

  return { craftable, missing }
}
