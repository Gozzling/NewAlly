/**
 * Parse TFT augment payloads from Overwolf GEP (`augments` feature) and Riot internal ids.
 */

function coerceJsonRecord(raw: unknown): Record<string, unknown> | null {
  if (raw == null) return null;
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : null;
    } catch {
      return null;
    }
  }
  if (typeof raw === "object" && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  return null;
}

function extractAugmentName(entry: unknown): string | null {
  if (typeof entry === "string") {
    const t = entry.trim();
    return t || null;
  }
  if (entry && typeof entry === "object") {
    const o = entry as Record<string, unknown>;
    for (const key of ["name", "displayName", "augmentName", "id", "augment_id"]) {
      const v = o[key];
      if (typeof v === "string" && v.trim()) return v.trim();
    }
  }
  return null;
}

function humanizePascalCase(s: string): string {
  return s
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/(\d+)/g, " $1 ")
    .replace(/\s+/g, " ")
    .trim();
}

/** TFT internal id → readable label (e.g. TFT9_Augment_CyberneticBulk3). */
export function normalizeAugmentDisplayName(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";

  let id = trimmed.replace(/_combo$/i, "");
  if (!id.startsWith("TFT") && !/augment/i.test(id)) {
    return trimmed;
  }

  const afterAugment = id.includes("Augment_") ? id.split("Augment_").pop()! : id.split("_").pop()!;
  const human = humanizePascalCase(afterAugment.replace(/_combo$/i, ""));
  return human || trimmed;
}

export function dedupeAugmentNames(names: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const n of names) {
    const key = n.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(n.trim());
  }
  return out;
}

/** GEP `picked_augment` JSON: slot_1..slot_3 with { name } fields. */
export function parsePickedAugments(raw: unknown): string[] {
  const obj = coerceJsonRecord(raw);
  if (!obj) return [];

  const names: string[] = [];
  const slotKeys = Object.keys(obj)
    .filter((k) => /^slot_\d+$/i.test(k))
    .sort((a, b) => {
      const na = Number(a.replace(/\D/g, "")) || 0;
      const nb = Number(b.replace(/\D/g, "")) || 0;
      return na - nb;
    });

  const keys = slotKeys.length > 0 ? slotKeys : Object.keys(obj).filter((k) => /^augment_\d+$/i.test(k));

  for (const key of keys) {
    const name = extractAugmentName(obj[key]);
    if (name) names.push(normalizeAugmentDisplayName(name));
  }

  return dedupeAugmentNames(names);
}

export function parseAugmentList(raw: unknown): string[] {
  if (raw == null) return [];
  if (Array.isArray(raw)) {
    return dedupeAugmentNames(
      raw.flatMap((item) => {
        const name = extractAugmentName(item) ?? (typeof item === "string" ? item : null);
        return name ? [normalizeAugmentDisplayName(name)] : [];
      }),
    );
  }
  if (typeof raw === "string") {
    const picked = parsePickedAugments(raw);
    if (picked.length > 0) return picked;
    return dedupeAugmentNames(
      raw
        .split(/[,|]/)
        .map((s) => normalizeAugmentDisplayName(s.trim()))
        .filter(Boolean),
    );
  }
  return parsePickedAugments(raw);
}

/** Merge GEP slot updates — keep earlier picks when later slots are still empty. */
export function mergeAugmentSlots(prev: string[], incoming: string[]): string[] {
  const max = Math.max(3, prev.length, incoming.length);
  const merged: string[] = [];
  for (let i = 0; i < max; i++) {
    const next = incoming[i]?.trim();
    const old = prev[i]?.trim();
    if (next) merged.push(next);
    else if (old) merged.push(old);
  }
  return dedupeAugmentNames(merged);
}

/** Extract picked augments from a GEP info blob (`me.picked_augment`, etc.). */
export function parseAugmentsFromGepInfo(info: unknown): string[] {
  if (info == null) return [];
  const root = coerceJsonRecord(info) ?? (typeof info === "object" ? (info as Record<string, unknown>) : null);
  if (!root) return parseAugmentList(info);

  const me = root.me as Record<string, unknown> | undefined;
  const picked = me?.picked_augment ?? root.picked_augment;
  const fromPicked = parsePickedAugments(picked);
  if (fromPicked.length > 0) return fromPicked;

  return parseAugmentList(root.augmentSlots ?? root.augments ?? me?.augmentSlots);
}
