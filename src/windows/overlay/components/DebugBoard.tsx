import type { BoardState } from '@/types/tft'

const STARS = ['', '★', '★★', '★★★'] as const
const COLS  = 7
const ROWS  = 4

interface Props { board: BoardState }

export function DebugBoard({ board }: Props) {
  return (
    <div className="bg-ally-bg/70 border border-ally-border p-2">
      <h3 className="text-[10px] uppercase tracking-widest text-ally-muted mb-1.5">Board</h3>
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
                    ? 'bg-ally-accent/10 border-ally-accent/30'
                    : 'bg-ally-text/[0.03] border-ally-border'
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
