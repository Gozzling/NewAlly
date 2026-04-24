import type { RosterPlayer } from '@/types/tft'

interface Props { roster: RosterPlayer[] }

export function DebugRoster({ roster }: Props) {
  return (
    <div className="bg-ally-bg/70 border border-ally-border p-2 min-w-[200px]">
      <h3 className="text-[10px] uppercase tracking-widest text-ally-muted mb-1.5">Players (HP)</h3>
      {roster.map((p) => (
        <div
          key={p.name}
          className={`flex justify-between border-b border-ally-border py-0.5 last:border-0 ${
            p.isEliminated
              ? 'text-ally-muted line-through'
              : p.isLocalPlayer
                ? 'text-yellow-300'
                : ''
          }`}
        >
          <span className="truncate max-w-[140px]">{p.name}</span>
          <span className="ml-3 tabular-nums">{p.health}</span>
        </div>
      ))}
    </div>
  )
}
