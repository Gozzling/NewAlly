/**
 * Confidence decay as entity/relationship data ages across patches.
 * Patch strings are compared numerically when possible (e.g. "17.1" vs "17.2").
 */

function parsePatchMajorMinor(patch: string): { major: number; minor: number } | null {
  const m = patch.trim().match(/^(\d+)\.(\d+)/)
  if (!m) return null
  return { major: Number(m[1]), minor: Number(m[2]) }
}

export function patchDistance(entityPatch: string | undefined, currentPatch: string | undefined): number {
  if (!entityPatch || !currentPatch) return 0
  if (entityPatch === currentPatch) return 0

  const a = parsePatchMajorMinor(entityPatch)
  const b = parsePatchMajorMinor(currentPatch)
  if (!a || !b) return entityPatch === currentPatch ? 0 : 1

  if (a.major !== b.major) return Math.abs(a.major - b.major) + 2
  return Math.abs(a.minor - b.minor)
}

/** Multiplier in (decayFloor, 1] — older patches reduce effective confidence. */
export function confidenceDecayForPatch(
  entityPatch: string | undefined,
  currentPatch: string | undefined,
  options?: { decayPerPatch?: number; decayFloor?: number },
): number {
  const distance = patchDistance(entityPatch, currentPatch)
  if (distance === 0) return 1

  const decayPerPatch = options?.decayPerPatch ?? 0.12
  const decayFloor = options?.decayFloor ?? 0.45
  return Math.max(decayFloor, 1 - distance * decayPerPatch)
}
