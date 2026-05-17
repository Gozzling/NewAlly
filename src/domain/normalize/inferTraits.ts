import type { CanonicalTraitSlot } from "@ally/shared-types";
import { lookupUnit } from "@/domain/catalog/buildCatalog";
import { unitMatchKey } from "@/utils/unitDisplay";

/** Count active traits from board unit names using the set unit catalog. */
export function inferTraitsFromUnitNames(unitNames: string[]): CanonicalTraitSlot[] {
  const counts = new Map<string, { displayName: string; numUnits: number }>();

  for (const rawName of unitNames) {
    const name = rawName.trim();
    if (!name) continue;
    const catalog = lookupUnit(name);
    const traits = catalog?.traits ?? [];
    for (const trait of traits) {
      const key = unitMatchKey(trait);
      const prev = counts.get(key);
      counts.set(key, {
        displayName: trait,
        numUnits: (prev?.numUnits ?? 0) + 1,
      });
    }
  }

  return [...counts.values()]
    .sort((a, b) => b.numUnits - a.numUnits)
    .map(({ displayName, numUnits }) => ({
      rawId: displayName,
      displayName,
      numUnits,
      tierCurrent: 0,
      tierTotal: 0,
      knownInCatalog: false,
    }));
}

/** Map legacy trait name list (no counts) into canonical slots. */
export function legacyTraitNamesToSlots(names: string[]): CanonicalTraitSlot[] {
  return names
    .map((name) => name.trim())
    .filter(Boolean)
    .map((rawId) => ({
      rawId,
      displayName: rawId,
      numUnits: 1,
      tierCurrent: 0,
      tierTotal: 0,
      knownInCatalog: false,
    }));
}
