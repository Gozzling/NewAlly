import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/styles/globals.css'
import { GameDataHydrator } from '@/components/GameDataHydrator'
import { DesktopApp } from './DesktopApp'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GameDataHydrator>
      <DesktopApp />
    </GameDataHydrator>
  </StrictMode>,
)
