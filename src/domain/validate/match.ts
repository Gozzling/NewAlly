import type {
  CanonicalMatch,
  RecordValidation,
  ValidationIssue,
} from "@ally/shared-types";
import { COMPLETENESS_WEIGHTS } from "@ally/shared-types";

const EXPECTED_AUGMENTS = 3;

function issue(
  field: string,
  code: string,
  message: string,
  severity: ValidationIssue["severity"],
): ValidationIssue {
  return { field, code, message, severity };
}

function scoreCompleteness(match: CanonicalMatch, issues: ValidationIssue[]): number {
  let score = 0;
  const hasError = issues.some((i) => i.severity === "error");

  if (match.placement != null && match.placement >= 1 && match.placement <= 8) {
    score += COMPLETENESS_WEIGHTS.placement;
  }
  if (match.units.length > 0) score += COMPLETENESS_WEIGHTS.units;
  if (match.augments.length >= EXPECTED_AUGMENTS) {
    score += COMPLETENESS_WEIGHTS.augments;
  } else if (match.augments.length > 0) {
    score += Math.round(COMPLETENESS_WEIGHTS.augments * 0.5);
  }
  const withItems = match.units.filter((u) => u.items.length > 0).length;
  if (withItems > 0) score += COMPLETENESS_WEIGHTS.unitItems;
  if (match.traits.length > 0) score += COMPLETENESS_WEIGHTS.traits;
  if (match.level != null && match.level > 0) score += COMPLETENESS_WEIGHTS.level;
  if (match.compLabel) score += COMPLETENESS_WEIGHTS.compLabel;

  const max = Object.values(COMPLETENESS_WEIGHTS).reduce((a, b) => a + b, 0);
  const pct = Math.round((score / max) * 100);
  return hasError ? Math.min(pct, 49) : pct;
}

export function validateCanonicalMatch(match: CanonicalMatch): RecordValidation {
  const issues: ValidationIssue[] = [];

  if (match.placement == null) {
    issues.push(
      issue("placement", "missing_placement", "Placement is missing.", "error"),
    );
  } else if (match.placement < 1 || match.placement > 8) {
    issues.push(
      issue(
        "placement",
        "invalid_placement",
        `Placement ${match.placement} is out of range.`,
        "warn",
      ),
    );
  }

  if (match.units.length === 0) {
    issues.push(
      issue("units", "missing_units", "No units recorded for this match.", "error"),
    );
  }

  if (match.augments.length === 0) {
    issues.push(
      issue(
        "augments",
        "missing_augments",
        "No augments recorded — picks may not have been captured.",
        match.source === "gep_personal" ? "error" : "warn",
      ),
    );
  } else if (match.augments.length < EXPECTED_AUGMENTS) {
    issues.push(
      issue(
        "augments",
        "incomplete_augments",
        `Only ${match.augments.length}/${EXPECTED_AUGMENTS} augments captured.`,
        "warn",
      ),
    );
  }

  const unitsWithoutItems = match.units.filter((u) => u.items.length === 0).length;
  if (match.units.length > 0 && unitsWithoutItems === match.units.length) {
    issues.push(
      issue(
        "units.items",
        "missing_unit_items",
        "Units have no item data (upgrade client or play with Ally running at match end).",
        match.source === "gep_personal" ? "warn" : "info",
      ),
    );
  }

  if (match.source === "gep_personal" && match.level == null) {
    issues.push(
      issue(
        "level",
        "missing_level",
        "Player level was not captured from GEP.",
        "info",
      ),
    );
  }

  if (match.source === "gep_personal" && match.syncStatus === "failed") {
    issues.push(
      issue(
        "syncStatus",
        "sync_failed",
        "Cloud sync failed — data is local only.",
        "info",
      ),
    );
  }

  if (match.source === "gep_personal" && match.syncStatus === "pending") {
    issues.push(
      issue(
        "syncStatus",
        "sync_pending",
        "Match not synced to cloud yet.",
        "info",
      ),
    );
  }

  const unknownUnits = match.units.filter((u) => !u.knownInCatalog).length;
  if (unknownUnits > 0 && match.units.length > 0) {
    issues.push(
      issue(
        "units",
        "unknown_units",
        `${unknownUnits} unit(s) not in Set catalog — icons may be missing.`,
        "info",
      ),
    );
  }

  const completeness = scoreCompleteness(match, issues);
  const valid = !issues.some((i) => i.severity === "error");

  return { valid, completeness, issues };
}
