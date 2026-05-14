import { useEffect } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { subscribeToStateSnapshots } from '@/services/ipcService'
import { OverlayCompTracker } from './components/OverlayCompTracker'
import { OverlayTraitPanel } from './components/OverlayTraitPanel'
import { OverlayItemPanel } from './components/OverlayItemPanel'
import { OverlayMiniBoard } from './components/OverlayMiniBoard'
import { OverlayShopGuide } from './components/OverlayShopGuide'
import { OverlayCoachTips } from './components/OverlayCoachTips'
import { Coins, Crosshair, HeartPulse } from 'lucide-react'

function HudBar({ gold, roundType, stage, health }: { gold?: number; roundType?: string; stage?: string; health?: number }) {
  return (
    <div className="flex items-center gap-3 bg-ally-card/95 border border-ally-border rounded-xl px-3 py-2 text-caption pointer-events-none shadow-card backdrop-blur-sm">
      <span className="flex items-center gap-1.5 text-ally-warning font-semibold font-numbers">
        <Coins className="w-3.5 h-3.5 shrink-0 opacity-90" aria-hidden />
        {gold ?? '–'}
      </span>
      <span className="h-4 w-px bg-ally-border shrink-0" aria-hidden />
      <span className="text-ally-text font-display uppercase tracking-wider font-bold">{stage ?? '–'}</span>
      <span className="h-4 w-px bg-ally-border shrink-0" aria-hidden />
      <span className="flex items-center gap-1 text-ally-accent font-display uppercase tracking-widest font-bold">
        <Crosshair className="w-3.5 h-3.5 shrink-0" aria-hidden />
        {roundType ?? '–'}
      </span>
      <span className="h-4 w-px bg-ally-border shrink-0" aria-hidden />
      <span className="flex items-center gap-1 text-ally-error font-semibold font-numbers">
        <HeartPulse className="w-3.5 h-3.5 shrink-0" aria-hidden />
        {health ?? '–'}
      </span>
    </div>
  )
}

export function OverlayApp() {
  const state = useAppStore((s: any) => s.gameState)
  const guideModeEnabled = useAppStore((s) => s.guideModeEnabled)
  const toggleGuideMode = useAppStore((s) => s.toggleGuideMode)

  useEffect(() => {
    return subscribeToStateSnapshots()
  }, [])

  if (!state?.isInGame) {
    return (
      <div className="w-full h-full flex items-center justify-center pointer-events-none p-4">
        <div className="max-w-sm w-full rounded-xl border border-ally-border bg-ally-card/95 px-5 py-4 text-center shadow-card backdrop-blur-sm animate-ally-page-in">
          <p className="text-caption font-display font-bold uppercase tracking-widest text-ally-muted animate-pulse">
            Waiting for TFT
          </p>
          <p className="mt-2 text-[11px] leading-snug text-ally-muted font-medium">
            Launch a match to show the live HUD: comp tracker, traits, items, and coach tips.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full relative pointer-events-none p-2">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <HudBar gold={state.gold} roundType={state.round_type} stage={state.stage} health={state.health} />
        <button
          type="button"
          onClick={() => toggleGuideMode(!guideModeEnabled)}
          className="rounded-lg border border-ally-accent/40 bg-ally-accent/10 px-3 py-1.5 text-caption font-display font-bold uppercase tracking-widest text-ally-accent transition-all hover:border-ally-accent hover:bg-ally-accent hover:text-ally-bg pointer-events-auto shadow-card"
        >
          Guide {guideModeEnabled ? 'On' : 'Off'}
        </button>
      </div>
      <div className="absolute top-[4.5rem] left-0 w-[17.5rem] flex flex-col gap-3 p-1 font-sans text-xs pointer-events-none">
        <OverlayCompTracker />
        <OverlayTraitPanel />
        <OverlayMiniBoard />
        <OverlayItemPanel />
        <OverlayCoachTips />
        {guideModeEnabled && <OverlayShopGuide />}
      </div>
    </div>
  )
}