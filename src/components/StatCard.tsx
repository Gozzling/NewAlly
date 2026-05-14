import { memo } from 'react'

interface StatCardProps {
  label: string
  value: string
  valueClass?: string
  subtext?: string
}

/**
 * Optimized Stat Card.
 * Uses React.memo to prevent unnecessary re-renders when parent state updates.
 * Performance Impact: Avoids re-calculating and re-rendering static stats during active searching.
 */
export const StatCard = memo(function StatCard({ label, value, valueClass = 'text-ally-text', subtext }: StatCardProps) {
  return (
    <div className="bg-ally-card border border-ally-border rounded-xl p-4 shadow-card hover:border-ally-accent/30 transition-colors group">
      <div className="text-caption uppercase tracking-widest text-ally-muted mb-1.5 font-display font-bold group-hover:text-ally-accent transition-colors">{label}</div>
      <div className={`text-display font-bold font-numbers ${valueClass}`}>{value}</div>
      {subtext && <div className="text-caption text-ally-muted mt-1 font-medium italic">{subtext}</div>}
    </div>
  )
})
