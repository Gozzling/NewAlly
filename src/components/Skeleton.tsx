import type { CSSProperties } from 'react'
import { clsx } from 'clsx'

export interface SkeletonProps {
  className?: string
  /** Default `rect` — block shimmer; `text` — single-line height; `circle` — avatar/dot. */
  variant?: 'text' | 'rect' | 'circle'
  style?: CSSProperties
}

/**
 * Loading placeholder with token-based shimmer (`globals.css` `.ally-skeleton-shimmer` + `@keyframes shimmer`).
 */
export function Skeleton({ className, variant = 'rect', style }: SkeletonProps) {
  return (
    <div
      className={clsx(
        'min-h-[8px] animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-ally-card via-ally-hover to-ally-card',
        variant === 'circle' && 'rounded-full',
        variant === 'text' && 'h-4 rounded',
        variant === 'rect' && 'rounded-md',
        className,
      )}
      style={style}
      aria-hidden
    />
  )
}
