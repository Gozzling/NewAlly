/**
 * Hover tooltip for stat abbreviations (LP, WR, etc.) — 200ms opacity transition.
 */
export function StatAbbr({
  text,
  tip,
  className = '',
}: {
  text: string
  tip: string
  className?: string
}) {
  return (
    <span
      className={`group relative inline cursor-help border-b border-dotted border-ally-muted ${className}`}
    >
      {text}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-[calc(100%+6px)] left-1/2 z-[100] w-max max-w-[min(240px,calc(100vw-48px))] -translate-x-1/2 rounded-md border border-ally-border bg-ally-card px-2 py-1.5 text-left text-[10px] font-sans font-normal normal-case leading-snug tracking-normal text-ally-text opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100"
      >
        {tip}
      </span>
    </span>
  )
}
