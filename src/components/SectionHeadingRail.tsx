import type { ReactNode } from 'react'

/**
 * Section title + accent rule.
 * - `stub`: short cyan cap — good for dense secondary pages.
 * - `rail`: full-width gradient line (matches ui-richness Panel B) — use on Home / hero flows.
 */
export function SectionHeadingRail({
  icon,
  title,
  subtitle,
  end,
  rule = 'stub',
}: {
  icon?: ReactNode
  title: string
  subtitle?: string
  end?: ReactNode
  rule?: 'stub' | 'rail'
}) {
  const isRail = rule === 'rail'

  return (
    <div className={`w-full min-w-0 ${isRail ? 'mb-5 space-y-2' : 'mb-4 space-y-1.5'}`}>
      <div className="flex min-w-0 w-full items-center gap-3">
        {icon ? <span className="shrink-0 text-ally-accent">{icon}</span> : null}
        <h2
          className={`shrink-0 font-display font-bold uppercase tracking-[0.12em] text-ally-text ${
            isRail ? 'text-sm sm:text-base' : 'text-sm'
          }`}
        >
          {title}
        </h2>
        {isRail ? (
          <div className="section-heading-rail-line mx-1 min-h-[2px] min-w-[2rem] flex-1" aria-hidden />
        ) : (
          <>
            <div className="section-heading-rail-stub h-px w-16 shrink-0 sm:w-28" aria-hidden />
            <div className="min-w-0 flex-1" aria-hidden />
          </>
        )}
        {end ? <div className="shrink-0">{end}</div> : null}
      </div>
      {subtitle ? (
        <p
          className={`max-w-2xl text-[13px] font-body leading-relaxed text-ally-muted ${
            icon ? 'pl-0 sm:pl-9' : ''
          }`}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  )
}
