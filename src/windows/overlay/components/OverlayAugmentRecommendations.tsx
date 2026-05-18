import { AugmentRecommendationsPanel } from '@/components/AugmentRecommendationsPanel'
import { useStabilizedOverlayIntent } from '@/hooks/useIntentAugmentRecommendations'
import type { TftGameState } from '@/types/tft'

type OverlayAugmentRecommendationsProps = {
  gameState: TftGameState
}

export function OverlayAugmentRecommendations({ gameState }: OverlayAugmentRecommendationsProps) {
  const blended = useStabilizedOverlayIntent(gameState)

  if (!gameState.isInGame) return null

  return (
    <AugmentRecommendationsPanel
      intent={blended.primary}
      blendedIntent={blended}
      compact
      compressionMode
      gameState={gameState}
      surface="overlay"
      limit={3}
      className="pointer-events-none"
    />
  )
}
