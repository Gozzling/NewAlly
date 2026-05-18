const mockRecommendations = [
  {
    rank: 1,
    name: 'Cybernetic Uplink',
    summaryLines: ['Fixes your econ gap', 'Synergizes with Jayce + Vi'],
    actionLine: 'Take this — stabilizes your line immediately',
    comparisonLines: [] as string[],
    confidenceLabel: 'High confidence',
  },
  {
    rank: 2,
    name: 'Weakspot',
    summaryLines: ['Strong if you can 2-star carries'],
    actionLine: 'Good alternative if board is ahead',
    comparisonLines: ['Weaker than option 1 given your HP'],
    confidenceLabel: null,
  },
  {
    rank: 3,
    name: 'Celestial Blessing',
    summaryLines: ['Defensive option', 'Less synergy with current comp'],
    actionLine: 'Safe pick if unsure',
    comparisonLines: ['Lower ceiling than options 1–2'],
    confidenceLabel: null,
  },
] as const

type MockRecommendation = (typeof mockRecommendations)[number]

function MockRecommendationRow({ item }: { item: MockRecommendation }) {
  const isPrimary = item.rank === 1

  return (
    <li
      className={
        isPrimary
          ? 'rounded-md border border-ally-accent/50 bg-ally-card/95 p-2.5 shadow-accent'
          : 'rounded-md border border-ally-border/70 bg-ally-card/50 p-2 opacity-90'
      }
    >
      <div className="flex items-start gap-2">
        <span
          className={
            isPrimary
              ? 'flex h-5 w-5 shrink-0 items-center justify-center rounded bg-ally-accent/25 font-display text-[11px] font-bold text-ally-accent'
              : 'flex h-5 w-5 shrink-0 items-center justify-center rounded bg-ally-hover font-display text-[10px] font-semibold text-ally-muted'
          }
        >
          {item.rank}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={
                isPrimary
                  ? 'truncate font-semibold text-ally-text text-xs'
                  : 'truncate font-medium text-ally-textDim text-[11px]'
              }
            >
              {item.name}
            </span>
            {isPrimary && item.confidenceLabel ? (
              <span className="shrink-0 rounded-full border border-ally-accent/40 bg-ally-accent/15 px-1.5 py-px font-sans text-[9px] font-medium uppercase tracking-wide text-ally-accent">
                {item.confidenceLabel}
              </span>
            ) : null}
          </div>
          <ul className="mt-1 space-y-0.5">
            {item.summaryLines.map((line) => (
              <li key={line} className="font-sans text-[10px] leading-snug text-ally-muted">
                {line}
              </li>
            ))}
          </ul>
          <p
            className={
              isPrimary
                ? 'mt-1.5 font-sans text-[11px] font-medium leading-snug text-ally-text'
                : 'mt-1 font-sans text-[10px] leading-snug text-ally-textDim'
            }
          >
            {item.actionLine}
          </p>
          {item.comparisonLines.length > 0 ? (
            <ul className="mt-1 space-y-0.5">
              {item.comparisonLines.map((line) => (
                <li key={line} className="font-sans text-[9px] leading-snug text-ally-muted/80">
                  {line}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </li>
  )
}

/** Static in-game overlay mockup — no live data, dev preview only. */
export default function OverlayMockup() {
  return (
    <aside
      className="pointer-events-none fixed bottom-4 right-4 z-50 w-[280px] rounded-lg border border-ally-border/80 bg-ally-bg/90 p-2.5 shadow-card backdrop-blur-sm"
      aria-label="Augment recommendations overlay preview"
    >
      <header className="mb-2 flex items-center justify-between border-b border-ally-border/60 pb-1.5">
        <span className="font-display text-[11px] font-semibold uppercase tracking-wider text-ally-accent">
          Augment picks
        </span>
        <span className="font-sans text-[9px] text-ally-muted">Round 3-2</span>
      </header>
      <ol className="flex flex-col gap-1.5" role="list">
        {mockRecommendations.map((item) => (
          <MockRecommendationRow key={item.rank} item={item} />
        ))}
      </ol>
    </aside>
  )
}
