import { useEffect, useRef } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { subscribeToStateSnapshots } from '@/services/ipcService'

function getCurrentWindowId(): Promise<string> {
  return new Promise((resolve) => {
    overwolf.windows.getCurrentWindow((r: any) => {
      if (r.status === 'success') resolve(r.window.id)
    })
  })
}

function StatCard({
  label,
  value,
  valueClass = 'text-white',
}: {
  label: string
  value: string
  valueClass?: string
}) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3.5">
      <div className="text-[10px] uppercase tracking-widest text-neutral-600 mb-1.5">{label}</div>
      <div className={`text-2xl font-bold ${valueClass}`}>{value}</div>
    </div>
  )
}

export function DesktopApp() {
  const state = useAppStore((s: any) => s.gameState)
  const lastRawRef = useRef<string>('')

  useEffect(() => {
    return subscribeToStateSnapshots()
  }, [])

  async function handleMinimize() {
    overwolf.windows.minimize(await getCurrentWindowId(), () => {})
  }
  async function handleClose() {
    overwolf.windows.close(await getCurrentWindowId(), () => {})
  }

  const rawJson = state ? JSON.stringify(state.raw, null, 2) : 'Waiting for data...'
  if (rawJson !== lastRawRef.current) lastRawRef.current = rawJson

  return (
    <div className="w-full h-full flex flex-col bg-ally-bg text-ally-text font-sans">

      {/* Titlebar */}
      <div
        className="w-full h-9 flex-shrink-0 bg-ally-card border-b border-ally-border flex items-center px-3.5 gap-2.5"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <span className="text-[13px] font-semibold text-ally-accent tracking-[0.04em]">
          TFT Companion
        </span>
        <div
          className="ml-auto flex gap-1"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <button
            onClick={handleMinimize}
            className="w-7 h-7 text-ally-muted rounded text-[13px] hover:bg-ally-hover hover:text-ally-text transition-colors"
          >
            ─
          </button>
          <button
            onClick={handleClose}
            className="w-7 h-7 text-ally-muted rounded text-[13px] hover:bg-red-900 hover:text-ally-text transition-colors"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">

        {/* Status Banner */}
        <div className="flex items-center gap-2.5 p-3 rounded-lg border border-ally-border bg-ally-card text-[13px]">
          <div
            className={`w-2.5 h-2.5 rounded-full flex-shrink-0 transition-colors ${
              state?.isInGame ? 'bg-green-500 shadow-[0_0_6px_#4caf5088]' : 'bg-ally-muted'
            }`}
          />
          <span className="font-semibold">
            {state?.isInGame ? 'TFT In Progress' : 'Waiting for TFT...'}
          </span>
        </div>

        {/* Live State Cards */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            label="Gold"
            value={state?.gold?.toString() ?? '–'}
            valueClass="text-yellow-400"
          />
          <StatCard label="Round Type" value={state?.round_type ?? '–'} />
          <StatCard
            label="Shop"
            value={state?.shop_visible ? 'Open' : 'Closed'}
            valueClass={state?.shop_visible ? 'text-green-400' : 'text-ally-muted'}
          />
        </div>

        {/* Raw GEP Dump */}
        <details className="bg-ally-bg border border-ally-border rounded-lg p-3">
          <summary className="text-[11px] text-ally-muted cursor-pointer select-none">
            Raw GEP data
          </summary>
          <pre className="mt-2 font-mono text-[11px] text-ally-muted whitespace-pre-wrap break-all max-h-48 overflow-y-auto">
            {lastRawRef.current}
          </pre>
        </details>

      </div>
    </div>
  )
}
