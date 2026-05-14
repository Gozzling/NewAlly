import {
    traitIconUrl as cdnTraitIconUrl,
    augmentIconUrl as cdnAugmentIconUrl,
    itemIconUrl as cdnItemIconUrl
} from "./cdnIcons";
import { unitIconUrl as localUnitIconUrl, ddragonChampionSquareUrl } from "./unitDisplay";
import { augmentIconUrl as localAugmentIconUrl } from "./augmentDisplay";
import { itemIconUrl as localItemIconUrl } from "./itemDisplay";

export type IconKind = "unit" | "trait" | "augment" | "item";

export function unitPortraitUrls(name: string, providedUrl?: string | null): string[] {
  const list: string[] = [];
  if (providedUrl) list.push(providedUrl);
  list.push(localUnitIconUrl(name));
  list.push(ddragonChampionSquareUrl(name));
  return list;
}

export function augmentPortraitUrls(name: string, providedUrl?: string | null): string[] {
  const list: string[] = [];
  if (providedUrl) list.push(providedUrl);
  list.push(localAugmentIconUrl(name));
  list.push(cdnAugmentIconUrl(name));
  return list;
}

export function itemPortraitUrls(name: string, providedUrl?: string | null, iconSlug?: string): string[] {
  const list: string[] = [];
  if (providedUrl) list.push(providedUrl);
  list.push(localItemIconUrl(name, iconSlug));
  list.push(cdnItemIconUrl(name, iconSlug));
  return list;
}

export function traitPortraitUrls(name: string, providedUrl?: string | null): string[] {
    const list: string[] = [];
    if (providedUrl) list.push(providedUrl);
    list.push(cdnTraitIconUrl(name));
    return list;
}
