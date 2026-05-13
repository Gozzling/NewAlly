import { useEffect, useMemo, useState, Fragment } from 'react'
import type { Synergy } from '@/data/synergies'
import { useAppStore } from '@/store/useAppStore'

import { Shield, Swords, Zap, Hexagon } from 'lucide-react'
import { SearchInputWithSuggestions } from '@/components/SearchInputWithSuggestions'
import { UnitPortrait } from '@/components/UnitPortrait'
import { traitPortraitUrls } from '@/utils/iconResolver'
import { IconWithFallback } from '@/components/IconWithFallback'
import { useTypewriterPlaceholder } from '@/hooks/useTypewriterPlaceholder'
import { ReferenceDetailModal } from '@/components/ReferenceDetailModal'

/* ─── Design tokens ─── */
const C = {
  bg:         'var(--color-ally-bg)',
  surface:    'var(--color-ally-sidebar)',
  border:     'var(--color-ally-border)',
  accent:     'var(--color-ally-accent)',
  accentDim:  'color-mix(in srgb, var(--color-ally-accent) 15%, transparent)',
  text:       'var(--color-ally-text)',
  muted:      'var(--color-ally-muted)',
  content:    'var(--color-ally-bg)',
}

const TYPE_COLORS: Record<string, { text: string; bg: string; border: string; icon: React.ReactNode }> = {
  offense: { text: '#f87171', bg: 'rgba(248, 113, 113, 0.1)', border: 'rgba(248, 113, 113, 0.2)', icon: <Swords style={{ width: '14px', height: '14px' }} /> },
  defense: { text: '#60a5fa', bg: 'rgba(96, 165, 250, 0.1)', border: 'rgba(96, 165, 250, 0.2)', icon: <Shield style={{ width: '14px', height: '14px' }} /> },
  utility: { text: '#4ade80', bg: 'rgba(74, 222, 128, 0.1)', border: 'rgba(74, 222, 128, 0.2)', icon: <Zap style={{ width: '14px', height: '14px' }} /> },
  hybrid: { text: '#c084fc', bg: 'rgba(192, 132, 252, 0.1)', border: 'rgba(192, 132, 252, 0.2)', icon: <Hexagon style={{ width: '14px', height: '14px' }} /> },
}

interface SynergyGuideProps {
  query: string
  setQuery: (value: string) => void
  typeFilter: string
  setTypeFilter: (value: string) => void
  onSynergySelect: (synergyId: string) => void
  /** Open this trait (name or id), e.g. from global search */
  initialTrait?: string | null
}

const TRAIT_GUIDE_PLACEHOLDER_WORDS = ['Bastion', 'Rogue', 'Sniper', 'Brawler', 'Dark Star']

