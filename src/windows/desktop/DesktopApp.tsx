import { useEffect, useRef, useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { subscribeToStateSnapshots } from '@/services/ipcService'
import { Dashboard } from '@/pages/Dashboard'
import { ItemsGuide } from '@/pages/ItemsGuide'
import { UnitGuide } from '@/pages/UnitGuide'
import { SynergyGuide } from '@/pages/SynergyGuide'
import { AugmentGuide } from '@/pages/AugmentGuide'
import { TeamBuilder } from '@/pages/TeamBuilder'
import { PlayerSearch } from '@/pages/PlayerSearch'

function getCurrentWindowId(): Promise<string> {
  return new Promise((resolve) => {
    overwolf.windows.getCurrentWindow((r: any) => {
      if (r.status === 'success') resolve(r.window.id)
    })
  })
}

function StatCard({ label, value, valueClass = 'text-white' }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3.5">
      <div className="text-[10px] uppercase tracking-widest text-neutral-600 mb-1.5">{label}</div>
      <div className={`text-2xl font-bold ${valueClass}`}>{value}</div>
    </div>
  )
}

const TABS = ['In Game', 'Comps', 'Items', 'Units', 'Traits', 'Augments', 'Team Builder', 'Match History']

export function DesktopApp() {
  const state = useAppStore((s: any) => s.gameState)
  const lastRawRef = useRef<string>('')
  const [activePage, setActivePage] = useState<string>('In Game')

  useEffect(() => {
    return subscribeToStateSnapshots()
  }, [])

  async function handleMinimize() {
    overwolf.windows.minimize(await getCurrentWindowId(), () => {})
  }
async function handleClose() {
  overwolf.windows.close(await getCurrentWindowId(), () => {})
}

async function handleMaximize() {
  overwolf.windows.maximize(await getCurrentWindowId(), () => {})
}

  const rawJson = state ? JSON.stringify(state.raw, null, 2) : 'Waiting for data...'
  if (rawJson !== lastRawRef.current) lastRawRef.current = rawJson

  return (
    <div className="w-full h-full flex flex-col bg-ally-bg text-ally-text font-sans">

      {/* Bar 1 — Titlebar */}
<div
          className="w-full h-8 flex-shrink-0 bg-ally-bg border-b border-ally-border flex items-center justify-between"
          style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
        >
        <div
          className="flex items-center px-4 flex-shrink-0"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <svg viewBox="0 0 220 66" fill="none" className="h-5 w-auto">
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
        <div
          className="flex items-center gap-1"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" className="h-5 w-5 text-ally-muted" fill="currentColor"><path d="M524.5 133.8C524.3 133.5 524.1 133.2 523.7 133.1C485.6 115.6 445.3 103.1 404 96C403.6 95.9 403.2 96 402.9 96.1C402.6 96.2 402.3 96.5 402.1 96.9C396.6 106.8 391.6 117.1 387.2 127.5C342.6 120.7 297.3 120.7 252.8 127.5C248.3 117 243.3 106.8 237.7 96.9C237.5 96.6 237.2 96.3 236.9 96.1C236.6 95.9 236.2 95.9 235.8 95.9C194.5 103 154.2 115.5 116.1 133C115.8 133.1 115.5 133.4 115.3 133.7C39.1 247.5 18.2 358.6 28.4 468.2C28.4 468.5 28.5 468.7 28.6 469C28.7 469.3 28.9 469.4 29.1 469.6C73.5 502.5 123.1 527.6 175.9 543.8C176.3 543.9 176.7 543.9 177 543.8C177.3 543.7 177.7 543.4 177.9 543.1C189.2 527.7 199.3 511.3 207.9 494.3C208 494.1 208.1 493.8 208.1 493.5C208.1 493.2 208.1 493 208 492.7C207.9 492.4 207.8 492.2 207.6 492.1C207.4 492 207.2 491.8 206.9 491.7C191.1 485.6 175.7 478.3 161 469.8C160.7 469.6 160.5 469.4 160.3 469.2C160.1 469 160 468.6 160 468.3C160 468 160 467.7 160.2 467.4C160.4 467.1 160.5 466.9 160.8 466.7C163.9 464.4 167 462 169.9 459.6C170.2 459.4 170.5 459.2 170.8 459.2C171.1 459.2 171.5 459.2 171.8 459.3C268 503.2 372.2 503.2 467.3 459.3C467.6 459.2 468 459.1 468.3 459.1C468.6 459.1 469 459.3 469.2 459.5C472.1 461.9 475.2 464.4 478.3 466.7C478.5 466.9 478.7 467.1 478.9 467.4C479.1 467.7 479.1 468 479.1 468.3C479.1 468.6 479 468.9 478.8 469.2C478.6 469.5 478.4 469.7 478.2 469.8C463.5 478.4 448.2 485.7 432.3 491.6C432.1 491.7 431.8 491.8 431.6 492C431.4 492.2 431.3 492.4 431.2 492.7C431.1 493 431.1 493.2 431.1 493.5C431.1 493.8 431.2 494 431.3 494.3C440.1 511.3 450.1 527.6 461.3 543.1C461.5 543.4 461.9 543.7 462.2 543.8C462.5 543.9 463 543.9 463.3 543.8C516.2 527.6 565.9 502.5 610.4 469.6C610.6 469.4 610.8 469.2 610.9 469C611 468.8 611.1 468.5 611.1 468.2C623.4 341.4 590.6 231.3 524.2 133.7zM222.5 401.5C193.5 401.5 169.7 374.9 169.7 342.3C169.7 309.7 193.1 283.1 222.5 283.1C252.2 283.1 275.8 309.9 275.3 342.3C275.3 375 251.9 401.5 222.5 401.5zM417.9 401.5C388.9 401.5 365.1 374.9 365.1 342.3C365.1 309.7 388.5 283.1 417.9 283.1C447.6 283.1 471.2 309.9 470.7 342.3C470.7 375 447.5 401.5 417.9 401.5z"/></svg>
          <button onClick={handleMinimize} className="w-7 h-7 text-ally-muted rounded text-[13px] hover:bg-ally-hover hover:text-ally-text transition-colors">─</button>
          <button onClick={handleMaximize} className="w-7 h-7 text-ally-muted rounded hover:bg-ally-hover hover:text-ally-text transition-colors flex items-center justify-center leading-none"><span className="text-[26px] leading-none text-center">□</span></button>
          <button onClick={handleClose} className="w-7 h-7 text-ally-muted rounded text-[13px] hover:bg-red-900 hover:text-ally-text transition-colors">✕</button>
        </div>
      </div>

      {/* Bar 2 — Nav tabs */}
      <div className="w-full h-8 flex-shrink-0 bg-ally-bg border-b border-ally-border flex items-center justify-center gap-4">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActivePage(tab)}
            className={`px-2 h-full text-[13px] whitespace-nowrap transition-colors ${activePage === tab ? 'text-ally-accent border-b-2 border-ally-accent' : 'text-ally-muted hover:text-ally-text'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Page area */}
      <div className="flex-1 overflow-y-auto bg-ally-bg">
        {activePage === 'In Game' ? (
          <div className="p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2.5 p-3 rounded-lg border border-ally-border bg-ally-card text-[13px]">
              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 transition-colors ${state?.isInGame ? 'bg-green-500' : 'bg-ally-muted'}`} />
              <span className="font-semibold">{state?.isInGame ? 'TFT In Progress' : 'Waiting for TFT...'}</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <StatCard label="Gold" value={state?.gold?.toString() ?? '–'} valueClass="text-yellow-400" />
              <StatCard label="Round Type" value={state?.round_type ?? '–'} />
              <StatCard label="Shop" value={state?.shop_visible ? 'Open' : 'Closed'} valueClass={state?.shop_visible ? 'text-green-400' : 'text-ally-muted'} />
            </div>
            <details className="bg-ally-bg border border-ally-border rounded-lg p-3">
              <summary className="text-[11px] text-ally-muted cursor-pointer select-none">Raw GEP data</summary>
              <pre className="mt-2 font-mono text-[11px] text-ally-muted whitespace-pre-wrap break-all max-h-48 overflow-y-auto">{lastRawRef.current}</pre>
            </details>
          </div>
        ) : activePage === 'Comps' ? (
          <Dashboard />
        ) : activePage === 'Items' ? (
          <ItemsGuide />
        ) : activePage === 'Units' ? (
          <UnitGuide />
        ) : activePage === 'Traits' ? (
          <SynergyGuide />
        ) : activePage === 'Augments' ? (
          <AugmentGuide />
        ) : activePage === 'Team Builder' ? (
          <TeamBuilder />
        ) : activePage === 'Match History' ? (
          <PlayerSearch />
        ) : (
          <div className="flex items-center justify-center h-full">
            <span className="text-ally-muted text-sm">{activePage}</span>
          </div>
        )}
      </div>

    </div>
  )
}
