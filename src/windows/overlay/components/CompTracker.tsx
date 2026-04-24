import type { ActiveCompTracker } from '@/types/tft'

interface Props { tracker: ActiveCompTracker }

export function CompTracker({ tracker }: Props) {
  return (
    <div className="bg-ally-bg/70 border border-ally-border p-2 min-w-[200px]">
      <h3 className="text-[10px] uppercase tracking-widest text-ally-muted mb-1.5">Best Comp Match</h3>
      <div className="text-[13px] font-bold text-ally-accent mb-1">{tracker.bestMatchName ?? '–'}</div>
      <div className="text-[11px] text-ally-muted mb-2">{tracker.matchPercentage}% matched</div>
      <div className="text-[10px] uppercase tracking-widest text-ally-muted mb-1">Missing</div>
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
