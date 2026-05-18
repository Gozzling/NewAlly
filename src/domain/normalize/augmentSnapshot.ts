import type { CanonicalAugmentSlot } from "@ally/shared-types";
import { deriveCanonicalAugmentId } from "@/lib/canonicalAugmentId";
import { getCurrentCatalogVersion } from "@/lib/canonicalDataVersion";
import { resolveAugment } from "@/lib/augmentResolver";
import { normalizeAugmentDisplayName } from "@/shared/augmentParse";

/** Build a version-stamped augment slot from GEP/Riot identifier or display label. */
export function augmentSlotFromIdentifier(
  rawId: string | null,
  displayNameInput?: string,
): CanonicalAugmentSlot {
  const version = getCurrentCatalogVersion();
  const displayName =
    displayNameInput?.trim() ||
    (rawId ? normalizeAugmentDisplayName(rawId) : "") ||
    "";

  const lookupKey = rawId ?? displayName;
  const resolved = lookupKey
    ? resolveAugment(lookupKey, {
        set: version.set,
        patch: version.patch,
        silent: true,
      })
    : null;

  const canonicalId =
    resolved?.canonicalId ??
    (rawId || displayName
      ? deriveCanonicalAugmentId(rawId ?? displayName, version.set)
      : null);

  return {
    rawId,
    displayName: displayName || resolved?.name || rawId || "Unknown Augment",
    canonicalId,
    set: version.set,
    patch: version.patch,
    iconUrl: null,
    tier: resolved?.tier ?? null,
    knownInCatalog: Boolean(resolved),
  };
}
