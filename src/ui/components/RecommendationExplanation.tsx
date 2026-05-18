import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import clsx from 'clsx'
import type { RecommendationIntent } from '@/types/recommendationIntent'

export type RecommendationExplanationProps = {
  summaryLines: string[]
  topReasons?: string[]
  confidence?: number
  intent?: RecommendationIntent
  compact?: boolean
  compressionMode?: boolean
  displayRole?: 'primary' | 'comparison'
  className?: string
  onExplanationExpanded?: () => void
  onExplanationCollapsed?: () => void
}

function confidenceLabel(value: number): string {
  const pct = Math.round(value * 100)
  if (pct >= 70) return 'Strong fit'
  if (pct >= 50) return 'Solid fit'
  return 'Situational'
}

function confidenceBarClass(value: number): string {
  if (value >= 0.7) return 'bg-ally-placementTop4'
  if (value >= 0.5) return 'bg-ally-warning'
  return 'bg-ally-muted'
}

export function RecommendationExplanation({
  summaryLines,
  topReasons = [],
  confidence,
  intent,
  compact = false,
  compressionMode = false,
  displayRole = 'primary',
  className,
  onExplanationExpanded,
  onExplanationCollapsed,
}: RecommendationExplanationProps) {
  const [reasonsOpen, setReasonsOpen] = useState(false)

  if (summaryLines.length === 0 && topReasons.length === 0 && confidence == null) {
    return null
  }

  const lineCap =
    displayRole === 'comparison'
      ? compressionMode
        ? 1
        : 2
      : compressionMode
        ? compact
          ? 1
          : 2
        : compact
          ? 2
          : 4

  const displayLines = summaryLines.slice(0, lineCap)
  const extraReasons = topReasons.filter(
    (r) => !displayLines.some((l) => l.toLowerCase() === r.toLowerCase()),
  )
  const showCollapsible =
    displayRole === 'primary' && extraReasons.length > 0 && (compact || compressionMode)
  const showConfidence = displayRole === 'primary' && confidence != null && !compressionMode
  const confidencePct =
    confidence != null ? Math.round(Math.min(1, Math.max(0, confidence)) * 100) : 0

  return (
    <div
      className={clsx(
        displayRole === 'comparison'
          ? 'text-ally-muted'
          : 'rounded-md border border-ally-border bg-ally-surface0/60',
        displayRole === 'comparison' ? '' : compact ? 'px-2 py-1.5' : 'px-2.5 py-2',
        className,
      )}
      aria-label={intent ? `Recommendation rationale for ${intent}` : 'Recommendation rationale'}
    >
      {showConfidence && (
        <div className="mb-1.5 flex items-center gap-2">
          <div className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-ally-border">
            <div
              className={clsx('h-full rounded-full transition-all', confidenceBarClass(confidence!))}
              style={{ width: `${confidencePct}%` }}
            />
          </div>
          <span className="shrink-0 font-mono text-[8px] font-semibold uppercase tracking-wide text-ally-muted">
            {confidenceLabel(confidence!)}
          </span>
        </div>
      )}

      {displayLines.length > 0 && (
        <ul
          className={clsx(
            'space-y-0.5',
            compact || compressionMode ? 'text-[9px]' : 'text-[10px]',
            displayRole === 'primary' ? 'text-ally-text-dim' : 'text-ally-muted italic',
          )}
        >
          {displayLines.map((line) => (
            <li key={line} className="leading-snug">
              {line}
            </li>
          ))}
        </ul>
      )}

      {showCollapsible && (
        <div className="mt-1">
          <button
            type="button"
            onClick={() => {
              setReasonsOpen((o) => {
                const next = !o
                if (next) onExplanationExpanded?.()
                else onExplanationCollapsed?.()
                return next
              })
            }}
            className="pointer-events-auto flex items-center gap-0.5 text-[8px] font-semibold uppercase tracking-wide text-ally-accent hover:text-ally-text"
          >
            {reasonsOpen ? (
              <ChevronDown className="h-2.5 w-2.5" aria-hidden />
            ) : (
              <ChevronRight className="h-2.5 w-2.5" aria-hidden />
            )}
            Context
          </button>
          {reasonsOpen && (
            <ul className="mt-0.5 space-y-0.5 text-[9px] text-ally-muted">
              {extraReasons.map((reason) => (
                <li key={reason} className="leading-snug">
                  {reason}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}