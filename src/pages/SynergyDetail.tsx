import { ArrowLeft } from 'lucide-react'
import { SYNERGIES } from '../data/synergies'

/* ─── Design tokens ─── */
const C = {
  bg:         '#181818',
  surface:    '#1f1f1f',
  border:     '#2a2a2a',
  accent:     '#00d4ff',
  accentDim:  'rgba(0,212,255,0.12)',
  text:       '#ffffff',
  muted:      '#a1a1a1',
}

const TYPE_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  offense: { text: '#f87171', bg: 'rgba(248, 113, 113, 0.1)', border: 'rgba(248, 113, 113, 0.2)' },
  defense: { text: '#60a5fa', bg: 'rgba(96, 165, 250, 0.1)', border: 'rgba(96, 165, 250, 0.2)' },
  utility: { text: '#4ade80', bg: 'rgba(74, 222, 128, 0.1)', border: 'rgba(74, 222, 128, 0.2)' },
  hybrid: { text: '#c084fc', bg: 'rgba(192, 132, 252, 0.1)', border: 'rgba(192, 132, 252, 0.2)' },
}

interface SynergyDetailProps {
  synergyId: string
  onBack: () => void
}

export function SynergyDetail({ synergyId, onBack }: SynergyDetailProps) {
  const synergy = SYNERGIES.find((s) => s.id === synergyId)
  if (!synergy) return null

  const typeColors = TYPE_COLORS[synergy.type] ?? TYPE_COLORS.hybrid

  return (
    <div style={{ padding: '20px', background: C.bg, minHeight: '100vh', animation: 'pageEnter 0.3s cubic-bezier(0.25, 1, 0.5, 1)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: '8px',
            color: C.text,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = C.accent
            e.currentTarget.style.background = C.accentDim
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = C.border
            e.currentTarget.style.background = C.surface
          }}
        >
          <ArrowLeft style={{ width: '16px', height: '16px' }} />
          <span style={{ fontSize: '13px', fontWeight: 600 }}>Back</span>
        </button>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: C.text }}>{synergy.name}</h1>
        <span
          style={{
            padding: '4px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 600,
            color: typeColors.text,
            background: typeColors.bg,
            border: `1px solid ${typeColors.border}`,
          }}
        >
          {synergy.type}
        </span>
      </div>

      {/* Main Content */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Description */}
          <div
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: '12px',
              padding: '20px',
              animation: `cardEnter 0.3s cubic-bezier(0.25, 1, 0.5, 1) 100ms both`,
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: C.muted, marginBottom: '12px' }}>Description</div>
            <div style={{ fontSize: '14px', color: '#d1d5db', lineHeight: 1.6 }}>{synergy.description}</div>
          </div>

          {/* Thresholds */}
          <div
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: '12px',
              padding: '20px',
              animation: `cardEnter 0.3s cubic-bezier(0.25, 1, 0.5, 1) 150ms both`,
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: C.muted, marginBottom: '12px' }}>Thresholds</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {synergy.thresholds.map((t) => (
                <div
                  key={t.count}
                  style={{
                    padding: '12px',
                    background: C.accentDim,
                    border: `1px solid ${C.accent}40`,
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: C.accent,
                  }}
                >
                  <span style={{ fontWeight: 700 }}>{t.count}</span> — {t.effect}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Best Units */}
          <div
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: '12px',
              padding: '20px',
              animation: `cardEnter 0.3s cubic-bezier(0.25, 1, 0.5, 1) 200ms both`,
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: C.muted, marginBottom: '12px' }}>Best Units</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              {synergy.bestUnits.map((u) => (
                <div key={u} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                  <img
                    src={`/unit-icons/${u}.webp`}
                    alt={u}
                    style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }}
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                  <div style={{ fontSize: '11px', color: C.muted, maxWidth: '60px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Best Comps */}
          <div
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: '12px',
              padding: '20px',
              animation: `cardEnter 0.3s cubic-bezier(0.25, 1, 0.5, 1) 250ms both`,
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: C.muted, marginBottom: '12px' }}>Best Comps</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {synergy.bestComps.map((c) => (
                <span key={c} style={{ padding: '6px 12px', background: 'rgba(251, 191, 36, 0.1)', borderRadius: '6px', fontSize: '13px', color: '#fbbf24', fontWeight: 600 }}>{c}</span>
              ))}
            </div>
          </div>

          {/* Counters */}
          {synergy.counters.length > 0 && (
            <div
              style={{
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: '12px',
                padding: '20px',
                animation: `cardEnter 0.3s cubic-bezier(0.25, 1, 0.5, 1) 300ms both`,
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: C.muted, marginBottom: '12px' }}>Counters</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {synergy.counters.map((c) => (
                  <span key={c} style={{ padding: '6px 12px', background: 'rgba(248, 113, 113, 0.1)', borderRadius: '6px', fontSize: '13px', color: '#f87171', fontWeight: 600 }}>{c}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pageEnter {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes cardEnter {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
      `}</style>
    </div>
  )
}
