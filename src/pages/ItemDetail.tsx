import { ArrowLeft, Box } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { UnitPortrait } from '@/components/UnitPortrait'
import { itemPortraitUrls } from '@/utils/iconResolver'
import { IconWithFallback } from '@/components/IconWithFallback'

/* ─── Design tokens ─── */
const C = {
  bg:         '#181818',
  surface:    '#1f1f1f',
  border:     '#2a2a2a',
  accent:     'var(--color-ally-accent)',
  accentDim:  'color-mix(in srgb, var(--color-ally-accent) 14%, transparent)',
  text:       '#ffffff',
  muted:      '#a1a1a1',
}

const TIER_COLORS: Record<string, { text: string; bg: string; border: string; hover: string }> = {
  S: { text: '#fbbf24', bg: 'rgba(251, 191, 36, 0.1)', border: 'rgba(251, 191, 36, 0.2)', hover: '#fbbf24' },
  A: { text: '#4ade80', bg: 'rgba(74, 222, 128, 0.1)', border: 'rgba(74, 222, 128, 0.2)', hover: '#4ade80' },
  B: { text: '#60a5fa', bg: 'rgba(96, 165, 250, 0.1)', border: 'rgba(96, 165, 250, 0.2)', hover: '#60a5fa' },
  C: { text: '#9ca3af', bg: 'rgba(156, 163, 175, 0.1)', border: 'rgba(156, 163, 175, 0.2)', hover: '#9ca3af' }
}

const TAG_ICONS: Record<string, React.ReactNode> = {
  offense: <span style={{ fontSize: '12px' }}>⚔️</span>,
  defense: <span style={{ fontSize: '12px' }}>🛡️</span>,
  AP: <span style={{ fontSize: '12px' }}>✨</span>,
  tank: <Box style={{ width: '12px', height: '12px' }} />,
  sustain: <span style={{ fontSize: '12px' }}>❤️</span>,
  mana: <span style={{ fontSize: '12px' }}>⚡</span>,
  hybrid: <span style={{ fontSize: '12px' }}>🎯</span>,
  crit: <span style={{ fontSize: '12px' }}>💥</span>,
  shred: <span style={{ fontSize: '12px' }}>🔪</span>,
  range: <span style={{ fontSize: '12px' }}>🎯</span>,
  AS: <span style={{ fontSize: '12px' }}>⚡</span>,
  grievous: <span style={{ fontSize: '12px' }}>🔥</span>,
  armor: <span style={{ fontSize: '12px' }}>🛡️</span>,
  MR: <span style={{ fontSize: '12px' }}>🔮</span>,
  utility: <span style={{ fontSize: '12px' }}>🔧</span>,
  support: <span style={{ fontSize: '12px' }}>💚</span>,
  heal: <span style={{ fontSize: '12px' }}>💖</span>,
  HP: <span style={{ fontSize: '12px' }}>❤️</span>,
  emblem: <span style={{ fontSize: '12px' }}>🏷️</span>,
  trait: <span style={{ fontSize: '12px' }}>🔗</span>,
  artifact: <span style={{ fontSize: '12px' }}>⚒️</span>,
  anima: <span style={{ fontSize: '12px' }}>🤖</span>,
  divine: <span style={{ fontSize: '12px' }}>✨</span>,
  psionic: <span style={{ fontSize: '12px' }}>🧠</span>,
  core: <span style={{ fontSize: '12px' }}>📦</span>,
  craft: <span style={{ fontSize: '12px' }}>🔧</span>,
}

interface ItemDetailProps {
  itemName: string
  onBack: () => void
  /** Hide back control; used inside ReferenceDetailModal. */
  embedded?: boolean
}

export function ItemDetail({ itemName, onBack, embedded = false }: ItemDetailProps) {
  const items = useAppStore(s => s.gameData.items)
  const item = items.find(i => i.name === itemName)
  if (!item) return null

  const tierColors = TIER_COLORS[item.tier] ?? TIER_COLORS.C

  return (
    <div
      style={{
        padding: embedded ? '16px' : '20px',
        background: C.bg,
        minHeight: embedded ? undefined : '100vh',
        animation: 'pageEnter 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        {!embedded ? (
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
        ) : null}
        <IconWithFallback
          urls={itemPortraitUrls(item.name, item.iconUrl, item.iconSlug)}
          alt={item.name}
          size={44}
          style={{ borderRadius: 8, border: `1px solid ${C.border}` }}
        />
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: C.text }}>{item.name}</h1>
        <span style={{ fontSize: '11px', color: '#6b9aa8', textTransform: 'uppercase' }}>{item.category}</span>
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
          {item.tier} Tier
        </span>
      </div>

      {/* Main Content */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {item.stats ? (
            <div
              style={{
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: '12px',
                padding: '20px',
                animation: `cardEnter 0.3s cubic-bezier(0.25, 1, 0.5, 1) 80ms both`,
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: C.muted, marginBottom: '12px' }}>Stats</div>
              <div style={{ fontSize: '14px', color: '#b8e8f5', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{item.stats}</div>
            </div>
          ) : null}

          <div
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: '12px',
              padding: '20px',
              animation: `cardEnter 0.3s cubic-bezier(0.25, 1, 0.5, 1) 100ms both`,
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: C.muted, marginBottom: '12px' }}>{item.components ? 'Recipe' : 'Source'}</div>
            {item.components ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ flex: 1, textAlign: 'center', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', fontSize: '13px', color: C.text }}>
                  {item.components[0]}
                </div>
                <span style={{ fontSize: '20px', color: C.accent }}>+</span>
                <div style={{ flex: 1, textAlign: 'center', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', fontSize: '13px', color: C.text }}>
                  {item.components[1]}
                </div>
              </div>
            ) : (
              <div style={{ fontSize: '13px', color: '#888', lineHeight: 1.5 }}>Ornn artifact, carousel drop, or Anima Squad reward — not built from the component grid.</div>
            )}
          </div>

          <div
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: '12px',
              padding: '20px',
              animation: `cardEnter 0.3s cubic-bezier(0.25, 1, 0.5, 1) 150ms both`,
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: C.muted, marginBottom: '12px' }}>Effect</div>
            <div style={{ fontSize: '14px', color: '#d1d5db', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{item.effect}</div>
          </div>

          <div
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: '12px',
              padding: '20px',
              animation: `cardEnter 0.3s cubic-bezier(0.25, 1, 0.5, 1) 200ms both`,
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: C.muted, marginBottom: '12px' }}>Tags</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {item.tags.map((tag) => (
                <span key={tag} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: C.surface, borderRadius: '6px', fontSize: '12px', color: C.muted }}>
                  {TAG_ICONS[tag] || <Box style={{ width: '12px', height: '12px' }} />}
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: '12px',
              padding: '20px',
              animation: `cardEnter 0.3s cubic-bezier(0.25, 1, 0.5, 1) 250ms both`,
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: C.muted, marginBottom: '12px' }}>Best On</div>
            {item.bestOn.length === 0 ? (
              <div style={{ fontSize: '13px', color: '#555' }}>—</div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {item.bestOn.map((unit) => (
                  <div key={unit} style={{ position: 'relative' }} title={unit}>
                    <UnitPortrait name={unit} size={48} radius={8} />
                  </div>
                ))}
              </div>
            )}
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
