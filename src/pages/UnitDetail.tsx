import { ArrowLeft } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { UnitPortrait } from '@/components/UnitPortrait'
import { resolveUnitIconUrl } from '@/utils/resolveUnitIcon'

/* ─── Design tokens ─── */
const C = {
  bg:         '#181818',
  surface:    'var(--color-ally-card)',
  border:     '#2a2a2a',
  accent:     'var(--color-ally-accent)',
  accentDim:  'color-mix(in srgb, var(--color-ally-accent) 14%, transparent)',
  text:       '#ffffff',
  muted:      '#a1a1a1',
}

const TIER_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  S: { text: '#fbbf24', bg: 'rgba(251, 191, 36, 0.1)', border: 'rgba(251, 191, 36, 0.3)' },
  A: { text: '#4ade80', bg: 'rgba(74, 222, 128, 0.1)', border: 'rgba(74, 222, 128, 0.3)' },
  B: { text: '#60a5fa', bg: 'rgba(96, 165, 250, 0.1)', border: 'rgba(96, 165, 250, 0.3)' },
  C: { text: '#9ca3af', bg: 'rgba(156, 163, 175, 0.1)', border: 'rgba(156, 163, 175, 0.3)' },
  D: { text: '#f87171', bg: 'rgba(248, 113, 113, 0.1)', border: 'rgba(248, 113, 113, 0.3)' },
}

const COST_COLORS: Record<number, string> = {
  1: '#9aa4af',
  2: '#34d399',
  3: '#60a5fa',
  4: '#c084fc',
  5: '#f59e0b',
}

interface UnitDetailProps {
  unitId: string
  onBack: () => void
}

export function UnitDetail({ unitId, onBack }: UnitDetailProps) {
  const champions = useAppStore(s => s.gameData.champions)
  const unit = champions.find((u) => u.id === unitId)
  if (!unit) return null

  const tierColors = TIER_COLORS[unit.tier] ?? TIER_COLORS.C

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
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: C.text }}>{unit.name}</h1>
      </div>

      {/* Main Content */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        {/* Left Column - Basic Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Unit Card */}
          <div
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: '12px',
              padding: '24px',
              animation: `cardEnter 0.3s cubic-bezier(0.25, 1, 0.5, 1) 100ms both`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <UnitPortrait
                name={unit.name}
                size={80}
                radius={12}
                cdnUrl={resolveUnitIconUrl(unit)}
                style={{
                  boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '20px', fontWeight: 700, color: C.text, marginBottom: '8px' }}>{unit.name}</div>
                <div style={{ fontSize: '12px', color: C.accent, marginBottom: '4px' }}>{unit.traits.join(' / ')}</div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      fontWeight: 700,
                      color: '#fff',
                      background: COST_COLORS[unit.cost],
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    }}
                  >
                    {unit.cost}
                  </div>
                  <span
                    style={{
                      padding: '4px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 700,
                      color: tierColors.text,
                      background: tierColors.bg,
                      border: `1px solid ${tierColors.border}`,
                    }}
                  >
                    {unit.tier} Tier
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: '12px',
              padding: '20px',
              animation: `cardEnter 0.3s cubic-bezier(0.25, 1, 0.5, 1) 150ms both`,
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: C.muted, marginBottom: '16px' }}>Stats</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                <div style={{ fontSize: '24px', fontWeight: 700, color: C.text }}>{unit.stats.hp}</div>
                <div style={{ fontSize: '11px', color: C.muted, marginTop: '4px' }}>HP</div>
              </div>
              <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                <div style={{ fontSize: '24px', fontWeight: 700, color: C.text }}>{unit.stats.ad}</div>
                <div style={{ fontSize: '11px', color: C.muted, marginTop: '4px' }}>AD</div>
              </div>
              <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                <div style={{ fontSize: '24px', fontWeight: 700, color: C.text }}>{unit.stats.ap}</div>
                <div style={{ fontSize: '11px', color: C.muted, marginTop: '4px' }}>AP</div>
              </div>
              <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                <div style={{ fontSize: '24px', fontWeight: 700, color: C.text }}>{unit.stats.atkSpeed}</div>
                <div style={{ fontSize: '11px', color: C.muted, marginTop: '4px' }}>AS</div>
              </div>
              <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                <div style={{ fontSize: '24px', fontWeight: 700, color: C.text }}>{unit.stats.armor}/{unit.stats.mr}</div>
                <div style={{ fontSize: '11px', color: C.muted, marginTop: '4px' }}>Armor/MR</div>
              </div>
              <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                <div style={{ fontSize: '24px', fontWeight: 700, color: C.text }}>{unit.stats.range}</div>
                <div style={{ fontSize: '11px', color: C.muted, marginTop: '4px' }}>Range</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Ability & Recommendations */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Ability */}
          <div
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: '12px',
              padding: '20px',
              animation: `cardEnter 0.3s cubic-bezier(0.25, 1, 0.5, 1) 200ms both`,
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: C.muted, marginBottom: '12px' }}>Ability</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: C.accent, marginBottom: '8px' }}>{unit.ability.name}</div>
            <div style={{ fontSize: '14px', color: '#d1d5db', lineHeight: 1.6, marginBottom: '8px', whiteSpace: 'pre-line' }}>{unit.ability.description}</div>
            <div style={{ fontSize: '13px', color: C.muted, fontStyle: 'italic' }}>{unit.ability.damage}</div>
          </div>

          {/* Best Items */}
          <div
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: '12px',
              padding: '20px',
              animation: `cardEnter 0.3s cubic-bezier(0.25, 1, 0.5, 1) 250ms both`,
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: C.muted, marginBottom: '12px' }}>Best Items</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {unit.bestItems.map((item) => (
                <span key={item} style={{ padding: '6px 12px', background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.2)', borderRadius: '6px', fontSize: '13px', color: '#fbbf24', fontWeight: 600 }}>{item}</span>
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
              animation: `cardEnter 0.3s cubic-bezier(0.25, 1, 0.5, 1) 300ms both`,
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: C.muted, marginBottom: '12px' }}>Best Comps</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {unit.bestComps.map((comp) => (
                <span key={comp} style={{ padding: '6px 12px', background: C.accentDim, borderRadius: '6px', fontSize: '13px', color: C.accent, fontWeight: 600 }}>{comp}</span>
              ))}
            </div>
          </div>
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
