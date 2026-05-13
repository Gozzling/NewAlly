import { useEffect, useMemo, useState, Fragment } from 'react'
import { useAppStore } from '@/store/useAppStore'
import type { Augment } from '@/data/augments'
import { augmentPortraitUrls } from '@/utils/iconResolver'
import { IconWithFallback } from '@/components/IconWithFallback'
import { SearchInputWithSuggestions } from '@/components/SearchInputWithSuggestions'
import { useTypewriterPlaceholder } from '@/hooks/useTypewriterPlaceholder'
import { ReferenceDetailModal } from '@/components/ReferenceDetailModal'

/* ─── Design tokens ─── */
const C = {
  bg:         'var(--color-ally-bg)',
  surface:    'var(--color-ally-sidebar)',
  border:     'var(--color-ally-border)',
  accent:     'var(--color-ally-accent)',
  accentDim:  'color-mix(in srgb, var(--color-ally-accent) 16%, transparent)',
  text:       'var(--color-ally-text)',
  muted:      'var(--color-ally-muted)',
  content:    'var(--color-ally-bg)',
}

const TIER_COLORS: Record<string, { text: string; bg: string; border: string; accent: string; glow: string }> = {
  prismatic: { text: '#a855f7', bg: 'rgba(168, 85, 247, 0.1)', border: 'rgba(168, 85, 247, 0.3)', accent: '#a855f7', glow: '0 0 16px rgba(168, 85, 247, 0.15)' },
  gold: { text: '#f0b429', bg: 'rgba(240, 180, 41, 0.1)', border: 'rgba(240, 180, 41, 0.3)', accent: '#f0b429', glow: 'none' },
  silver: { text: '#9aa4af', bg: 'rgba(154, 164, 175, 0.1)', border: 'rgba(154, 164, 175, 0.3)', accent: '#9aa4af', glow: 'none' }
}


interface AugmentGuideProps {
  query: string
  setQuery: (value: string) => void
  tierFilter: string
  setTierFilter: (value: string) => void
  tagFilter: string
  setTagFilter: (value: string) => void
  onAugmentSelect: (augmentId: string) => void
  initialAugment?: string | null
}

const AUGMENT_GUIDE_PLACEHOLDER_WORDS = ['Prismatic', 'Divine Right', 'Space Groove']

