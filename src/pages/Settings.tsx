import { useState, useEffect } from 'react'
import { useAppStore } from '../store/useAppStore'
import type { RiotRegion } from '../types/riot'
import { Key, Globe, Moon, Sun, Save, Trash2, AlertCircle, Info, Keyboard, Layers, Database } from 'lucide-react'

export function Settings() {
  const storeSettings = useAppStore((s) => s.settings)
  const setStoreSettings = useAppStore((s) => s.setSettings)

  const [apiKey, setApiKey] = useState('')
  const [region, setRegion] = useState<string>(storeSettings.region)
  const [theme, setTheme] = useState<string>(storeSettings.theme)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setApiKey(localStorage.getItem('tft-ally::riot-api-key') ?? '')
    setRegion(storeSettings.region)
    setTheme(storeSettings.theme)
  }, [storeSettings])

  function handleSave() {
    setError(null)
    if (!apiKey.trim()) {
      setError('API key is required for player search and analytics.')
      return
    }
    localStorage.setItem('tft-ally::riot-api-key', apiKey.trim())
    localStorage.setItem('tft-ally::region', region)
    localStorage.setItem('tft-ally::theme', theme)
    setStoreSettings({ region: region as RiotRegion, theme: theme as 'dark' | 'light' })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleClearCache() {
    const prefix = 'tft-ally::'
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i)
      if (k?.startsWith(prefix) && k !== 'tft-ally::riot-api-key' && k !== 'tft-ally::region' && k !== 'tft-ally::theme') {
        localStorage.removeItem(k)
      }
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="max-w-xl space-y-5">
      {error && (
        <div className="flex items-center gap-2 bg-red-950/30 border border-red-900/40 rounded-lg px-4 py-3 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {saved && (
        <div className="bg-green-950/30 border border-green-900/40 rounded-lg px-4 py-3 text-green-400 text-sm">
          Settings saved successfully.
        </div>
      )}

      {/* API Key */}
      <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Key className="w-4 h-4 text-[#35c3e7]" />
          Riot API Key
        </div>
        <p className="text-[11px] text-[#a1a1a1]">
          Get your dev key from{' '}
          <a
            href="https://developer.riotgames.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#35c3e7] hover:underline"
          >
            developer.riotgames.com
          </a>
          . It expires every 24 hours.
        </p>
        <input
          type="password"
          placeholder="RGAPI-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          className="w-full bg-[#181818] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#555] focus:outline-none focus:border-[#35c3e7]"
        />
      </div>

      {/* Region */}
      <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Globe className="w-4 h-4 text-[#35c3e7]" />
          Default Region
        </div>
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="w-full bg-[#181818] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#35c3e7]"
        >
          <option value="na1">NA</option>
          <option value="euw1">EUW</option>
          <option value="eun1">EUNE</option>
          <option value="kr">KR</option>
          <option value="br1">BR</option>
          <option value="jp1">JP</option>
          <option value="la1">LAN</option>
          <option value="la2">LAS</option>
          <option value="oc1">OCE</option>
          <option value="tr1">TR</option>
          <option value="ru">RU</option>
        </select>
      </div>

      {/* Theme */}
      <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">Theme</div>
        <div className="flex gap-2">
          <button
            onClick={() => setTheme('dark')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm border transition-colors ${
              theme === 'dark'
                ? 'bg-[#252525] border-[#35c3e7] text-white'
                : 'border-[#2a2a2a] text-[#a1a1a1] hover:text-white'
            }`}
          >
            <Moon className="w-4 h-4" /> Dark
          </button>
          <button
            onClick={() => setTheme('light')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm border transition-colors ${
              theme === 'light'
                ? 'bg-[#252525] border-[#35c3e7] text-white'
                : 'border-[#2a2a2a] text-[#a1a1a1] hover:text-white'
            }`}
          >
            <Sun className="w-4 h-4" /> Light
          </button>
        </div>
      </div>

      {/* Data Source */}
      <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Database className="w-4 h-4 text-[#35c3e7]" />
          Data Source
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setStoreSettings({ ...storeSettings, dataSource: 'live' })}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm border transition-colors ${
              storeSettings.dataSource === 'live'
                ? 'bg-[#252525] border-[#35c3e7] text-white'
                : 'border-[#2a2a2a] text-[#a1a1a1] hover:text-white'
            }`}
          >
            <Globe className="w-4 h-4" /> Live API
          </button>
          <button
            onClick={() => setStoreSettings({ ...storeSettings, dataSource: 'static' })}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm border transition-colors ${
              storeSettings.dataSource === 'static'
                ? 'bg-[#252525] border-[#35c3e7] text-white'
                : 'border-[#2a2a2a] text-[#a1a1a1] hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" /> Static
          </button>
        </div>
      </div>

      {/* Overlay Opacity */}
      <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Info className="w-4 h-4 text-[#35c3e7]" />
          Overlay Opacity
        </div>
        <input
          type="range"
          min={20}
          max={100}
          value={storeSettings.overlayOpacity ?? 90}
          onChange={(e) => setStoreSettings({ ...storeSettings, overlayOpacity: Number(e.target.value) })}
          className="w-full accent-[#35c3e7]"
        />
        <div className="text-[11px] text-neutral-400 text-right">{storeSettings.overlayOpacity ?? 90}%</div>
      </div>

      {/* Keyboard Shortcuts */}
      <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Keyboard className="w-4 h-4 text-[#35c3e7]" />
          Keyboard Shortcuts
        </div>
        <div className="space-y-1 text-[11px] text-neutral-400">
          <div className="flex justify-between"><span>Toggle Overlay</span><span className="text-white font-mono bg-[#2a2a2a] px-1.5 py-0.5 rounded">Ctrl+Shift+O</span></div>
          <div className="flex justify-between"><span>Show/Hide Desktop</span><span className="text-white font-mono bg-[#2a2a2a] px-1.5 py-0.5 rounded">Ctrl+Shift+D</span></div>
          <div className="flex justify-between"><span>Reload Data</span><span className="text-white font-mono bg-[#2a2a2a] px-1.5 py-0.5 rounded">Ctrl+Shift+R</span></div>
        </div>
      </div>

      {/* About */}
      <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-xl p-4 space-y-2">
        <div className="text-sm font-semibold text-white">About TFT Ally</div>
        <div className="text-[11px] text-neutral-400">
          <p>Version: 1.0.0-beta &middot; Set 17: Space Gods</p>
          <p>Patch: 17.1 (April 2026)</p>
          <p>Built with React + Tailwind + TypeScript</p>
          <p>Data: Riot Games API + Community Dragon</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 bg-[#35c3e7] hover:bg-[#2aa8c8] text-black font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors"
        >
          <Save className="w-4 h-4" /> Save Settings
        </button>
        <button
          onClick={handleClearCache}
          className="flex items-center gap-2 bg-[#1f1f1f] hover:bg-[#252525] border border-[#2a2a2a] text-[#a1a1a1] font-medium px-5 py-2.5 rounded-lg text-sm transition-colors"
        >
          <Trash2 className="w-4 h-4" /> Clear Cache
        </button>
      </div>
    </div>
  )
}
