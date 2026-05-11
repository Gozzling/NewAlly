import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/styles/globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'
import { LobbyApp } from './LobbyApp'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <LobbyApp />
    </ThemeProvider>
  </StrictMode>,
)
