import {
    traitIconUrl as cdnTraitIconUrl,
    augmentIconUrl as cdnAugmentIconUrl,
    itemIconUrl as cdnItemIconUrl
} from "./cdnIcons";
import { resolveUnitIconUrl } from "./resolveUnitIcon";
import { unitIconUrl as localUnitIconUrl, ddragonChampionSquareUrl } from "./unitDisplay";
import { augmentIconUrl as localAugmentIconUrl } from "./augmentDisplay";
import { itemIconUrl as localItemIconUrl } from "./itemDisplay";

export type IconKind = "unit" | "trait" | "augment" | "item";

export function unitPortraitUrls(
  name: string,
  providedUrl?: string | null,
  unit?: { apiName?: string; iconUrl?: string | null },
): string[] {
  const resolved = resolveUnitIconUrl({
    name,
    apiName: unit?.apiName,
    iconUrl: providedUrl ?? unit?.iconUrl,
    id: unit?.id ?? `u_${name}`,
  })
  const list: string[] = [resolved]
  const local = localUnitIconUrl(name)
  if (!list.includes(local)) list.push(local)
  const dd = ddragonChampionSquareUrl(name)
  if (!list.includes(dd)) list.push(dd)
  return list
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
