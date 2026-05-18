import type { CanonicalMatch } from "@ally/shared-types";
import { enrichAugmentSlot } from "@/lib/augmentResolver";
import { lookupItem, lookupTrait, lookupUnit } from "@/domain/catalog/buildCatalog";

export function enrichCanonicalMatch(match: CanonicalMatch): CanonicalMatch {
  return {
    ...match,
    units: match.units.map((unit) => {
      const catalog = lookupUnit(unit.name);
      return {
        ...unit,
        displayName: catalog?.name ?? unit.displayName,
        iconUrl: catalog?.iconUrl ?? unit.iconUrl,
        cost: catalog?.cost ?? unit.cost,
        metaTier: catalog?.metaTier ?? unit.metaTier,
        traits: catalog?.traits.length ? catalog.traits : unit.traits,
        knownInCatalog: Boolean(catalog),
        items: unit.items.map((item) => {
          const itemCat = lookupItem(item.name) ?? lookupItem(item.displayName);
          return {
            ...item,
            displayName: itemCat?.name ?? item.displayName,
            iconUrl: itemCat?.iconUrl ?? item.iconUrl,
            components: itemCat?.components ?? item.components,
            knownInCatalog: Boolean(itemCat),
          };
        }),
      };
    }),
    augments: match.augments.map((aug) =>
      enrichAugmentSlot(aug, {
        set: aug.set ?? undefined,
        patch: aug.patch ?? undefined,
      }),
    ),
    traits: match.traits.map((trait) => {
      const catalog = lookupTrait(trait.rawId);
      return {
        ...trait,
        displayName: catalog.displayName,
        knownInCatalog: catalog.knownInCatalog,
      };
    }),
  };
}
