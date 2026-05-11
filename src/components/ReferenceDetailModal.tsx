import { useEffect, type ReactNode } from 'react'

type ReferenceDetailModalProps = {
  open: boolean
  onClose: () => void
  children: ReactNode
  /** Screen reader label for the dialog */
  ariaLabel?: string
}

export function ReferenceDetailModal({ open, onClose, children, ariaLabel = 'Details' }: ReferenceDetailModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[600] flex items-start justify-center bg-black/55 px-3 pb-4 pt-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        className="ally-dropdown-surface flex max-h-[min(90vh,calc(100vh-2rem))] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-ally-border bg-ally-bg shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-end border-b border-ally-border px-2 py-1.5">
          <button
            type="button"
            className="rounded-md px-3 py-1.5 font-sans text-sm text-ally-muted transition-colors duration-200 hover:bg-ally-hover hover:text-ally-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ally-accent"
            onClick={onClose}
            aria-label="Close"
          >
            Esc
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}
