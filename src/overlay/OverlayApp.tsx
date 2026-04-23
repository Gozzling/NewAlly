import { useEffect } from 'react'
import { useAppStore } from '../store/useAppStore'
import { subscribeToStateSnapshots } from '../services/ipcService'
import { HudPanel }     from './components/HudPanel'
import { DebugRoster }  from './components/DebugRoster'
import { DebugBoard }   from './components/DebugBoard'
import { CompTracker }  from './components/CompTracker'
import { ItemTracker }  from './components/ItemTracker'

export function OverlayApp() {
  const state = useAppStore((s: any) => s.gameState)

  useEffect(() => {
    return subscribeToStateSnapshots()
  }, [])

  return (
    <div className="w-full h-full relative pointer-events-none">
      <HudPanel
        gold={state.gold}
        roundType={state.round_type}
        shopVisible={state.shop_visible}
      />
      <div className="absolute top-20 left-4 flex flex-col gap-3 font-mono text-xs text-neutral-200 pointer-events-none">
        <DebugRoster roster={state.roster} />
        <DebugBoard board={state.board} />
        <CompTracker tracker={state.activeCompTracker} />
        <ItemTracker tracker={state.itemTracker} />
      </div>
    </div>
  )
}