export function SynergyGuide({ query, setQuery, typeFilter, setTypeFilter, onSynergySelect, initialTrait }: SynergyGuideProps) {
  const traits = useAppStore((s) => s.gameData.traits)
  const [selectedSynergy, setSelectedSynergy] = useState<Synergy | null>(null)

  useEffect(() => {
    if (!initialTrait) return
    const syn = traits.find((s) => s.name === initialTrait || s.id === initialTrait)
    if (syn) setSelectedSynergy(syn)
  }, [initialTrait, traits])

  const { placeholderAnimated: traitsSearchPlaceholder } = useTypewriterPlaceholder(
    traits.length > 0 ? traits.slice(0, 10).map(t => t.name) : TRAIT_GUIDE_PLACEHOLDER_WORDS,
    query.length > 0,
  )

  const filtered = useMemo(() => {
    let list = query ? traits.filter((s) => s.name.toLowerCase().includes(query.toLowerCase()) || s.bestUnits.some((u) => u.toLowerCase().includes(query.toLowerCase()))) : traits
    if (typeFilter !== 'all') list = list.filter((s) => s.type === typeFilter)
    return list
  }, [query, typeFilter, traits])

  const handleSynergyClick = (synergy: Synergy) => {
    onSynergySelect(synergy.id)
    setSelectedSynergy(synergy)
  }

  const handleBack = () => {
    setSelectedSynergy(null)
  }

  return (
    <Fragment>
    <div className="flex h-screen" style={{ animation: 'pageEnter 0.4s cubic-bezier(0.25, 1, 0.5, 1)' }}>
      {/* Left Sidebar */}
      <div className="flex-shrink-0 flex flex-col ally-sidebar" style={{
        padding: '16px',
        width: '200px',
        flexShrink: 0,
        zIndex: 1,
        position: 'relative',
        animation: 'sidebarEnter 0.3s cubic-bezier(0.25, 1, 0.5, 1) 0.1s both',
      }}>
        {/* Search Input */}
        <SearchInputWithSuggestions
          value={query}
          onChange={setQuery}
          placeholder={traitsSearchPlaceholder || 'Search traits…'}
          kinds={['trait']}
          wrapperClassName="w-full mb-6"
          listZIndex={80}
          inputClassName="w-full"
          inputStyle={{
            width: '100%',
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: '6px',
            padding: '7px 10px',
            fontSize: '12px',
            color: 'white',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />

        {/* Type Filter */}
        <div>
          <div className="ally-sidebar-label">
            Type
          </div>
          <div className="flex flex-wrap gap-2">
            {(['all', 'offense', 'defense', 'utility', 'hybrid'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                style={{
                  padding: '3px 10px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  border: typeFilter === type ? '1px solid var(--color-ally-accent)40' : '1px solid #2a2a2a',
                  background: typeFilter === type ? 'var(--color-ally-accent)10' : 'transparent',
                  color: typeFilter === type ? 'var(--color-ally-accent)' : '#555',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Content */}
      <div className="flex-1 overflow-y-auto" style={{
        background: C.content,
        padding: '16px',
        animation: 'contentEnter 0.3s cubic-bezier(0.25, 1, 0.5, 1) 0.15s both',
      }}>
        <div className="flex flex-col gap-2">
          {filtered.map((synergy, index) => (
            <SynergyCard
              key={synergy.id}
              synergy={synergy}
              index={index}
              onClick={() => handleSynergyClick(synergy)}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes pageEnter {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes sidebarEnter {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes contentEnter {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes cardEnter {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes detailEnter {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes thresholdCardEnter {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pillEnter {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>

    <ReferenceDetailModal
      open={Boolean(selectedSynergy)}
      onClose={handleBack}
      ariaLabel={selectedSynergy ? `${selectedSynergy.name} trait details` : 'Trait details'}
    >
      {selectedSynergy ? <SynergyDetail synergy={selectedSynergy} onBack={handleBack} embedded /> : null}
    </ReferenceDetailModal>
    </Fragment>
  )
}

function SynergyCard({ synergy, index, onClick }: { synergy: Synergy; index: number; onClick: () => void }) {
  const typeColors = TYPE_COLORS[synergy.type] ?? TYPE_COLORS.hybrid
  const traitUrls = traitPortraitUrls(synergy.name, synergy.iconUrl)

  return (
    <div
      className="ally-card relative overflow-hidden cursor-pointer flex items-center gap-4 p-3"
      style={{
        animation: `cardEnter 0.4s cubic-bezier(0.25, 1, 0.5, 1) ${index * 40}ms both`,
      }}
      onClick={onClick}
    >
      <IconWithFallback
        urls={traitUrls}
        alt={synergy.name}
        size={36}
        className="h-9 w-9 shrink-0 rounded-md object-cover"
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <div className="text-white text-sm font-bold font-display uppercase tracking-wide truncate">{synergy.name}</div>
          <div
            className="px-1.5 py-0.5 rounded text-[9px] font-bold border"
            style={{
              color: typeColors.text,
              background: typeColors.bg,
              borderColor: typeColors.border,
            }}
          >
            {synergy.type}
          </div>
        </div>
        <div className="text-gray-400 text-xs line-clamp-1 opacity-80">{synergy.description}</div>
      </div>

      <div className="hidden md:flex items-center gap-6 px-4 border-l border-ally-border/50">
        <div className="flex flex-col items-center">
          <div className="text-[9px] text-ally-muted uppercase tracking-tighter mb-1 font-display font-bold">Best Units</div>
          <div className="flex -space-x-2">
            {synergy.bestUnits.slice(0, 3).map((unit) => (
              <UnitPortrait key={unit} name={unit} size={24} radius={12} style={{ border: '1px solid #1f1f1f' }} />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1.5 min-w-[80px] justify-end">
          {synergy.thresholds.map((t) => (
            <div
              key={t.count}
              className="w-5 h-5 rounded-full flex items-center justify-center border border-ally-accent/30 text-ally-accent text-[10px] font-bold font-numbers"
            >
              {t.count}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function SynergyDetail({
  synergy,
  onBack,
  embedded = false,
}: {
  synergy: Synergy
  onBack: () => void
  embedded?: boolean
}) {
  const typeColors = TYPE_COLORS[synergy.type] ?? TYPE_COLORS.hybrid
  const traitUrls = traitPortraitUrls(synergy.name, synergy.iconUrl)

  return (
    <div className="h-full overflow-y-auto" style={{
      background: C.content,
      padding: embedded ? '12px 16px 20px' : '16px',
      animation: 'detailEnter 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
    }}>
      {!embedded ? (
        <button
          onClick={onBack}
          style={{
            marginBottom: '16px',
            padding: '6px 12px',
            fontSize: '13px',
            fontWeight: 500,
            borderRadius: '6px',
            background: 'transparent',
            border: '1px solid transparent',
            color: '#555',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = C.accent
            e.currentTarget.style.borderColor = C.accent
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#555'
            e.currentTarget.style.borderColor = 'transparent'
          }}
        >
          ← Synergies
        </button>
      ) : null}

      {/* Trait Name + Type */}
      <div className="flex items-center gap-4 mb-8" style={{ animation: 'statCardEnter 0.3s cubic-bezier(0.25, 1, 0.5, 1) 0.1s both' }}>
        <IconWithFallback
          urls={traitUrls}
          alt={synergy.name}
          size={40}
          className="h-10 w-10 shrink-0 rounded-lg object-cover"
        />
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'white' }}>{synergy.name}</h2>
        <div
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: typeColors.text,
            background: typeColors.bg,
            border: `1px solid ${typeColors.border}`,
          }}
        >
          {typeColors.icon}
          {synergy.type}
        </div>
      </div>

      {/* Thresholds */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ fontSize: '10px', color: '#333', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px' }}>
          Thresholds
        </div>
        {synergy.thresholds.map((threshold, i) => (
          <div
            key={threshold.count}
            style={{
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '12px',
              background: C.surface,
              border: `1px solid ${C.border}`,
              animation: `thresholdCardEnter 0.3s cubic-bezier(0.25, 1, 0.5, 1) ${0.15 + i * 0.1}s both`,
            }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div
                style={{
                  padding: '4px 12px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  background: C.accentDim,
                  border: `1px solid ${C.accent}`,
                  color: C.accent,
                }}
              >
                {threshold.count}
              </div>
              <div style={{ fontSize: '13px', color: '#ccc' }}>{threshold.effect}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Best Units */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ fontSize: '10px', color: '#333', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px' }}>
          Best Units
        </div>
        <div className="flex gap-4">
          {synergy.bestUnits.map((unit, i) => (
            <div
              key={unit}
              style={{ textAlign: 'center', animation: `pillEnter 0.2s cubic-bezier(0.25, 1, 0.5, 1) ${i * 50}ms both` }}
            >
              <UnitPortrait
                name={unit}
                size={40}
                radius={8}
                className="mx-auto mb-1 border border-ally-border"
              />
              <div style={{ fontSize: '11px', color: '#555' }}>{unit}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Best Comps */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ fontSize: '10px', color: '#333', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px' }}>
          Best Comps
        </div>
        <div className="flex flex-wrap gap-2">
          {['Divine Ascension', 'Arbiter Court', 'Space Groove'].map((comp, i) => (
            <span
              key={comp}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 500,
                background: C.accentDim,
                border: `1px solid ${C.accent}`,
                color: C.accent,
                animation: `pillEnter 0.2s cubic-bezier(0.25, 1, 0.5, 1) ${i * 50}ms both`,
              }}
            >
              {comp}
            </span>
          ))}
        </div>
      </div>

      {/* Counters */}
      <div>
        <div style={{ fontSize: '10px', color: '#333', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px' }}>
          Counters
        </div>
        <div className="flex flex-wrap gap-2">
          {['Anti-Divine', 'Anti-Arbiter', 'Anti-Space'].map((counter, i) => (
            <span
              key={counter}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 500,
                background: 'rgba(248, 113, 113, 0.1)',
                border: '1px solid rgba(248, 113, 113, 0.2)',
                color: '#f87171',
                animation: `pillEnter 0.2s cubic-bezier(0.25, 1, 0.5, 1) ${i * 50}ms both`,
              }}
            >
              {counter}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
