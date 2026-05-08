/**
 * TFT traits (origins / classes) for Set 17 — values come from Riot TFT game data
 * (Community Dragon tfttraits.json), not League of Legends Summoner's Rift.
 *
 * Regenerate: `npm run data:tft-riot-sync`
 */
export interface Synergy {
  id: string
  name: string
  description: string
  thresholds: Array<{ count: number; effect: string }>
  bestUnits: string[]
  bestComps: string[]
  counters: string[]
  type: "offense" | "defense" | "utility" | "hybrid"
}

import { SYNERGIES_FROM_RIOT_DATA } from "./tftFromRiot.generated"

export const SYNERGIES: Synergy[] =
  SYNERGIES_FROM_RIOT_DATA as unknown as Synergy[]
