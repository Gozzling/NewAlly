import { memo, useMemo } from 'react'
import { getPlacementColor } from '@/pages/InGame'

export const SummonerPlacementSparkline = memo(function SummonerPlacementSparkline({
  placements,
}: {
  placements: number[]
}) {
  const chart = useMemo(() => {
    if (placements.length < 2) return null

    const w = 100
    const h = 28
    const pad = 5
    const innerW = w - pad * 2
    const innerH = h - pad * 2

    const pts = placements.map((p, i) => {
      const x = pad + (i / (placements.length - 1)) * innerW
      const y = pad + ((Math.min(8, Math.max(1, p)) - 1) / 7) * innerH
      return `${x},${y}`
    })

    const circles = placements.map((p, i) => {
      const x = pad + (i / (placements.length - 1)) * innerW
      const y = pad + ((Math.min(8, Math.max(1, p)) - 1) / 7) * innerH
      return (
        <circle
          key={`${i}-${p}`}
          cx={x}
          cy={y}
          r={2.4}
          fill={getPlacementColor(p)}
          stroke="var(--color-ally-card)"
          strokeWidth={0.8}
        />
      )
    })

    return { points: pts.join(' '), circles }
  }, [placements])

  if (!chart) return null

  return (
    <svg
      width="100%"
      height={28}
      viewBox="0 0 100 28"
      preserveAspectRatio="none"
      className="mb-2 block rounded-md border border-ally-border/50 bg-ally-bg/40"
      aria-hidden
    >
      <polyline
        fill="none"
        stroke="var(--color-ally-accent)"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={chart.points}
        opacity={0.75}
      />
      {chart.circles}
    </svg>
  )
})
