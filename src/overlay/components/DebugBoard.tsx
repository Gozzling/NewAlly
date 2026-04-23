import type { BoardState } from '../../types/tft'

const STARS = ['', '★', '★★', '★★★'] as const
const COLS  = 7
const ROWS  = 4

interface Props { board: BoardState }

export function DebugBoard({ board }: Props) {
  return (
    <div className="bg-black/70 border border-neutral-700 p-2">
      <h3 className="text-[10px] uppercase tracking-widest text-neutral-500 mb-1.5">Board</h3>
      <div
        className="grid gap-0.5"
        style={{ gridTemplateColumns: `repeat(${COLS}, 64px)`, gridTemplateRows: `repeat(${ROWS}, 44px)` }}
      >
        {Array.from({ length: ROWS }, (_, y) =>
          Array.from({ length: COLS }, (_, x) => {
            const unit = board.grid[`${x},${y}`]
            return (
              <div
                key={`${x}-${y}`}
                className={`border p-0.5 text-[10px] overflow-hidden flex flex-col justify-center ${
                  unit
                    ? 'bg-blue-950/40 border-blue-900/50'
                    : 'bg-white/[0.03] border-neutral-800'
                }`}
              >
                {unit && (
                  <>
                    <span className="truncate leading-tight">{unit.name}</span>
                    <span className="text-yellow-400 text-[9px] leading-tight">
                      {STARS[unit.starLevel] ?? ''}
                    </span>
                  </>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
