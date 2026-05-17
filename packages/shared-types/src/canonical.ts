/** Where a canonical match row originated. */
export type MatchSource = "gep_personal" | "riot_api";

export type AugmentTierLabel = "prismatic" | "gold" | "silver";

export type UnitMetaTierLabel = "S" | "A" | "B" | "C" | "D";

/** Normalized item on a board unit. */
export interface CanonicalItemSlot {
  name: string;
  displayName: string;
  iconUrl: string | null;
  components: string[] | null;
  knownInCatalog: boolean;
}

/** Normalized board unit. */
export interface CanonicalUnitSlot {
  name: string;
  displayName: string;
  iconUrl: string | null;
  cost: number | null;
  metaTier: UnitMetaTierLabel | null;
  starLevel: number | null;
  traits: string[];
  items: CanonicalItemSlot[];
  knownInCatalog: boolean;
}

/** Normalized augment pick. */
export interface CanonicalAugmentSlot {
  rawId: string | null;
  displayName: string;
  iconUrl: string | null;
  tier: AugmentTierLabel | null;
  knownInCatalog: boolean;
}

/** Active trait line on the board. */
export interface CanonicalTraitSlot {
  rawId: string;
  displayName: string;
  numUnits: number;
  tierCurrent: number;
  tierTotal: number;
  knownInCatalog: boolean;
}

/**
 * App-wide match shape for UI, analytics, and sync.
 * Produced only via the domain normalization + enrichment pipeline.
 */
export interface CanonicalMatch {
  id: string;
  source: MatchSource;
  placement: number | null;
  level: number | null;
  playedAt: number;
  gameLengthSec: number | null;
  gameType: string | null;
  compLabel: string | null;
  summonerName: string | null;
  region: string | null;
  units: CanonicalUnitSlot[];
  augments: CanonicalAugmentSlot[];
  traits: CanonicalTraitSlot[];
  syncStatus?: "pending" | "synced" | "failed";
}

export type ValidationSeverity = "error" | "warn" | "info";

export interface ValidationIssue {
  field: string;
  code: string;
  message: string;
  severity: ValidationSeverity;
}

/** Result of validating a canonical match before UI display. */
export interface RecordValidation {
  /** No `error`-severity issues. */
  valid: boolean;
  /** 0–100 completeness score for UI badges. */
  completeness: number;
  issues: ValidationIssue[];
}

/** Canonical match + validation — sole shape pages should consume. */
export interface EnrichedMatch {
  match: CanonicalMatch;
  validation: RecordValidation;
}
