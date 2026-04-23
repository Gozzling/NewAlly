import type { ActiveCompTracker } from '../../types/tft'

interface Props { tracker: ActiveCompTracker }

export function CompTracker({ tracker }: Props) {
  return (
    <div className="bg-black/70 border border-neutral-700 p-2 min-w-[200px]">
      <h3 className="text-[10px] uppercase tracking-widest text-neutral-500 mb-1.5">Best Comp Match</h3>
      <div className="text-[13px] font-bold text-blue-300 mb-1">{tracker.bestMatchName ?? '–'}</div>
      <div className="text-[11px] text-neutral-400 mb-2">{tracker.matchPercentage}% matched</div>
      <div className="text-[10px] uppercase tracking-widest text-neutral-600 mb-1">Missing</div>
      <div className="flex flex-wrap gap-1">
        {tracker.missingUnits.map((unit) => (
          <span
            key={unit}
            className="bg-red-950/40 border border-red-900/50 text-red-400 text-[10px] px-1.5 py-0.5 rounded-sm"
          >
            {unit}
          </span>
        ))}
      </div>
    </div>
  )
}
