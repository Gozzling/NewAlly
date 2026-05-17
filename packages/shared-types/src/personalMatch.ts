/** Per-champion build snapshot at match end (GEP board). */
export interface PersonalMatchUnitBuild {
  name: string;
  items: string[];
  starLevel?: number;
}

/** Aggregated comp line derived from cached personal matches. */
export interface PersonalTopComp {
  compKey: string;
  displayName: string;
  games: number;
  weightedGames: number;
  avgPlacement: number;
  top4Rate: number;
  winRate: number;
  score: number;
  coreUnits: Array<{ name: string; rate: number }>;
  /** Carries with item trends when unit-level builds were recorded. */
  itemBuilds: Array<{
    unit: string;
    items: Array<{ name: string; rate: number }>;
  }>;
  lastPlayedAt: number;
}
