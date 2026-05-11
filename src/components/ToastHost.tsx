import { useAppStore } from '@/store/useAppStore'

/**
 * Global toast stack (desktop). Success / info; auto-dismiss ~3.2s.
 */
export function ToastHost() {
  const toasts = useAppStore((s) => s.toasts)
  const dismissToast = useAppStore((s) => s.dismissToast)

  if (toasts.length === 0) return null

  return (
    <div
      className="pointer-events-none fixed bottom-5 right-5 z-[200] flex max-w-sm flex-col gap-2"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => dismissToast(t.id)}
          className={`pointer-events-auto ally-toast-enter flex items-start gap-2 rounded-lg border px-4 py-2.5 text-left text-sm font-sans shadow-lg transition-opacity duration-200 hover:opacity-90 ${
            t.variant === 'success'
              ? 'border-ally-accent/40 bg-ally-card text-ally-text'
              : 'border-ally-border bg-ally-card text-ally-muted'
          }`}
        >
          {t.variant === 'success' ? (
            <span className="shrink-0 text-ally-accent" aria-hidden>
              ✓
            </span>
          ) : (
            <span className="shrink-0 text-ally-muted" aria-hidden>
              ℹ
            </span>
          )}
          <span className="min-w-0 flex-1 leading-snug">{t.message}</span>
        </button>
      ))}
    </div>
  )
}
