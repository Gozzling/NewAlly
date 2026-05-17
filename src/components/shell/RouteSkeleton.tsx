import { SectionHeader } from '@/components/SectionHeader'
import { Skeleton } from '@/components/Skeleton'

export type DesktopRouteId =
  | 'in-game'
  | 'comps'
  | 'items'
  | 'units'
  | 'traits'
  | 'augments'
  | 'team-builder'
  | 'match-history'
  | 'settings'

/**
 * Route-shaped loading placeholders — mirror real page rhythm (rails unchanged).
 * Use while a screen hydrates fetch/IDB; never as a substitute for honest empty states.
 */
export function RouteSkeleton({ route }: { route: DesktopRouteId }) {
  switch (route) {
    case 'in-game':
      return (
        <div className="flex flex-col gap-4 p-4">
          <Skeleton className="h-10 w-full max-w-xl" />
          <div className="grid grid-cols-2 gap-3 min-[900px]:grid-cols-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-[120px] w-full rounded-[12px]" />
            ))}
          </div>
        </div>
      )
    case 'comps':
      return (
        <div className="flex flex-col gap-3 px-2 py-2">
          <SectionHeader label="Meta comps" />
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[72px] w-full rounded-[12px]" />
          ))}
        </div>
      )
    case 'units':
      return (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-ally-surface0 font-sans text-ally-text">
          <div className="flex gap-2 border-b border-ally-border pb-2">
            <Skeleton className="h-8 w-14 shrink-0" />
            <Skeleton className="h-8 w-[4.75rem] shrink-0" />
            <Skeleton className="h-8 w-[5rem] shrink-0" />
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-3 px-4 pb-4 pt-2">
            <div className="flex flex-col gap-2 border-b border-ally-border pb-2">
              <Skeleton className="h-9 w-full max-w-xl shrink-0" />
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <Skeleton className="h-3 w-8 shrink-0" variant="text" />
                <div className="flex flex-wrap gap-1">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-7 w-11 shrink-0 rounded" />
                  ))}
                </div>
              </div>
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <Skeleton className="h-3 w-8 shrink-0" variant="text" />
                <div className="flex flex-wrap gap-1">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-7 w-8 shrink-0 rounded" />
                  ))}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-md" />
              ))}
            </div>
            <div className="mb-1 flex items-center gap-3">
              <Skeleton className="h-2.5 w-24" variant="text" />
              <Skeleton className="h-px min-w-[48px] flex-1" variant="rect" />
            </div>
            <div className="grid grid-cols-3 gap-2 min-[900px]:grid-cols-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[4/3] w-full rounded-card" />
              ))}
            </div>
          </div>
        </div>
      )
    case 'items':
    case 'traits':
    case 'augments':
      return (
        <div className="flex flex-col gap-4 p-4">
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-9 w-40" />
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 flex-1 min-w-[120px]" />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 min-[900px]:grid-cols-5">
            {Array.from({ length: 15 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square w-full rounded-[12px]" />
            ))}
          </div>
        </div>
      )
    case 'team-builder':
      return (
        <div className="flex flex-col gap-4 p-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-[min(52vh,420px)] min-h-[280px] w-full rounded-[12px]" />
          <div className="flex gap-2">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
      )
    case 'match-history':
      return (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 p-4 pt-3">
          <div className="flex gap-1 border-b border-ally-border pb-2">
            <Skeleton className="h-8 w-[4.25rem]" />
            <Skeleton className="h-8 w-[4.75rem]" />
            <Skeleton className="h-8 w-[4.75rem]" />
          </div>
          <div className="flex min-w-0 flex-wrap gap-1 border-b border-ally-border pb-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-7 w-14 shrink-0 rounded" />
            ))}
          </div>
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-md" />
            ))}
          </div>
          <div className="mb-3 flex items-center gap-3">
            <Skeleton className="h-2.5 w-16" variant="text" />
            <Skeleton className="h-px min-w-[48px] flex-1" variant="rect" />
          </div>
          <div className="flex flex-col gap-2 overflow-hidden rounded-md border border-ally-border bg-ally-surface1">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-[4.75rem] w-full rounded-none first:rounded-t-md last:rounded-b-md" />
            ))}
          </div>
        </div>
      )
    case 'settings':
      return (
        <div className="flex max-w-3xl flex-col gap-6 px-2 py-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      )
    default:
      return null
  }
}
