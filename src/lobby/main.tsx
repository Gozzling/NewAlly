import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { LobbyApp } from './LobbyApp'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LobbyApp />
  </StrictMode>,
)
