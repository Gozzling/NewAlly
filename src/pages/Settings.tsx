import { useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import type { RiotRegion } from '../types/riot'
import { Layers, User, Palette, Bell, Info, Save, ChevronRight, Trash2, Activity } from 'lucide-react'

type Tab = 'overlay' | 'profile' | 'appearance' | 'notifications' | 'about'

export function Settings() {
  const [activeTab, setActiveTab] = useState<Tab>('overlay')

  const storeSettings = useAppStore((s) => s.settings)
  const setStoreSettings = useAppStore((s) => s.setSettings)
  const overlayPanels = useAppStore((s) => s.overlayPanels)
  const setOverlayPanels = useAppStore((s) => s.setOverlayPanels)
  const pipeline = useAppStore((s) => s.pipeline)
  const visionCapture = useAppStore((s) => s.visionCapture)

  const [summonerName, setSummonerName] = useState('')
  const [region, setRegion] = useState<string>(storeSettings.region)
  const [saved, setSaved] = useState(false)

  function handleProfileSave() {
    localStorage.setItem('tft-ally::summoner-name', summonerName.trim())
    localStorage.setItem('tft-ally::region', region)
    setStoreSettings({ region: region as RiotRegion })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleClearCache() {
    const prefix = 'tft-ally::'
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i)
      if (k?.startsWith(prefix) && k !== 'tft-ally::summoner-name' && k !== 'tft-ally::region') {
        localStorage.removeItem(k)
      }
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex h-full" style={{ background: '#0e0e0e' }}>
      {/* Left Nav */}
      <div className="flex-shrink-0 flex flex-col" style={{
        width: '180px',
        background: '#111111',
        borderRight: '1px solid #2a2a2a',
        padding: '16px',
      }}>
        <div style={{ fontSize: '10px', color: '#333', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px' }}>
          Settings
        </div>
        <div className="flex flex-col gap-1">
          {[
            { id: 'overlay' as Tab, label: 'Overlay', icon: Layers },
            { id: 'profile' as Tab, label: 'Profile', icon: User },
            { id: 'appearance' as Tab, label: 'Appearance', icon: Palette },
            { id: 'notifications' as Tab, label: 'Notifications', icon: Bell },
            { id: 'about' as Tab, label: 'About', icon: Info },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 500,
                background: activeTab === tab.id ? 'var(--color-ally-accent)15' : 'transparent',
                color: activeTab === tab.id ? 'var(--color-ally-accent)' : '#555',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.color = '#888'
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.color = '#555'
                }
              }}
            >
              <tab.icon style={{ width: '16px', height: '16px' }} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Right Content */}
      <div className="flex-1 overflow-y-auto" style={{ padding: '16px' }}>
        {activeTab === 'overlay' && (
          <div className="space-y-4">
            <div style={{ fontSize: '10px', color: '#333', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px' }}>
              Overlay Panels
            </div>
            {[
              { key: 'compTracker', label: 'Comp Tracker' },
              { key: 'itemBuilder', label: 'Item Builder' },
              { key: 'augmentGuide', label: 'Augment Guide' },
              { key: 'unitStats', label: 'Unit Stats' },
            ].map((panel) => (
              <div
                key={panel.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  background: '#1a1a1a',
                  border: '1px solid #2a2a2a',
                }}
              >
                <span style={{ fontSize: '13px', color: '#ccc' }}>{panel.label}</span>
                <button
                  onClick={() => setOverlayPanels({ ...overlayPanels, [panel.key]: !overlayPanels[panel.key as keyof typeof overlayPanels] })}
                  style={{
                    width: '40px',
                    height: '22px',
                    borderRadius: '11px',
                    background: overlayPanels[panel.key as keyof typeof overlayPanels] ? 'var(--color-ally-accent)' : '#2a2a2a',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      background: 'white',
                      position: 'absolute',
                      top: '2px',
                      left: overlayPanels[panel.key as keyof typeof overlayPanels] ? '20px' : '2px',
                      transition: 'all 0.2s ease',
                    }}
                  />
                </button>
              </div>
            ))}

            <div style={{ fontSize: '10px', color: '#333', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px', marginTop: '24px' }}>
              Overlay Opacity
            </div>
            <div style={{
              padding: '16px',
              borderRadius: '8px',
              background: '#1a1a1a',
              border: '1px solid #2a2a2a',
            }}>
              <input
                type="range"
                min={20}
                max={100}
                value={storeSettings.overlayOpacity ?? 90}
                onChange={(e) => setStoreSettings({ ...storeSettings, overlayOpacity: Number(e.target.value) })}
                style={{
                  width: '100%',
                  accentColor: 'var(--color-ally-accent)',
                }}
              />
              <div style={{ fontSize: '11px', color: '#555', textAlign: 'right', marginTop: '8px' }}>
                {storeSettings.overlayOpacity ?? 90}%
              </div>
            </div>

            <div style={{ fontSize: '10px', color: '#333', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px', marginTop: '24px' }}>
              Keyboard Shortcuts
            </div>
            <div style={{
              padding: '16px',
              borderRadius: '8px',
              background: '#1a1a1a',
              border: '1px solid #2a2a2a',
            }}>
              <div className="space-y-2">
                {[
                  { action: 'Toggle Overlay', shortcut: 'Ctrl+Shift+O' },
                  { action: 'Show/Hide Desktop', shortcut: 'Ctrl+Shift+D' },
                  { action: 'Reload Data', shortcut: 'Ctrl+Shift+R' },
                ].map((item) => (
                  <div key={item.action} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: '#ccc' }}>{item.action}</span>
                    <span style={{
                      fontSize: '11px',
                      color: 'white',
                      fontFamily: 'monospace',
                      background: '#2a2a2a',
                      padding: '4px 8px',
                      borderRadius: '4px',
                    }}>
                      {item.shortcut}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="space-y-4">
            <div style={{ fontSize: '10px', color: '#333', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px' }}>
              Summoner Profile
            </div>
            <div style={{
              padding: '16px',
              borderRadius: '8px',
              background: '#1a1a1a',
              border: '1px solid #2a2a2a',
            }}>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: '#555', marginBottom: '8px' }}>Summoner Name</div>
                <input
                  type="text"
                  placeholder="Enter your summoner name"
                  value={summonerName}
                  onChange={(e) => setSummonerName(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#111827',
                    border: '1px solid #2a2a2a',
                    borderRadius: '6px',
                    padding: '10px 12px',
                    fontSize: '13px',
                    color: 'white',
                    outline: 'none',
                  }}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: '#555', marginBottom: '8px' }}>Region</div>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#111827',
                    border: '1px solid #2a2a2a',
                    borderRadius: '6px',
                    padding: '10px 12px',
                    fontSize: '13px',
                    color: 'white',
                    outline: 'none',
                  }}
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
              <button
                onClick={handleProfileSave}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'var(--color-ally-accent)',
                  color: 'black',
                  fontWeight: 600,
                  padding: '10px 20px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--color-ally-accent)80'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#35c3e7'
                }}
              >
                <Save style={{ width: '16px', height: '16px' }} />
                Save Profile
              </button>
            </div>

            {saved && (
              <div style={{
                padding: '12px 16px',
                borderRadius: '8px',
                background: 'rgba(74, 222, 128, 0.1)',
                border: '1px solid rgba(74, 222, 128, 0.3)',
                color: '#4ade80',
                fontSize: '13px',
              }}>
                Profile saved successfully.
              </div>
            )}
          </div>
        )}

        {activeTab === 'appearance' && (
          <div className="space-y-4">
            <div style={{ fontSize: '10px', color: '#333', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px' }}>
              Accent Color
            </div>
            <div style={{
              padding: '16px',
              borderRadius: '8px',
              background: '#1a1a1a',
              border: '1px solid #2a2a2a',
            }}>
              <div className="flex gap-2">
                {[
                  { color: '#35c3e7', name: 'Cyan' },
                  { color: '#a855f7', name: 'Purple' },
                  { color: '#f59e0b', name: 'Orange' },
                  { color: '#ef4444', name: 'Red' },
                  { color: '#22c55e', name: 'Green' },
                ].map((accent) => (
                  <button
                    key={accent.color}
                    onClick={() => {
                      setStoreSettings({ accentColor: accent.color })
                      document.documentElement.style.setProperty('--color-ally-accent', accent.color)
                    }}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: accent.color,
                      border: storeSettings.accentColor === accent.color ? '2px solid white' : '2px solid transparent',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  />
                ))}
              </div>
            </div>

            <div style={{ fontSize: '10px', color: '#333', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px', marginTop: '24px' }}>
              Display Density
            </div>
            <div style={{
              padding: '16px',
              borderRadius: '8px',
              background: '#1a1a1a',
              border: '1px solid #2a2a2a',
            }}>
              <div className="flex gap-2">
                <button
                  onClick={() => setStoreSettings({ ...storeSettings, density: 'compact' })}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    border: storeSettings.density === 'compact' ? '1px solid var(--color-ally-accent)40' : '1px solid #2a2a2a',
                    background: storeSettings.density === 'compact' ? 'var(--color-ally-accent)10' : 'transparent',
                    color: storeSettings.density === 'compact' ? 'var(--color-ally-accent)' : '#555',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  Compact
                </button>
                <button
                  onClick={() => setStoreSettings({ ...storeSettings, density: 'comfortable' })}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    border: storeSettings.density === 'comfortable' ? '1px solid var(--color-ally-accent)40' : '1px solid #2a2a2a',
                    background: storeSettings.density === 'comfortable' ? 'var(--color-ally-accent)10' : 'transparent',
                    color: storeSettings.density === 'comfortable' ? 'var(--color-ally-accent)' : '#555',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  Comfortable
                </button>
              </div>
            </div>

            <div style={{ fontSize: '10px', color: '#333', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px', marginTop: '24px' }}>
              Font Size
            </div>
            <div style={{
              padding: '16px',
              borderRadius: '8px',
              background: '#1a1a1a',
              border: '1px solid #2a2a2a',
            }}>
              <input
                type="range"
                min={12}
                max={18}
                value={storeSettings.fontSize ?? 14}
                onChange={(e) => setStoreSettings({ ...storeSettings, fontSize: Number(e.target.value) })}
                style={{
                  width: '100%',
                  accentColor: 'var(--color-ally-accent)',
                }}
              />
              <div style={{ fontSize: '11px', color: '#555', textAlign: 'right', marginTop: '8px' }}>
                {storeSettings.fontSize ?? 14}px
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-4">
            <div style={{ fontSize: '10px', color: '#333', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px' }}>
              Notifications
            </div>
            {[
              { key: 'matchStart', label: 'Match Start Alert' },
              { key: 'roundEnd', label: 'Round End Summary' },
              { key: 'compUpdate', label: 'Comp Update Notifications' },
              { key: 'itemReminder', label: 'Item Build Reminders' },
            ].map((notif) => (
              <div
                key={notif.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  background: '#1a1a1a',
                  border: '1px solid #2a2a2a',
                }}
              >
                <span style={{ fontSize: '13px', color: '#ccc' }}>{notif.label}</span>
                <button
                  onClick={() => setStoreSettings({
                    ...storeSettings,
                    notifications: { ...storeSettings.notifications, [notif.key]: !storeSettings.notifications[notif.key as keyof typeof storeSettings.notifications] }
                  })}
                  style={{
                    width: '40px',
                    height: '22px',
                    borderRadius: '11px',
                    background: storeSettings.notifications[notif.key as keyof typeof storeSettings.notifications] ? 'var(--color-ally-accent)' : '#2a2a2a',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      background: 'white',
                      position: 'absolute',
                      top: '2px',
                      left: storeSettings.notifications[notif.key as keyof typeof storeSettings.notifications] ? '20px' : '2px',
                      transition: 'all 0.2s ease',
                    }}
                  />
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'about' && (
          <div className="space-y-4">
            <div style={{ fontSize: '10px', color: '#333', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px' }}>
              About TFT Ally
            </div>
            <div style={{
              padding: '16px',
              borderRadius: '8px',
              background: '#1a1a1a',
              border: '1px solid #2a2a2a',
            }}>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'white', marginBottom: '8px' }}>
                TFT Ally
              </div>
              <div style={{ fontSize: '13px', color: '#555', marginBottom: '16px' }}>
                <div>Version: 1.0.0-beta</div>
                <div>Set: Space Gods</div>
                <div>Patch: 17.1 (April 2026)</div>
              </div>
              <div style={{ fontSize: '11px', color: '#555', marginBottom: '16px' }}>
                Built with React + Tailwind + TypeScript
              </div>
              <div style={{ fontSize: '11px', color: '#555' }}>
                Data: Riot Games API + Community Dragon
              </div>
            </div>

            <div className="rounded-lg border border-ally-border bg-ally-card p-4">
              <div className="mb-3 flex items-center gap-2 text-caption font-medium uppercase tracking-wider text-ally-muted">
                <Activity className="h-3.5 w-3.5 text-ally-accent" aria-hidden />
                Live diagnostics
              </div>
              <p className="mb-3 text-xs text-ally-muted">
                Game Events (GEP), meta load, and the vision stub (FPS throttle only — no screen pixels yet).
              </p>
              <dl className="space-y-2 text-sm text-ally-text">
                <div className="flex justify-between gap-4">
                  <dt className="text-ally-muted shrink-0">GEP</dt>
                  <dd className="text-right font-medium text-ally-text">
                    {pipeline.gepReady ? (
                      <span className="text-ally-success">Ready</span>
                    ) : (
                      <span className="text-ally-warning">Not ready</span>
                    )}
                  </dd>
                </div>
                {pipeline.lastGepError ? (
                  <div className="rounded-md bg-ally-bg px-2 py-1.5 text-xs text-ally-error">
                    GEP: {pipeline.lastGepError}
                  </div>
                ) : null}
                {pipeline.lastBackgroundError ? (
                  <div className="rounded-md bg-ally-bg px-2 py-1.5 text-xs text-ally-muted">
                    <span className="font-mono text-ally-accent">{pipeline.lastBackgroundError.code}</span>
                    {' — '}
                    {pipeline.lastBackgroundError.message}
                  </div>
                ) : null}
                <div className="flex justify-between gap-4 border-t border-ally-border pt-2">
                  <dt className="text-ally-muted shrink-0">Vision capture</dt>
                  <dd className="text-right">
                    {visionCapture.running ? (
                      <span className="text-ally-accent">Running</span>
                    ) : (
                      <span className="text-ally-muted">Idle</span>
                    )}
                    <span className="ml-2 font-mono text-xs text-ally-muted">
                      {visionCapture.framesThisSession} frames
                    </span>
                  </dd>
                </div>
              </dl>
            </div>

            <div style={{ fontSize: '10px', color: '#333', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px' }}>
              Links
            </div>
            <div style={{
              padding: '16px',
              borderRadius: '8px',
              background: '#1a1a1a',
              border: '1px solid #2a2a2a',
            }}>
              <div className="space-y-2">
                {[
                  { label: 'GitHub Repository', url: 'https://github.com' },
                  { label: 'Discord Community', url: 'https://discord.gg' },
                  { label: 'Report a Bug', url: 'https://github.com/issues' },
                ].map((link) => (
                  <a
                    key={link.label}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      fontSize: '13px',
                      color: 'var(--color-ally-accent)',
                      textDecoration: 'none',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--color-ally-accent)10'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    <span>{link.label}</span>
                    <ChevronRight style={{ width: '16px', height: '16px' }} />
                  </a>
                ))}
              </div>
            </div>

            <div style={{ fontSize: '10px', color: '#333', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px' }}>
              Credits
            </div>
            <div style={{
              padding: '16px',
              borderRadius: '8px',
              background: '#1a1a1a',
              border: '1px solid #2a2a2a',
            }}>
              <div style={{ fontSize: '13px', color: '#555', marginBottom: '8px' }}>
                Developed with ❤️ for the TFT community
              </div>
              <div style={{ fontSize: '11px', color: '#555' }}>
                Special thanks to all contributors and testers
              </div>
            </div>

            <button
              onClick={handleClearCache}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#1a1a1a',
                color: '#555',
                fontWeight: 500,
                padding: '10px 20px',
                borderRadius: '6px',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                border: '1px solid #2a2a2a',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#252525'
                e.currentTarget.style.color = '#888'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#1a1a1a'
                e.currentTarget.style.color = '#555'
              }}
            >
              <Trash2 style={{ width: '16px', height: '16px' }} />
              Clear Cache
            </button>

            {saved && (
              <div style={{
                padding: '12px 16px',
                borderRadius: '8px',
                background: 'rgba(74, 222, 128, 0.1)',
                border: '1px solid rgba(74, 222, 128, 0.3)',
                color: '#4ade80',
                fontSize: '13px',
              }}>
                Cache cleared successfully.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
