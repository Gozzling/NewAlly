import type { ItemTracker as ItemTrackerData, CraftableItem, MissingItem } from '../../types/tft'

const PANEL = 'bg-black/70 border border-neutral-700 p-2 min-w-[200px]'
const LABEL = 'text-[10px] uppercase tracking-widest text-neutral-600 mb-1'
const EMPTY = 'text-[10px] text-neutral-700 py-1'

function CraftableRow({ entry }: { entry: CraftableItem }) {
  return (
    <div className="flex flex-col py-1.5 border-b border-neutral-800 gap-0.5 last:border-0">
      <div className="flex justify-between items-baseline">
        <span className="text-[11px] text-green-400">{entry.item}</span>
        <span className="text-[10px] text-neutral-500 ml-2 shrink-0">{entry.carry}</span>
      </div>
      <span className="text-[9px] text-neutral-600">{entry.recipe.join(' + ')}</span>
    </div>
  )
}

function MissingRow({ entry }: { entry: MissingItem }) {
  return (
    <div className="flex flex-col py-1.5 border-b border-neutral-800 gap-1 last:border-0">
      <div className="flex justify-between items-baseline">
        <span className="text-[11px] text-red-400">{entry.item}</span>
        <span className="text-[10px] text-neutral-500 ml-2 shrink-0">{entry.carry}</span>
      </div>
      <div className="flex flex-wrap gap-1">
        {entry.missingComponents.map((c, i) => (
          <span
            key={`${c}-${i}`}
            className="bg-red-950/30 border border-red-900/40 text-red-400 text-[9px] px-1 py-0.5 rounded-sm"
          >
            need: {c}
          </span>
        ))}
      </div>
    </div>
  )
}

interface Props { tracker: ItemTrackerData }

export function ItemTracker({ tracker }: Props) {
  return (
    <div className={PANEL}>
      <h3 className="text-[10px] uppercase tracking-widest text-neutral-500 mb-2">Item Matrix</h3>

      <div className={LABEL}>Craftable Core Items</div>
      {tracker.craftable.length === 0
        ? <p className={EMPTY}>None</p>
        : tracker.craftable.map((e, i) => <CraftableRow key={i} entry={e} />)
      }

      <div className={`${LABEL} mt-2`}>Missing Components</div>
      {tracker.missing.length === 0
        ? <p className={EMPTY}>None</p>
        : tracker.missing.map((e, i) => <MissingRow key={i} entry={e} />)
      }
    </div>
  )
}
