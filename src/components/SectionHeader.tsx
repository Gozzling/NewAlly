import type { ReactNode } from 'react'

export interface SectionHeaderProps {
  label: string
  rightContent?: ReactNode
  /** Sidebar filter chrome: smaller label + widest tracking. */
  variant?: 'default' | 'sidebar' | 'flat'
  className?: string
}

/**
 * Panel chrome: display label + rule. Sidebar uses mono caps + flat divider (shell spec: no gradient fields).
 */
export function SectionHeader({ label, rightContent, variant = 'default', className = '' }: SectionHeaderProps) {
  const labelCls =
    variant === 'sidebar'
      ? 'font-mono text-[9px] font-semibold uppercase tracking-widest text-ally-muted'
      : variant === 'flat'
        ? 'font-display text-[10px] font-bold uppercase tracking-[0.12em] text-ally-muted'
        : 'font-display text-[10px] font-bold uppercase tracking-[0.15em] text-ally-text'
  const wrapMb = variant === 'sidebar' || variant === 'flat' ? 'mb-3' : 'mb-4'

  const ruleCls =
    variant === 'sidebar' || variant === 'flat'
      ? 'h-px min-w-[48px] flex-1 bg-ally-border'
      : 'h-0.5 min-w-[48px] flex-1 rounded-sm bg-gradient-to-r from-ally-accent/70 via-ally-accent/20 to-transparent opacity-90'

  return (
    <div className={`flex min-w-0 items-center gap-3 ${wrapMb} ${className}`}>
      <span className={`shrink-0 ${labelCls}`}>{label}</span>
      <div className={ruleCls} />
      {rightContent ? (
        <div className="shrink-0 font-display text-[10px] text-ally-muted [&_button]:tracking-[0.2em]">{rightContent}</div>
      ) : null}
    </div>
  )
}