export function AugmentGuide({ query, setQuery, tierFilter, setTierFilter, tagFilter, setTagFilter, onAugmentSelect, initialAugment }: AugmentGuideProps) {
  const augments = useAppStore((s) => s.gameData.augments)
  const [selectedAugment, setSelectedAugment] = useState<Augment | null>(null)

  const augmentTagOptions = useMemo(() => {
    const tags = new Set<string>()
    for (const a of augments) {
      for (const t of a.tags) tags.add(t)
    }
    return ["all", ...[...tags].sort((a, b) => a.localeCompare(b))]
  }, [augments])

  useEffect(() => {
    if (!initialAugment) return
    const a = augments.find((x) => x.name === initialAugment || x.id === initialAugment)
    if (a) setSelectedAugment(a)
  }, [initialAugment, augments])

  const { placeholderAnimated: augmentsSearchPlaceholder } = useTypewriterPlaceholder(
    augments.length > 0 ? augments.slice(0, 10).map(a => a.name) : AUGMENT_GUIDE_PLACEHOLDER_WORDS,
    query.length > 0,
  )

  const filtered = useMemo(() => {
    let list = query ? augments.filter(a =>
      a.name.toLowerCase().includes(query.toLowerCase()) ||
      a.description.toLowerCase().includes(query.toLowerCase()) ||
      a.tags.some(t => t.toLowerCase().includes(query.toLowerCase()))
    ) : [...augments]

    if (tierFilter !== 'all') {
      list = list.filter(a => a.tier === tierFilter)
    }

    if (tagFilter !== 'all') {
      list = list.filter(a => a.tags.includes(tagFilter))
    }

    const tierOrder = { prismatic: 0, gold: 1, silver: 2 }
    return list.sort((a, b) => tierOrder[a.tier] - tierOrder[b.tier])
  }, [query, tierFilter, tagFilter, augments])

  const handleAugmentClick = (augment: Augment) => {
    onAugmentSelect(augment.id)
    setSelectedAugment(augment)
  }

  const handleBack = () => {
    setSelectedAugment(null)
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
          placeholder={augmentsSearchPlaceholder || 'Search augments…'}
          kinds={['augment']}
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

        {/* Tier Filter */}
        <div>
          <div className="ally-sidebar-label">
            Tier
          </div>
          <div className="flex flex-wrap gap-2">
            {(['all', 'prismatic', 'gold', 'silver'] as const).map((tier) => (
              <button
                key={tier}
                onClick={() => setTierFilter(tier)}
                style={{
                  padding: '3px 10px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  border: tierFilter === tier ? '1px solid #35c3e740' : '1px solid #1a1a2e',
                  background: tierFilter === tier ? '#35c3e710' : 'transparent',
                  color: tierFilter === tier ? '#35c3e7' : '#555',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {tier.charAt(0).toUpperCase() + tier.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Tag Filter */}
        <div>
          <div className="ally-sidebar-label">
            Tag
          </div>
          <div className="flex flex-wrap gap-2">
            {augmentTagOptions.map((tag) => (
              <button
                key={tag}
                onClick={() => setTagFilter(tag)}
                style={{
                  padding: '3px 10px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  border: tagFilter === tag ? '1px solid #35c3e740' : '1px solid #2a2a2a',
                  background: tagFilter === tag ? '#35c3e710' : 'transparent',
                  color: tagFilter === tag ? '#35c3e7' : '#555',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {tag}
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
          {filtered.map((augment, index) => (
            <AugmentCard
              key={augment.id}
              augment={augment}
              index={index}
              onClick={() => handleAugmentClick(augment)}
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
        @keyframes statCardEnter {
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
      open={Boolean(selectedAugment)}
      onClose={handleBack}
      ariaLabel={selectedAugment ? `${selectedAugment.name} augment details` : 'Augment details'}
    >
      {selectedAugment ? <AugmentDetail augment={selectedAugment} onBack={handleBack} embedded /> : null}
    </ReferenceDetailModal>
    </Fragment>
  )
}

function AugmentCard({ augment, index, onClick }: { augment: Augment; index: number; onClick: () => void }) {
  const tierColors = TIER_COLORS[augment.tier] ?? TIER_COLORS.silver

  return (
    <div
      className="ally-card relative overflow-hidden cursor-pointer flex items-center gap-4 p-3"
      style={{
        animation: `cardEnter 0.4s cubic-bezier(0.25, 1, 0.5, 1) ${index * 40}ms both`,
        borderLeft: `3px solid ${tierColors.accent}`,
      }}
      onClick={onClick}
    >
      <IconWithFallback
        urls={augmentPortraitUrls(augment.name, augment.iconUrl)}
        alt={augment.name}
        size={36}
        style={{ borderRadius: 6, flexShrink: 0 }}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <div className="text-white text-sm font-bold font-display uppercase tracking-wide truncate">{augment.name}</div>
          <div
            className="px-1.5 py-0.5 rounded text-[9px] font-bold border"
            style={{
              color: tierColors.text,
              background: tierColors.bg,
              borderColor: tierColors.border,
            }}
          >
            {augment.tier}
          </div>
        </div>
        <div className="text-gray-400 text-xs line-clamp-1 opacity-80">{augment.description}</div>
      </div>

      <div className="hidden md:flex items-center gap-4 px-4 border-l border-ally-border/50">
        <div className="flex flex-col items-center">
          <div className="text-sm font-bold font-numbers" style={{ color: augment.winRate > 52 ? '#22c55e' : augment.winRate < 50 ? '#ef4444' : '#fbbf24' }}>
            {augment.winRate}%
          </div>
          <div className="text-[9px] text-ally-muted uppercase tracking-tighter font-display font-bold">Win Rate</div>
        </div>
        <div className="flex flex-col items-center">
          <div className="text-sm font-bold font-numbers text-ally-text">#{augment.avgPlacement}</div>
          <div className="text-[9px] text-ally-muted uppercase tracking-tighter font-display font-bold">Avg Place</div>
        </div>
        <div className="flex flex-col items-center min-w-[50px]">
          <div className="text-sm font-bold font-numbers text-ally-text">{augment.pickRate}%</div>
          <div className="text-[9px] text-ally-muted uppercase tracking-tighter font-display font-bold">Pick</div>
        </div>
      </div>
    </div>
  )
}

function AugmentDetail({ augment, onBack, embedded = false }: { augment: Augment; onBack: () => void; embedded?: boolean }) {
  const tierColors = TIER_COLORS[augment.tier] ?? TIER_COLORS.silver

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
          ← Augments
        </button>
      ) : null}

      {/* Augment Name + Tier */}
      <div className="flex items-center gap-4 mb-8" style={{ animation: 'statCardEnter 0.3s cubic-bezier(0.25, 1, 0.5, 1) 0.1s both' }}>
        <div
          style={{
            width: '3px',
            height: '32px',
            background: tierColors.accent,
            borderRadius: '2px',
          }}
        />
        <IconWithFallback
          urls={augmentPortraitUrls(augment.name, augment.iconUrl)}
          alt={augment.name}
          size={44}
          style={{ borderRadius: 8, border: '1px solid #2a2a2a' }}
        />
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'white' }}>{augment.name}</h2>
        <div
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 600,
            color: tierColors.text,
            background: tierColors.bg,
            border: `1px solid ${tierColors.border}`,
          }}
        >
          {augment.tier.charAt(0).toUpperCase() + augment.tier.slice(1)}
        </div>
      </div>

      {/* Description */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ fontSize: '10px', color: '#333', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px' }}>
          Description
        </div>
        <div style={{ padding: '16px', borderRadius: '8px', background: '#1a1a1a', border: '1px solid #2a2a2a' }}>
          <div style={{ fontSize: '13px', color: '#ccc' }}>{augment.description}</div>
        </div>
      </div>

      {/* Effect */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ fontSize: '10px', color: '#333', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px' }}>
          Effect
        </div>
        <div style={{ padding: '16px', borderRadius: '8px', background: '#111827', border: '1px solid #16162a' }}>
          <div style={{ fontSize: '13px', color: '#ccc' }}>{augment.effect}</div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { label: 'Win Rate', value: `${augment.winRate}%`, color: augment.winRate > 52 ? '#22c55e' : augment.winRate < 50 ? '#ef4444' : '#fbbf24' },
          { label: 'Pick Rate', value: `${augment.pickRate}%`, color: C.text },
          { label: 'Avg Placement', value: `#${augment.avgPlacement}`, color: C.text },
        ].map((stat, i) => (
          <div
            key={stat.label}
            style={{
              padding: '12px',
              borderRadius: '8px',
              background: '#111827',
              border: '1px solid #16162a',
              animation: `statCardEnter 0.3s cubic-bezier(0.25, 1, 0.5, 1) ${0.15 + i * 0.1}s both`,
            }}
          >
            <div style={{ fontSize: '11px', color: '#555', marginBottom: '4px' }}>{stat.label}</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Best Comps */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ fontSize: '10px', color: '#333', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px' }}>
          Best Comps
        </div>
        <div className="flex flex-wrap gap-2">
          {augment.bestComps.map((comp, i) => (
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

      {/* Synergies */}
      {augment.synergies.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <div style={{ fontSize: '10px', color: '#333', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px' }}>
            Synergies
          </div>
          <div className="flex flex-wrap gap-2">
            {augment.synergies.map((synergy, i) => (
              <span
                key={synergy}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 500,
                  background: 'rgba(74, 222, 128, 0.1)',
                  border: '1px solid rgba(74, 222, 128, 0.2)',
                  color: '#4ade80',
                  animation: `pillEnter 0.2s cubic-bezier(0.25, 1, 0.5, 1) ${i * 50}ms both`,
                }}
              >
                {synergy}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Counters */}
      {augment.counters.length > 0 && (
        <div>
          <div style={{ fontSize: '10px', color: '#333', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px' }}>
            Counters
          </div>
          <div className="flex flex-wrap gap-2">
            {augment.counters.map((counter, i) => (
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
      )}
    </div>
  )
}
