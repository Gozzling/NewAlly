import { PATCHES, CURRENT_PATCH } from '../data/patches'

export function getPatches() { return PATCHES }
export function getCurrentPatch() { return CURRENT_PATCH }
export function getPatchByVersion(v: string) { return PATCHES.find((p) => p.version === v) }
export function getCompImpact(version: string) {
  const p = getPatchByVersion(version)
  if (!p) return []
  return p.compViability.map((c) => ({ ...c, patch: version }))
}

