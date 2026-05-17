import type { CanonicalMatch } from "@ally/shared-types";
import { lookupAugment, lookupItem, lookupTrait, lookupUnit } from "@/domain/catalog/buildCatalog";
import { augmentIconUrl } from "@/utils/augmentDisplay";

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
    augments: match.augments.map((aug) => {
      const catalog =
        lookupAugment(aug.displayName) ??
        (aug.rawId ? lookupAugment(aug.rawId) : null);
      return {
        ...aug,
        displayName: catalog?.name ?? aug.displayName,
        iconUrl: catalog?.iconUrl ?? aug.iconUrl ?? augmentIconUrl(aug.displayName),
        tier: catalog?.tier ?? aug.tier,
        knownInCatalog: Boolean(catalog),
      };
    }),
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
