import { useCallback, useEffect, useMemo, useRef } from 'react'
import type { AllyRecommendation } from '@ally/shared-types'
import { recommendationsFromGameState } from '@/engine/recommendations'
import {
  getPersonalMatches,
  type PersonalMatchRecord,
} from '@/services/indexedDbService'
import { useAppStore } from '@/store/useAppStore'
import type { TftGameState } from '@/types/tft'

export const OVERLAY_META_VERSION = 'set17'
const PERSONAL_MATCH_LIMIT = 40
const MAX_RECOMMENDATIONS = 4

function summonerBaseName(name: string): string {
  return name.split('#')[0]?.trim().toLowerCase() ?? ''
}

function localPlayerName(gs: TftGameState): string | null {
  const lp = gs.roster.find((p) => p.isLocalPlayer)
  const raw = lp?.name?.trim()
  return raw && raw.length > 0 ? raw : null
}

export function filterPersonalMatchesForSummoner(
  rows: PersonalMatchRecord[],
  summoner: string | null,
): PersonalMatchRecord[] {
  if (!summoner) return rows
  const want = summonerBaseName(summoner)
  if (!want) return rows
  return rows.filter((m) => summonerBaseName(m.summonerName ?? '') === want)
}

export function useOverlayRecommendations(gameState: TftGameState) {
  const personalMatches = useAppStore((s) => s.personalMatches)
  const setPersonalMatches = useAppStore((s) => s.setPersonalMatches)
  const wasInGameRef = useRef(false)

  const refreshPersonalMatchesFromDb = useCallback(async () => {
    try {
      const rows = await getPersonalMatches(PERSONAL_MATCH_LIMIT)
      setPersonalMatches(rows)
    } catch (err) {
      console.warn('[overlay] could not load personal matches from IndexedDB', err)
    }
  }, [setPersonalMatches])

  useEffect(() => {
    if (personalMatches.length > 0) return
    void refreshPersonalMatchesFromDb()
  }, [personalMatches.length, refreshPersonalMatchesFromDb])

  useEffect(() => {
    const inGame = gameState.isInGame
    if (wasInGameRef.current && !inGame) {
      void refreshPersonalMatchesFromDb()
    }
    wasInGameRef.current = inGame
  }, [gameState.isInGame, refreshPersonalMatchesFromDb])

  const recommendations: AllyRecommendation[] = useMemo(() => {
    if (!gameState.isInGame) return []
    const scoped = filterPersonalMatchesForSummoner(
      personalMatches,
      localPlayerName(gameState),
    )
    return recommendationsFromGameState(
      gameState,
      scoped,
      OVERLAY_META_VERSION,
    ).slice(0, MAX_RECOMMENDATIONS)
  }, [gameState, personalMatches])

  return {
    recommendations,
    refreshPersonalMatchesFromDb,
    personalMatchCount: personalMatches.length,
  }
}
