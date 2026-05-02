export function SkeletonBox({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-neutral-800/50 rounded ${className}`} />
  )
}

export function SkeletonText({ width = 'w-full', className = '' }: { width?: string; className?: string }) {
  return (
    <div className={`animate-pulse bg-neutral-700/50 rounded ${width} h-2 ${className}`} />
  )
}

export function SkeletonCircle({ size = 4 }: { size?: number }) {
  return (
    <div className={`animate-pulse bg-neutral-700/50 rounded-full w-${size} h-${size}`} />
  )
}