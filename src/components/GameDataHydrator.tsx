import { useEffect } from 'react'
import { useAppStore } from '@/store/useAppStore'

/** Initial seed hydration + background CDN refresh for unified gameData. */
export function GameDataHydrator({ children }: { children: React.ReactNode }) {
  const loadGameData = useAppStore((s) => s.loadGameData)

  useEffect(() => {
    void loadGameData()
  }, [loadGameData])

  return <>{children}</>
}
