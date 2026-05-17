import { memo } from 'react'

export interface FilterPillProps {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
  className?: string
  tone?: 'default' | 'compact'
  /** Skip forced uppercase (mixed-case augment tags, item tags, trait types). */
  preserveCase?: boolean
}

/**
 * Shared tactile filter chip for encyclopedia sidebars — consistent with ally tokens.
 */
export const FilterPill = memo(function FilterPill({
  selected,
  onClick,
  children,
  className = '',
  tone = 'default',
  preserveCase = false,
}: FilterPillProps) {
  const pad = tone === 'compact' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-[11px]'
  const caseCls = preserveCase ? 'capitalize tracking-tight' : 'uppercase tracking-wide'
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'rounded-md font-display transition-all duration-150',
        caseCls,
        pad,
        'border focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ally-accent/30',
        selected
          ? 'border-ally-accent bg-ally-accent/15 text-ally-accent'
          : 'border-ally-border bg-ally-card text-ally-muted hover:border-ally-accent/50 hover:text-ally-text hover:bg-ally-card',
        className,
      ].join(' ')}
    >
      {children}
    </button>
  )
})
