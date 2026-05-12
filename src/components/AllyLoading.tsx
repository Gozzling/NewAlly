/** Shared loading UI — Tailwind + ally-* tokens only. */

export function AllySpinner({ className = '', label }: { className?: string; label?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`} role="status" aria-label={label ?? 'Loading'}>
      <span
        className="inline-block size-4 shrink-0 rounded-full border-2 border-ally-border border-t-ally-accent animate-spin shadow-[0_0_8px_rgba(0,212,255,0.4)]"
        aria-hidden
      />
      {label ? <span className="font-display text-caption uppercase tracking-wider text-ally-muted font-bold">{label}</span> : null}
    </span>
  )
}

export function AllySkeletonBlock({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-ally-card ring-1 ring-ally-border/80 ${className}`}
      aria-hidden
    />
  )
}

export function MetaCompsSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-3" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <AllySkeletonBlock key={i} className="h-24 w-full" />
      ))}
    </div>
  )
}
