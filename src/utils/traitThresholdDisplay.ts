const PLACEHOLDER = /tier bonus \(see trait description\)|^innate \(see description\)$/i

/** When stored data still has Riot/CDN placeholder text, point users to the main trait blurb. */
export function displayThresholdEffect(mainDescription: string, thresholdEffect: string): string {
  if (!PLACEHOLDER.test(thresholdEffect)) return thresholdEffect
  const d = mainDescription.trim()
  if (d.length > 0) {
    return "Bonuses apply at this unit count — see the full trait description at the top of this page."
  }
  return thresholdEffect
}
