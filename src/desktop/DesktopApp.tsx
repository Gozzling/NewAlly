import { useEffect } from 'react'
import { HashRouter, Routes, Route, NavLink } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { subscribeToStateSnapshots } from '../services/ipcService'
import { Dashboard } from '../pages/Dashboard'
import { PlayerSearch } from '../pages/PlayerSearch'
import { PlayerAnalytics } from '../pages/PlayerAnalytics'
import { Guides } from '../pages/Guides'
import { Settings } from '../pages/Settings'
import {
  LayoutGrid,
  Search,
  BarChart3,
  BookOpen,
  Settings as SettingsIcon,
  Swords,
} from 'lucide-react'

function getCurrentWindowId(): Promise<string> {
  return new Promise((resolve) => {
    overwolf.windows.getCurrentWindow((r: any) => {
      if (r.status === 'success') resolve(r.window.id)
    })
  })
}

const NAV = [
  { path: '/', label: 'Dashboard', icon: LayoutGrid },
  { path: '/search', label: 'Player Search', icon: Search },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/guides', label: 'Guides', icon: BookOpen },
  { path: '/settings', label: 'Settings', icon: SettingsIcon },
]

function Sidebar() {
  return (
    <nav className="w-52 flex-shrink-0 bg-[#161616] border-r border-[#2a2a2a] flex flex-col">
      <div className="h-12 flex items-center px-4 border-b border-[#2a2a2a]">
        <Swords className="w-5 h-5 text-[#35c3e7] mr-2" />
        <span className="text-sm font-bold text-white tracking-wide">TFT Ally</span>
      </div>

      <div className="flex-1 py-3 space-y-0.5 px-2">
        {NAV.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-colors ${
                isActive
                  ? 'bg-[#252525] text-[#35c3e7] font-medium'
                  : 'text-[#a1a1a1] hover:text-white hover:bg-[#1f1f1f]'
              }`
            }
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

function TitleBar() {
  const state = useAppStore((s) => s.gameState)

  async function handleMinimize() {
    overwolf.windows.minimize(await getCurrentWindowId(), () => {})
  }
  async function handleClose() {
    overwolf.windows.close(await getCurrentWindowId(), () => {})
  }

  return (
    <div
      className="h-9 flex-shrink-0 bg-[#181818] border-b border-[#2a2a2a] flex items-center px-3 gap-3"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <div className="flex items-center gap-2 text-[11px] text-[#a1a1a1]">
        <div
          className={`w-2 h-2 rounded-full ${
            state?.isInGame ? 'bg-green-500 shadow-[0_0_6px_#4caf5088]' : 'bg-neutral-600'
          }`}
        />
        <span>{state?.isInGame ? 'TFT In Progress' : 'Out of Game'}</span>
      </div>
      <div
        className="ml-auto flex gap-1"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <button
          onClick={handleMinimize}
          className="w-7 h-7 text-[#a1a1a1] rounded hover:bg-[#252525] hover:text-white transition-colors flex items-center justify-center text-xs"
        >
          ─
        </button>
        <button
          onClick={handleClose}
          className="w-7 h-7 text-[#a1a1a1] rounded hover:bg-red-900 hover:text-white transition-colors flex items-center justify-center text-xs"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/search" element={<PlayerSearch />} />
      <Route path="/analytics" element={<PlayerAnalytics />} />
      <Route path="/guides" element={<Guides />} />
      <Route path="/settings" element={<Settings />} />
    </Routes>
  )
}

export function DesktopApp() {
  useEffect(() => {
    return subscribeToStateSnapshots()
  }, [])

  return (
    <HashRouter>
      <div className="w-full h-full flex flex-col bg-[#0d0d0d] text-white font-sans">
        <TitleBar />
        <div className="flex-1 flex overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto p-5">
            <AppRoutes />
          </main>
        </div>
      </div>
    </HashRouter>
  )
}
