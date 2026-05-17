import { AUGMENTS } from "@/data/augments";
import { ITEM_RECIPES } from "@/data/itemRecipes";
import { SYNERGIES } from "@/data/synergies";
import { UNITS } from "@/data/units";
import { augmentIconUrl } from "@/utils/augmentDisplay";
import { itemIconUrl } from "@/utils/itemDisplay";
import { unitIconUrl, unitMatchKey } from "@/utils/unitDisplay";
import type { AugmentTierLabel, UnitMetaTierLabel } from "@ally/shared-types";

export type UnitCatalogEntry = {
  name: string;
  cost: number;
  metaTier: UnitMetaTierLabel;
  traits: string[];
  iconUrl: string;
};

export type AugmentCatalogEntry = {
  id: string;
  name: string;
  tier: AugmentTierLabel;
  iconUrl: string;
};

export type TraitCatalogEntry = {
  rawId: string;
  displayName: string;
};

export type ItemCatalogEntry = {
  name: string;
  components: [string, string] | null;
  iconUrl: string;
};

export type AllyCatalog = {
  unitsByKey: Map<string, UnitCatalogEntry>;
  augmentsByKey: Map<string, AugmentCatalogEntry>;
  traitsByKey: Map<string, TraitCatalogEntry>;
  itemsByKey: Map<string, ItemCatalogEntry>;
};

function traitDisplayName(raw: string): string {
  return raw
    .replace(/^TFT\d+_/i, "")
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .trim();
}

function buildUnitsMap(): Map<string, UnitCatalogEntry> {
  const map = new Map<string, UnitCatalogEntry>();
  for (const u of UNITS) {
    const entry: UnitCatalogEntry = {
      name: u.name,
      cost: u.cost,
      metaTier: u.tier,
      traits: [...u.traits],
      iconUrl: unitIconUrl(u.name),
    };
    map.set(unitMatchKey(u.name), entry);
  }
  return map;
}

function buildAugmentsMap(): Map<string, AugmentCatalogEntry> {
  const map = new Map<string, AugmentCatalogEntry>();
  for (const a of AUGMENTS) {
    const entry: AugmentCatalogEntry = {
      id: a.id,
      name: a.name,
      tier: a.tier,
      iconUrl: augmentIconUrl(a.name),
    };
    map.set(unitMatchKey(a.name), entry);
    map.set(unitMatchKey(a.id), entry);
  }
  return map;
}

function buildTraitsMap(): Map<string, TraitCatalogEntry> {
  const map = new Map<string, TraitCatalogEntry>();
  for (const s of SYNERGIES) {
    const rawId = s.name;
    map.set(unitMatchKey(rawId), {
      rawId,
      displayName: s.name,
    });
  }
  return map;
}

function buildItemsMap(): Map<string, ItemCatalogEntry> {
  const map = new Map<string, ItemCatalogEntry>();
  for (const name of Object.keys(ITEM_RECIPES)) {
    const recipe = ITEM_RECIPES[name];
    map.set(unitMatchKey(name), {
      name,
      components: recipe ?? null,
      iconUrl: itemIconUrl(name),
    });
  }
  return map;
}

let cachedCatalog: AllyCatalog | null = null;

export function getAllyCatalog(): AllyCatalog {
  if (!cachedCatalog) {
    cachedCatalog = {
      unitsByKey: buildUnitsMap(),
      augmentsByKey: buildAugmentsMap(),
      traitsByKey: buildTraitsMap(),
      itemsByKey: buildItemsMap(),
    };
  }
  return cachedCatalog;
}

export function lookupUnit(name: string): UnitCatalogEntry | null {
  return getAllyCatalog().unitsByKey.get(unitMatchKey(name)) ?? null;
}

export function lookupAugment(nameOrId: string): AugmentCatalogEntry | null {
  const key = unitMatchKey(nameOrId);
  return getAllyCatalog().augmentsByKey.get(key) ?? null;
}

export function lookupTrait(rawId: string): TraitCatalogEntry & { knownInCatalog: boolean } {
  const key = unitMatchKey(rawId);
  const hit = getAllyCatalog().traitsByKey.get(key);
  if (hit) return { ...hit, knownInCatalog: true };
  return {
    rawId,
    displayName: traitDisplayName(rawId),
    knownInCatalog: false,
  };
}

export function lookupItem(name: string): ItemCatalogEntry | null {
  return getAllyCatalog().itemsByKey.get(unitMatchKey(name)) ?? null;
}

/** Resolve catalog unit list for unknown champion strings. */
export function inferUnitFromName(name: string): UnitCatalogEntry | null {
  return lookupUnit(name);
}
