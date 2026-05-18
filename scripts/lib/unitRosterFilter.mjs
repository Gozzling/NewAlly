/** @see src/lib/unitRosterFilter.ts */
export function isPlayableRosterUnit(apiName, name) {
  const api = String(apiName || "").trim()
  if (!api) return false
  if (/^TFT\d+_TimebreakerCore$/i.test(api)) return false
  const display = String(name || "").trim()
  if (/timebreaker\s*core/i.test(display)) return false
  if (/^TFT\d+_PVE_/i.test(api)) {
    return /_PVE_ElderDragon$/i.test(api)
  }
  return true
}
