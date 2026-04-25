export interface RosterPlayer {
  name: string
  health: number
  isLocalPlayer: boolean
  isEliminated: boolean
  rank: number
}

export interface BoardUnit {
  name: string
  boardIndex: number
  x: number
  y: number
  starLevel: number
  items: string[]
  location: string
}

export interface BoardState {
  units: BoardUnit[]
  grid: Record<string, BoardUnit>
}

export interface ActiveCompTracker {
  bestMatchName: string | null
  matchPercentage: number
  missingUnits: string[]
}

export interface CraftableItem {
  item: string
  carry: string
  recipe: [string, string]
}

export interface MissingItem {
  item: string
  carry: string
  missingComponents: string[]
}

export interface ItemTracker {
  craftable: CraftableItem[]
  missing: MissingItem[]
}

export interface TftGameState {
  isInGame: boolean
  round_type: string | null
  gold: number | null
  shop_visible: boolean
  roster: RosterPlayer[]
  board: BoardState
  activeCompTracker: ActiveCompTracker
  benchComponents: string[]
  itemTracker: ItemTracker
  augmentSlots: string[]
  shopUnits: string[]
  raw: Record<string, unknown>
}

export interface MetaCarry {
  name: string
  bisItems: string[]
}

export interface MetaComp {
  compName: string
  requiredUnits: string[]
  carries: MetaCarry[]
}

export type ItemRecipes = Record<string, [string, string]>

