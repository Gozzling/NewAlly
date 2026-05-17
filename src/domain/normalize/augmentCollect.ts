import type { PersonalMatchRecord } from "@/services/indexedDbService";
import {
  mergeAugmentSlots,
  parseAugmentList,
  parseAugmentsFromGepInfo,
} from "@/shared/augmentParse";

/** Collect augment display names from a stored personal row (all sources). */
export function collectMatchAugmentsFromRecord(record: PersonalMatchRecord): string[] {
  const buckets = [
    parseAugmentList(record.augments),
    parseAugmentsFromGepInfo(record.raw?.augments),
    parseAugmentsFromGepInfo(record.raw?.active_player),
    parseAugmentsFromGepInfo(record.raw?.augmentSlots),
    parseAugmentList(record.raw?.augmentSlots),
    parseAugmentsFromGepInfo(record.raw?.eventData),
  ];
  let merged: string[] = [];
  for (const bucket of buckets) {
    if (bucket.length > 0) merged = mergeAugmentSlots(merged, bucket);
  }
  return merged;
}
