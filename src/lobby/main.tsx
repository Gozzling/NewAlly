import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/styles/globals.css'
import { LobbyApp } from './LobbyApp'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LobbyApp />
  </StrictMode>,
)
