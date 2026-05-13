import { useEffect } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { subscribeToStateSnapshots } from '@/services/ipcService'
import { OverlayCompTracker } from './components/OverlayCompTracker'
import { OverlayTraitPanel } from './components/OverlayTraitPanel'
import { OverlayItemPanel } from './components/OverlayItemPanel'
import { OverlayMiniBoard } from './components/OverlayMiniBoard'
import { OverlayShopGuide } from './components/OverlayShopGuide'
import { OverlayCoachTips } from './components/OverlayCoachTips'

function HudBar({ gold, roundType, stage, health }: { gold?: number; roundType?: string; stage?: string; health?: number }) {
  return (
    <div className="ally-card !bg-ally-card/90 flex items-center gap-2 px-3 py-1.5 text-caption pointer-events-none shadow-card">
      <span className="text-yellow-400 font-semibold font-numbers">G: {gold ?? '–'}</span>
      <span className="text-ally-muted">|</span>
      <span className="text-ally-text font-display uppercase tracking-wider">{stage ?? '–'}</span>
      <span className="text-ally-muted">|</span>
      <span className="text-ally-accent font-display uppercase font-bold">{roundType ?? '–'}</span>
      <span className="text-ally-muted">|</span>
      <span className="text-ally-error font-semibold font-numbers">HP: {health ?? '–'}</span>
    </div>
  )
}

export function OverlayApp() {
  const state = useAppStore((s: any) => s.gameState)
const guideModeEnabled = useAppStore((s) => s.guideModeEnabled);
const toggleGuideMode = useAppStore((s) => s.toggleGuideMode);

  useEffect(() => {
    return subscribeToStateSnapshots()
  }, [])

  if (!state?.isInGame) {
    return (
      <div className="w-full h-full flex items-center justify-center pointer-events-none">
        <div className="ally-card !bg-ally-card/90 px-4 py-2 text-caption text-ally-muted font-display uppercase tracking-widest animate-pulse">
          Waiting for TFT...
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full relative pointer-events-none">
      <div className="flex items-center justify-between mb-2">
        <HudBar gold={state.gold} roundType={state.round_type} stage={state.stage} health={state.health} />
        <button onClick={() => toggleGuideMode(!guideModeEnabled)} className="text-xs bg-ally-accent/20 hover:bg-ally-accent/30 text-ally-accent hover:text-white transition-colors px-2 py-1 rounded pointer-events-auto">
          Guide Mode: {guideModeEnabled ? 'On' : 'Off'}
        </button>
      </div>
      <div className="absolute top-14 left-0 w-64 flex flex-col gap-2 p-2 font-sans text-xs pointer-events-none">
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