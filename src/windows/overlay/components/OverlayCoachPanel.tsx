import type { AllyRecommendation } from '@ally/shared-types'
import { Coins, LayoutGrid, Package, ShoppingCart, Sparkles } from 'lucide-react'
import clsx from 'clsx'

function categoryIcon(category: AllyRecommendation['category']) {
  const cls = 'h-3 w-3 shrink-0 text-ally-accent'
  switch (category) {
    case 'shop':
      return <ShoppingCart className={cls} aria-hidden />
    case 'items':
      return <Package className={cls} aria-hidden />
    case 'economy':
      return <Coins className={cls} aria-hidden />
    case 'augments':
      return <Sparkles className={cls} aria-hidden />
    default:
      return <LayoutGrid className={cls} aria-hidden />
  }
}

function urgencyClass(urgency: AllyRecommendation['urgency']): string {
  switch (urgency) {
    case 'high':
      return 'text-ally-placementBot4'
    case 'medium':
      return 'text-ally-warning'
    default:
      return 'text-ally-muted'
  }
}

export function OverlayCoachPanel({ recommendations }: { recommendations: AllyRecommendation[] }) {
  if (recommendations.length === 0) {
    return null
  }

  return (
    <section
      className="space-y-1.5 rounded-lg border border-ally-border bg-ally-card/90 p-2 pointer-events-none"
      aria-label="Live coach recommendations"
    >
      <div className="font-mono text-[9px] font-semibold uppercase tracking-widest text-ally-muted">
        Coach
      </div>
      <ul className="space-y-1.5">
        {recommendations.map((rec) => (
          <li
            key={rec.id}
            className="rounded-md border border-ally-border bg-ally-surface0/80 px-2 py-1.5"
          >
            <div className="flex items-start gap-1.5">
              {categoryIcon(rec.category)}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <span className="truncate text-[10px] font-semibold text-ally-text">
                    {rec.title}
                  </span>
                  <span
                    className={clsx(
                      'ml-auto shrink-0 font-mono text-[8px] font-semibold uppercase',
                      urgencyClass(rec.urgency),
                    )}
                  >
                    {rec.urgency}
                  </span>
                </div>
                <p className="mt-0.5 line-clamp-2 text-[9px] leading-snug text-ally-muted">
                  {rec.detail}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
