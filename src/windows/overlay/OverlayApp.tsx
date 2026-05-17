import { useEffect } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { subscribeToStateSnapshots } from '@/services/ipcService'
import { OverlayCompTracker } from './components/OverlayCompTracker'
import { OverlayTraitPanel } from './components/OverlayTraitPanel'
import { OverlayItemPanel } from './components/OverlayItemPanel'
import { OverlayMiniBoard } from './components/OverlayMiniBoard'
import { OverlayShopGuide } from './components/OverlayShopGuide'
import { OverlayCoachPanel } from './components/OverlayCoachPanel'
import { useOverlayRecommendations } from '@/hooks/useOverlayRecommendations'
import type { TftGameState } from '@/types/tft'

function HudBar({
  gold,
  roundType,
  stage,
  health,
}: {
  gold?: number | null
  roundType?: string | null
  stage?: string | null
  health?: number | null
}) {
  return (
    <div className="flex items-center gap-2 bg-[#1f1f1f]/90 border border-[#2a2a2a] rounded-lg px-3 py-1.5 text-[10px] pointer-events-none">
      <span className="text-yellow-400 font-semibold">G: {gold ?? '–'}</span>
      <span className="text-neutral-500">|</span>
      <span className="text-white">{stage ?? '–'}</span>
      <span className="text-neutral-500">|</span>
      <span className="text-[#35c3e7]">{roundType ?? '–'}</span>
      <span className="text-neutral-500">|</span>
      <span className="text-red-400">HP: {health ?? '–'}</span>
    </div>
  )
}

export function OverlayApp() {
  const state = useAppStore((s) => s.gameState) as TftGameState
  const guideModeEnabled = useAppStore((s) => s.guideModeEnabled)
  const toggleGuideMode = useAppStore((s) => s.toggleGuideMode)
  const { recommendations } = useOverlayRecommendations(state)

  useEffect(() => {
    return subscribeToStateSnapshots()
  }, [])

  if (!state?.isInGame) {
    return (
      <div className="w-full h-full flex items-center justify-center pointer-events-none">
        <div className="bg-[#1f1f1f]/90 border border-[#2a2a2a] rounded-lg px-4 py-2 text-[10px] text-neutral-500">
          Waiting for TFT...
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full relative pointer-events-none">
      <div className="flex items-center justify-between mb-2">
        <HudBar
          gold={state.gold}
          roundType={state.round_type}
          health={state.roster.find((p) => p.isLocalPlayer)?.health ?? null}
        />
        <button onClick={() => toggleGuideMode(!guideModeEnabled)} className="text-xs bg-[#35c3e7]/20 hover:bg-[#35c3e7]/30 text-[#35c3e7] hover:text-white transition-colors px-2 py-1 rounded">
          Guide Mode: {guideModeEnabled ? 'On' : 'Off'}
        </button>
      </div>
      <div className="absolute top-14 left-0 w-64 flex flex-col gap-2 p-2 font-sans text-xs pointer-events-none">
        <OverlayCoachPanel recommendations={recommendations} />
        <OverlayCompTracker />
        <OverlayTraitPanel />
        <OverlayMiniBoard />
        <OverlayItemPanel />
        {guideModeEnabled && <OverlayShopGuide />}
      </div>
    </div>
  )
}