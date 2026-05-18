import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/styles/globals.css'
import { GameDataHydrator } from '@/components/GameDataHydrator'
import { ThemeProvider } from '@/components/ThemeProvider'
import { OverlayApp } from './OverlayApp'

// Set transparent background for overlay
document.body.style.background = 'transparent'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <GameDataHydrator>
        <OverlayApp />
      </GameDataHydrator>
    </ThemeProvider>
  </StrictMode>,
)
