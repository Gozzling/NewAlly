import type { CanonicalItemSlot, CanonicalUnitSlot } from "@ally/shared-types";
import { lookupUnit } from "@/domain/catalog/buildCatalog";
import { normalizeChampionId, normalizeItemId } from "@/shared/gameEngine";

export type UnitBuildInput = {
  name: string;
  starLevel?: number | null;
  items?: string[];
};

export function toCanonicalUnitSlots(builds: UnitBuildInput[]): CanonicalUnitSlot[] {
  return builds.map((u) => {
    const name = normalizeChampionId(u.name.trim());
    const catalog = lookupUnit(name);
    const items: CanonicalItemSlot[] = (u.items ?? [])
      .map((raw) => raw.trim())
      .filter(Boolean)
      .map((raw) => {
        const displayName = normalizeItemId(raw);
        return {
          name: displayName,
          displayName,
          iconUrl: null,
          components: null,
          knownInCatalog: false,
        };
      });

    return {
      name,
      displayName: catalog?.name ?? name,
      iconUrl: null,
      cost: catalog?.cost ?? null,
      metaTier: catalog?.metaTier ?? null,
      starLevel: u.starLevel ?? null,
      traits: catalog?.traits ? [...catalog.traits] : [],
      items,
      knownInCatalog: Boolean(catalog),
    };
  });
}
