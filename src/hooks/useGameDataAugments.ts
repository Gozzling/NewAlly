import { useMemo } from 'react'
import { listCanonicalAugments } from '@/lib/augmentResolver'
import { fromStoreAugment, toGuideAugment, type GuideAugment } from '@/lib/augmentProjections'
import { useAppStore } from '@/store/useAppStore'

/**
 * Augment Guide list: prefer live CDN rows from gameData (icons + descriptions),
 * fall back to canonical catalog when store is empty.
 */
export function useGameDataAugments(): GuideAugment[] {
  const augments = useAppStore((s) => s.gameData.augments)
  const lastUpdated = useAppStore((s) => s.gameData.lastUpdated)

  return useMemo(() => {
    if (augments.length > 0) {
      return augments.map(fromStoreAugment).sort((a, b) => a.name.localeCompare(b.name))
    }
    return listCanonicalAugments().map(toGuideAugment)
  }, [augments, lastUpdated])
}
