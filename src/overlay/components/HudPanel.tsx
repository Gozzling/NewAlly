const ROUND_TYPES: Record<string, { label: string; cls: string }> = {
  training: { label: 'Carousel', cls: 'bg-blue-950/70 text-blue-300' },
  pve:      { label: 'PvE',      cls: 'bg-green-950/70 text-green-300' },
  pvp:      { label: 'PvP',      cls: 'bg-red-950/70 text-red-300' },
}

interface Props {
  gold:        number | null
  roundType:   string | null
  shopVisible: boolean
}

export function HudPanel({ gold, roundType, shopVisible }: Props) {
  const def = roundType ? (ROUND_TYPES[roundType] ?? null) : null

  return (
    <>
      <div className="absolute top-20 right-4 flex flex-col gap-2 pointer-events-none">
        {/* Gold card */}
        <div className="bg-black/65 border border-white/10 rounded-md px-3.5 py-2 min-w-[120px] select-none">
          <div className="text-[10px] uppercase tracking-widest text-neutral-500 mb-0.5">Gold</div>
          <div className="text-xl font-bold text-yellow-400 leading-tight">{gold ?? '–'}</div>
        </div>

        {/* Round card */}
        <div className="bg-black/65 border border-white/10 rounded-md px-3.5 py-2 min-w-[120px] select-none">
          <div className="text-[10px] uppercase tracking-widest text-neutral-500 mb-0.5">Round</div>
          <div className="text-xl font-bold text-white leading-tight">{roundType ?? '–'}</div>
          <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded mt-1 ${def?.cls ?? 'bg-neutral-800 text-neutral-500'}`}>
            {def?.label ?? (roundType ?? '–')}
          </span>
        </div>
      </div>

      {shopVisible && (
        <div className="absolute bottom-[220px] left-1/2 -translate-x-1/2 bg-yellow-400/15 border border-yellow-400/50 text-yellow-400 text-[11px] font-semibold tracking-widest uppercase px-3.5 py-1 rounded pointer-events-none">
          Shop Open
        </div>
      )}
    </>
  )
}
