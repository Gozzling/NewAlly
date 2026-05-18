import { Sparkles } from 'lucide-react'
import clsx from 'clsx'
import { GameIcon } from '@/components/GameIcon'
import { RecommendationExplanation } from '@/ui/components/RecommendationExplanation'
import {
  useIntentAugmentRecommendations,
  type BlendedIntent,
} from '@/hooks/useIntentAugmentRecommendations'
import { useRecommendationDecisionFeedback } from '@/ui/recommendations/useRecommendationDecisionFeedback'
import type { RecommendationSurface } from '@/engine/recommendations/evaluation'
import { augmentIconUrl } from '@/utils/augmentDisplay'
import { RECOMMENDATION_INTENTS, type RecommendationIntent } from '@/types/recommendationIntent'
import type { FormattedEntityRecommendation } from '@/ui/recommendations/formatExplanation'
import type { TftGameState } from '@/types/tft'

type AugmentRecommendationsPanelProps = {
  intent: RecommendationIntent
  blendedIntent?: BlendedIntent | null
  onIntentChange?: (intent: RecommendationIntent) => void
  showIntentPicker?: boolean
  compact?: boolean
  compressionMode?: boolean
  gameState?: TftGameState | null
  surface?: RecommendationSurface
  limit?: number
  className?: string
  onRecommendationClicked?: (canonicalId: string) => void
  onRecommendationIgnored?: (canonicalId: string) => void
}

function AugmentPickRow({
  pick,
  intent,
  compact,
  compressionMode,
  onClick,
  onExplanationExpanded,
  onExplanationCollapsed,
}: {
  pick: FormattedEntityRecommendation
  intent: RecommendationIntent
  compact: boolean
  compressionMode: boolean
  onClick?: () => void
  onExplanationExpanded?: () => void
  onExplanationCollapsed?: () => void
}) {
  const isPrimary = pick.displayRole === 'primary'

  return (
    <li className="rounded-md border bg-ally-card/80 p-2">
      <button
        type="button"
        onClick={onClick}
        className={clsx(
          'flex w-full items-start gap-2 text-left',
          onClick ? 'pointer-events-auto cursor-pointer hover:opacity-90' : 'pointer-events-none',
        )}
      >
        <GameIcon
          src={pick.iconUrl ?? augmentIconUrl(pick.name)}
          fallbackSrc={augmentIconUrl(pick.name)}
          width={compact ? 28 : 32}
          height={compact ? 28 : 32}
          className="shrink-0 rounded-md border border-ally-border object-cover"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {isPrimary && (
              <span className="shrink-0 rounded bg-ally-accent/20 px-1 py-px font-mono text-[7px] font-bold uppercase tracking-wide text-ally-accent">
                Pick
              </span>
            )}
            <span className={clsx('truncate font-semibold text-ally-text', compact ? 'text-[10px]' : 'text-xs')}>
              {pick.name}
            </span>
            <span className="ml-auto shrink-0 font-mono text-[8px] text-ally-muted">
              {Math.round(pick.confidence * 100)}%
            </span>
          </div>
          {pick.hasExplanation ? (
            <RecommendationExplanation
              summaryLines={pick.summaryLines}
              topReasons={pick.topReasons}
              confidence={isPrimary && !compressionMode ? pick.confidence : undefined}
              intent={intent}
              compact={compact}
              compressionMode={compressionMode}
              displayRole={pick.displayRole}
              className="mt-1.5 border-0 bg-transparent p-0 pointer-events-auto"
              onExplanationExpanded={onExplanationExpanded}
              onExplanationCollapsed={onExplanationCollapsed}
            />
          ) : (
            <p className="mt-1 text-[9px] text-ally-muted">Meta-ranked for {intent}</p>
          )}
        </div>
      </button>
    </li>
  )
}

export function AugmentRecommendationsPanel({
  intent,
  blendedIntent = null,
  onIntentChange,
  showIntentPicker = false,
  compact = false,
  compressionMode = false,
  gameState = null,
  surface = 'guide',
  limit = 5,
  className,
  onRecommendationClicked,
  onRecommendationIgnored,
}: AugmentRecommendationsPanelProps) {
  const effectiveBlend = blendedIntent
  const queryIntent = effectiveBlend?.primary ?? intent
  const { formatted, hasExplanation } = useIntentAugmentRecommendations(queryIntent, {
    limit,
    minConfidence: 0.3,
    compressionMode: compressionMode || compact,
    gameState,
    blendedIntent: effectiveBlend,
  })

  const visible = formatted.map((f) => ({
    canonicalId: f.canonicalId,
    confidence: f.confidence,
  }))
  const feedback = useRecommendationDecisionFeedback({
    surface,
    intent: queryIntent,
    visible,
    enabled: formatted.length > 0,
  })

  if (formatted.length === 0) return null

  const primaryAction = formatted[0]?.actionLine
  const effectiveCompression = compressionMode || compact
  const intentBadge = effectiveBlend?.label ?? intent

  return (
    <section
      className={clsx('rounded-lg border border-ally-border bg-ally-card/90', compact ? 'p-2' : 'p-3', className)}
      aria-label="Augment recommendations"
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Sparkles className="h-3.5 w-3.5 shrink-0 text-ally-accent" aria-hidden />
        <h3 className="font-display text-[10px] font-bold uppercase tracking-widest text-ally-muted">
          Recommended augments
        </h3>
        <span className="rounded bg-ally-accent/15 px-1.5 py-0.5 font-mono text-[8px] uppercase text-ally-accent">
          {intentBadge}
        </span>
      </div>

      {showIntentPicker && onIntentChange && (
        <div className="mb-2 flex flex-wrap gap-1">
          {RECOMMENDATION_INTENTS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => onIntentChange(id)}
              className={clsx(
                'rounded px-2 py-0.5 text-[9px] font-medium transition-colors pointer-events-auto',
                intent === id
                  ? 'border border-ally-accent/40 bg-ally-accent/15 text-ally-accent'
                  : 'border border-ally-border text-ally-muted hover:text-ally-text',
              )}
            >
              {id}
            </button>
          ))}
        </div>
      )}

      {hasExplanation && primaryAction && !effectiveCompression && (
        <p className="mb-2 text-[10px] font-medium leading-snug text-ally-text">{primaryAction}</p>
      )}

      <ul className={clsx('space-y-1.5', compact && 'space-y-1')}>
        {formatted.map((pick) => (
          <AugmentPickRow
            key={pick.canonicalId}
            pick={pick}
            intent={queryIntent}
            compact={compact}
            compressionMode={effectiveCompression}
            onClick={() => {
              feedback.onRecommendationClicked(pick.canonicalId)
              onRecommendationClicked?.(pick.canonicalId)
            }}
            onExplanationExpanded={() => feedback.onExplanationExpanded(pick.canonicalId)}
            onExplanationCollapsed={() => feedback.onExplanationCollapsed(pick.canonicalId)}
          />
        ))}
      </ul>
    </section>
  )
}
