import type { PersonalMatchIpcRecord } from "@ally/shared-types";

export function isPersonalMatchIpcRecord(raw: unknown): raw is PersonalMatchIpcRecord {
  if (!raw || typeof raw !== "object") return false;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== "string" || typeof r.createdAt !== "number") return false;
  if (r.placement != null && typeof r.placement !== "number") return false;
  if (r.units != null && !Array.isArray(r.units)) return false;
  if (r.items != null && !Array.isArray(r.items)) return false;
  if (r.augments != null && !Array.isArray(r.augments)) return false;
  if (r.unitBuilds != null) {
    if (!Array.isArray(r.unitBuilds)) return false;
    for (const u of r.unitBuilds) {
      if (!u || typeof u !== "object") return false;
      const ub = u as Record<string, unknown>;
      if (typeof ub.name !== "string" || !Array.isArray(ub.items)) return false;
    }
  }
  return true;
}
