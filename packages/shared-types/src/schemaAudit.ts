/**
 * Schema audit: raw source fields vs canonical coverage.
 * Update when adding sources or canonical fields.
 */
export type FieldCoverage = "captured" | "normalized" | "enriched" | "missing" | "not_applicable";

export interface SchemaFieldAudit {
  field: string;
  gepPersonal: FieldCoverage;
  riotApi: FieldCoverage;
  canonical: FieldCoverage;
  notes?: string;
}

export const SCHEMA_FIELD_AUDIT: SchemaFieldAudit[] = [
  {
    field: "placement",
    gepPersonal: "captured",
    riotApi: "normalized",
    canonical: "normalized",
    notes: "GEP uses local roster rank at match_end",
  },
  {
    field: "level",
    gepPersonal: "missing",
    riotApi: "normalized",
    canonical: "normalized",
    notes: "Not in GEP personal snapshot today",
  },
  {
    field: "units[].name",
    gepPersonal: "captured",
    riotApi: "normalized",
    canonical: "normalized",
  },
  {
    field: "units[].starLevel",
    gepPersonal: "captured",
    riotApi: "normalized",
    canonical: "normalized",
    notes: "GEP via unitBuilds; Riot via unit.tier",
  },
  {
    field: "units[].items[]",
    gepPersonal: "captured",
    riotApi: "normalized",
    canonical: "normalized",
    notes: "GEP unitBuilds; Riot itemNames",
  },
  {
    field: "units[].iconUrl",
    gepPersonal: "missing",
    riotApi: "missing",
    canonical: "enriched",
    notes: "Backfilled from unit catalog",
  },
  {
    field: "units[].cost / metaTier",
    gepPersonal: "missing",
    riotApi: "missing",
    canonical: "enriched",
    notes: "From data/units.ts catalog",
  },
  {
    field: "units[].traits",
    gepPersonal: "missing",
    riotApi: "missing",
    canonical: "enriched",
    notes: "Inferred from unit catalog",
  },
  {
    field: "augments[]",
    gepPersonal: "captured",
    riotApi: "normalized",
    canonical: "normalized",
    notes: "GEP augments feature + merge at match_end",
  },
  {
    field: "augments[].tier / iconUrl",
    gepPersonal: "missing",
    riotApi: "missing",
    canonical: "enriched",
    notes: "From data/augments.ts catalog",
  },
  {
    field: "traits[] (breakpoints)",
    gepPersonal: "normalized",
    riotApi: "normalized",
    canonical: "normalized",
    notes: "GEP inferred from unit catalog; Riot from participant.traits",
  },
  {
    field: "traits[].displayName",
    gepPersonal: "missing",
    riotApi: "missing",
    canonical: "enriched",
  },
  {
    field: "items[].components",
    gepPersonal: "missing",
    riotApi: "missing",
    canonical: "enriched",
    notes: "From itemRecipes.json",
  },
  {
    field: "compLabel",
    gepPersonal: "captured",
    riotApi: "normalized",
    canonical: "normalized",
  },
  {
    field: "lpChange",
    gepPersonal: "not_applicable",
    riotApi: "missing",
    canonical: "missing",
    notes: "MatchHistory still estimates LP client-side",
  },
  {
    field: "raw (debug)",
    gepPersonal: "captured",
    riotApi: "not_applicable",
    canonical: "missing",
    notes: "Stripped at normalization boundary",
  },
];

/** Fields required for `valid: true` in validation. */
export const REQUIRED_CANONICAL_FIELDS = [
  "placement",
  "units",
  "playedAt",
] as const;

/** Fields that contribute to completeness score. */
export const COMPLETENESS_WEIGHTS: Record<string, number> = {
  placement: 20,
  units: 20,
  augments: 25,
  unitItems: 15,
  traits: 10,
  level: 5,
  compLabel: 5,
};
