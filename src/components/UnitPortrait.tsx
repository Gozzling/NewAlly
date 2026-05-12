import { useMemo } from 'react'
import { User } from 'lucide-react'
import { unitPortraitUrls } from '@/utils/iconResolver'
import { IconWithFallback } from './IconWithFallback'

export type UnitPortraitProps = {
  name: string
  size?: number | string
  radius?: number
  className?: string
  cdnUrl?: string | null
  style?: React.CSSProperties
}

/**
 * Unit face: CDN URL if provided, local roster icon fallback, Data Dragon final fallback, then neutral icon.
 */
export function UnitPortrait({ name, size = 28, radius = 4, className, cdnUrl, style }: UnitPortraitProps) {
  const urls = useMemo(() => unitPortraitUrls(name, cdnUrl), [name, cdnUrl]);
  const numericSize = typeof size === 'number' ? size : 28;

  return (
    <IconWithFallback
      urls={urls}
      alt={name}
      size={size}
      className={className}
      style={{ borderRadius: radius, ...style }}
      fallback={
        <div
          className={`flex items-center justify-center shrink-0 bg-ally-card border border-ally-border text-ally-muted ${className ?? ''}`}
          style={{ width: size, height: size, borderRadius: radius }}
          title={name}
        >
          <User size={Math.max(12, numericSize * 0.45)} strokeWidth={2} aria-hidden />
        </div>
      }
    />
  )
}
