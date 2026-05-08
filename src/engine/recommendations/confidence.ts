/** Confidence helpers — deterministic, testable scoring. */

export function clamp01(x: number): number {
  if (Number.isNaN(x)) return 0;
  return Math.min(1, Math.max(0, x));
}

export function combineEvidenceWeighted(parts: { score: number; weight: number }[]): number {
  let wSum = 0;
  let acc = 0;
  for (const p of parts) {
    if (p.weight <= 0) continue;
    acc += clamp01(p.score) * p.weight;
    wSum += p.weight;
  }
  if (wSum <= 0) return 0.5;
  return clamp01(acc / wSum);
}
