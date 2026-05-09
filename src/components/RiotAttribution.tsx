/**
 * Required-style attribution for products using Riot Games API / developer ecosystem.
 * Mirror the same wording on Overwolf / Riot product registration listings.
 */
type RiotAttributionProps = {
  /** Defaults to "TFT Ally". */
  productName?: string
  className?: string
}

export function RiotAttribution({ productName = 'TFT Ally', className = '' }: RiotAttributionProps) {
  return (
    <aside
      className={`rounded-lg border border-ally-border bg-ally-bg/80 p-4 ${className}`.trim()}
      role="note"
      aria-label="Riot Games legal attribution"
    >
      <div className="mb-2 text-[10px] font-medium uppercase tracking-wider text-ally-muted">
        Riot Games
      </div>
      <p className="text-[11px] leading-relaxed text-ally-muted">
        <span className="font-semibold text-ally-text/90">{productName}</span>
        {" isn't endorsed by Riot Games and doesn't reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties. "}
        <span className="text-ally-text/70">
          Riot Games, and all associated properties are trademarks or registered trademarks of Riot Games, Inc.
        </span>
      </p>
      <p className="mt-2 text-[10px] text-ally-muted">
        <a
          href="https://developer.riotgames.com/policies"
          target="_blank"
          rel="noopener noreferrer"
          className="text-ally-accent underline-offset-2 hover:underline"
        >
          Developer policies
        </a>
        {' · '}
        <a
          href="https://www.leagueoflegends.com/en-us/legal"
          target="_blank"
          rel="noopener noreferrer"
          className="text-ally-accent underline-offset-2 hover:underline"
        >
          Riot legal
        </a>
      </p>
    </aside>
  )
}
