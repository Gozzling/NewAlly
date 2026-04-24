import { useEffect, useRef, useState } from 'react'
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
  }, []);
  const [activePage, setActivePage] = useState<string>('In Game')

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
  {/* Navbar */}
  <div
    className="w-full h-11 flex-shrink-0 bg-ally-card border-b border-ally-border flex items-center"
    style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
  >
    {/* Left: Logo */}
    <div
      className="flex items-center pl-3"
      style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
    >
      <div className="flex items-center gap-2 px-4 flex-shrink-0"><svg viewBox="0 0 240 66" fill="none" className="h-5 w-auto">
        <path d="M35.75 0L67 62.5H49.5L37 30L17 62.5H2" stroke="#35c3e7" strokeWidth="8" strokeLinejoin="round" strokeLinecap="round"/>
        <line x1="12" y1="43.75" x2="49.5" y2="43.75" stroke="#35c3e7" strokeWidth="7"/>
        <path d="M82 4L82 62.5L112 62.5" stroke="white" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="76" y1="36" x2="95" y2="28" stroke="#35c3e7" strokeWidth="5" strokeLinecap="round"/>
        <path d="M128 4L128 62.5L158 62.5" stroke="white" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="122" y1="36" x2="141" y2="28" stroke="#35c3e7" strokeWidth="5" strokeLinecap="round"/>
        <path d="M172 4L194 33L216 4" stroke="white" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M194 33L194 62.5" stroke="white" strokeWidth="7" strokeLinecap="round"/>
        <line x1="188" y1="48" x2="207" y2="40" stroke="#35c3e7" strokeWidth="5" strokeLinecap="round"/>
      </svg>
    </div>

    {/* Center: Nav tabs */}
    <div
      className="flex items-center gap-1 h-full"
      style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
    >
      {['In Game','Comps','Items','Units','Traits','Augments','Team Builder','Match History'].map((tab) => (
        <button
          key={tab}
          onClick={() => setActivePage(tab)}
          className={`h-full text-[13px] px-4 ${activePage === tab ? 'text-ally-accent border-b-2 border-ally-accent' : 'text-ally-muted hover:text-ally-text'}`}
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          {tab}
        </button>
      ))}
    </div>

    {/* Right: Window controls */}
    <div
      className="flex items-center pr-3"
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

  {/* Page area */}
  <div className="flex-1 overflow-y-auto bg-ally-bg">
    {activePage === 'In Game' ? (
      <div className="p-5 flex flex-col gap-4">
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
    ) : (
      <div className="flex items-center justify-center h-full">
        <span className="text-ally-muted text-sm">{activePage}</span>
      </div>
    )}
  </div>
</div>
  )
}
