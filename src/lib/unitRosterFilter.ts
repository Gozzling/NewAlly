/** Community Dragon PVE / encounter units — not shop roster (except Elder Dragon). */
const PVE_API = /^TFT\d+_PVE_/i
/** Timebreaker trait prop (Temporal Core) — not a roster champion. */
const TIMEBREAKER_CORE_API = /^TFT\d+_TimebreakerCore$/i

/** Keep Cosmic Elder Dragon visible; hide other Cosmic PVE minions. */
export function isPlayableRosterUnit(
  apiName: string | undefined | null,
  name?: string | undefined | null,
): boolean {
  const api = String(apiName || "").trim()
  if (!api) return false
  if (TIMEBREAKER_CORE_API.test(api)) return false
  const display = String(name || "").trim()
  if (/timebreaker\s*core/i.test(display)) return false
  if (PVE_API.test(api)) {
    return /_PVE_ElderDragon$/i.test(api)
  }
  return true
}
