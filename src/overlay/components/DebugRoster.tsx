import type { RosterPlayer } from '../../types/tft'

interface Props { roster: RosterPlayer[] }

export function DebugRoster({ roster }: Props) {
  return (
    <div className="bg-black/70 border border-neutral-700 p-2 min-w-[200px]">
      <h3 className="text-[10px] uppercase tracking-widest text-neutral-500 mb-1.5">Players (HP)</h3>
      {roster.map((p) => (
        <div
          key={p.name}
          className={`flex justify-between border-b border-neutral-800 py-0.5 last:border-0 ${
            p.isEliminated
              ? 'text-neutral-600 line-through'
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
