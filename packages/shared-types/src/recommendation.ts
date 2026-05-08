/**
 * Ally Coach recommendation contract — same shape for GEP-only, static-meta, or future OCR inputs.
 */

export type RiskLevel = "low" | "medium" | "high";

export type UrgencyLevel = "low" | "medium" | "high";

export type RecommendationCategory =
  | "economy"
  | "shop"
  | "items"
  | "augments"
  | "board"
  | "meta"
  | "scouting";

export type RecommendationEvidenceSource = "gep" | "static_meta" | "match_history" | "heuristic";

export interface RecommendationEvidence {
  source: RecommendationEvidenceSource;
  /** Relative weight in [0, 1] before normalization. */
  weight: number;
  note: string;
}

/** Single coaching recommendation (overlay / desktop). */
export interface AllyRecommendation {
  id: string;
  category: RecommendationCategory;
  title: string;
  detail: string;
  /** Model confidence in [0, 1]. */
  confidence: number;
  risk: RiskLevel;
  urgency: UrgencyLevel;
  reasoning: string[];
  evidence: RecommendationEvidence[];
  createdAtMs: number;
  payload?: Record<string, unknown>;
}

/** Normalized game signals — produced from live state (GEP and/or vision). */
export interface NormalizedGameSignals {
  inGame: boolean;
  roundType: string | null;
  gold: number | null;
  boardUnitNames: string[];
  shopUnitNames: string[];
  benchComponentCount: number;
  activeCompName: string | null;
  compMatchPercent: number;
  missingUnitsForComp: string[];
  augmentNames: string[];
  localPlayerHealth: number | null;
  itemCraftableCount: number;
  itemMissingCount: number;
  /** Optional lines derived from item tracker (GEP); vision can populate later. */
  craftableLabels?: string[];
  missingLabels?: string[];
  /** BIS items where at least one recipe component is already owned (one piece away from slam). */
  partialItemBuildLabels?: string[];
}

/** Aggregated stats from recent personal matches (IndexedDB / sync). */
export interface PlayerMatchHistorySummary {
  windowSize: number;
  avgPlacement: number | null;
  top4Rate: number | null;
  favoriteComp: string | null;
  compFrequency: Record<string, number>;
}

/** Full input to the recommendation pass (capture-agnostic). */
export interface RecommendationEngineInput {
  signals: NormalizedGameSignals;
  matchHistory: PlayerMatchHistorySummary;
  /** e.g. set patch label from static data when available */
  staticMetaVersion: string;
}
