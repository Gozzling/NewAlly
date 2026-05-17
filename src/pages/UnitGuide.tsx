import { useMemo, useState, useEffect } from 'react'
import { GameIcon } from '@/components/GameIcon'
import { unitIconUrl } from '@/utils/unitDisplay'
import { SearchInputWithSuggestions } from '@/components/SearchInputWithSuggestions'
import { useTypewriterPlaceholder } from '@/hooks/useTypewriterPlaceholder'
import { useTFTData } from '@/hooks/useTFTData'
import { buildUnitGuideEntries, type UnitGuideEntry } from '@/lib/tftStaticMappers'
import { TFTStaticDataBanner } from '@/components/TFTStaticDataBanner'

/* ─── Design tokens ─── */
const C = {
  bg:         'var(--color-ally-bg)',
  surface:    'var(--color-ally-card)',
  border:     'var(--color-ally-border)',
  accent:     'var(--color-ally-accent)',
  accentDim:  'var(--color-ally-accent)15',
  text:       'var(--color-ally-text)',
  muted:      'var(--color-ally-muted)',
  content:    'var(--color-ally-bg)',
}

const TIER_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  S: { text: '#fbbf24', bg: 'rgba(251, 191, 36, 0.1)', border: 'rgba(251, 191, 36, 0.3)' },
  A: { text: '#4ade80', bg: 'rgba(74, 222, 128, 0.1)', border: 'rgba(74, 222, 128, 0.3)' },
  B: { text: '#60a5fa', bg: 'rgba(96, 165, 250, 0.1)', border: 'rgba(96, 165, 250, 0.3)' },
  C: { text: '#9ca3af', bg: 'rgba(156, 163, 175, 0.1)', border: 'rgba(156, 163, 175, 0.3)' },
}

const COST_COLORS: Record<number, string> = {
  1: '#9aa4af',
  2: '#34d399',
  3: '#60a5fa',
  4: '#c084fc',
  5: '#f59e0b',
}

interface UnitGuideProps {
  query: string
  setQuery: (value: string) => void
  costFilter: number | 'all'
  setCostFilter: (value: number | 'all') => void
  tierFilter: string
  setTierFilter: (value: string) => void
  onUnitSelect: (unitId: string) => void
  initialUnit?: string | null
}

const UNIT_GUIDE_PLACEHOLDER_WORDS = ['Ahri', 'Jinx', 'Aatrox', 'Samira', 'Jhin', 'Fiora', "Kai'Sa"]

export function UnitGuide({ query, setQuery, costFilter, setCostFilter, tierFilter, setTierFilter, onUnitSelect, initialUnit }: UnitGuideProps) {
  const tft = useTFTData()
  const units = useMemo(() => buildUnitGuideEntries(tft), [tft])
  const [selectedUnit, setSelectedUnit] = useState<UnitGuideEntry | null>(null)

  // Set initial unit when provided
  useEffect(() => {
    if (initialUnit) {
      const unit = units.find(
        (u) => u.name === initialUnit || u.id === initialUnit || u.apiName === initialUnit,
      )
      if (unit) setSelectedUnit(unit)
    }
  }, [initialUnit, units])

  const { placeholderAnimated: unitsSearchPlaceholder } = useTypewriterPlaceholder(
    UNIT_GUIDE_PLACEHOLDER_WORDS,
    query.length > 0,
  )

  const filtered = useMemo(() => {
    let list = query
      ? units.filter(
          (u) =>
            u.name.toLowerCase().includes(query.toLowerCase()) ||
            u.apiName.toLowerCase().includes(query.toLowerCase()) ||
            u.traits.some((t) => t.toLowerCase().includes(query.toLowerCase())),
        )
      : units
    if (costFilter !== 'all') list = list.filter((u) => u.cost === costFilter)
    if (tierFilter !== 'all') list = list.filter((u) => u.tier === tierFilter)
    return list.sort((a, b) => b.cost - a.cost)
  }, [query, costFilter, tierFilter, units])

  const handleUnitClick = (unit: UnitGuideEntry) => {
    setSelectedUnit(unit)
  }

  const handleBack = () => {
    setSelectedUnit(null)
  }

  if (selectedUnit) {
    return <UnitDetail unit={selectedUnit} onBack={handleBack} />
  }

  return (
    <div className="flex h-screen" style={{ animation: 'pageEnter 0.4s cubic-bezier(0.25, 1, 0.5, 1)' }}>
      {/* Left Sidebar */}
      <div className="flex-shrink-0 flex flex-col" style={{
        background: '#111111',
        borderRight: '1px solid #2a2a2a',
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
          placeholder={unitsSearchPlaceholder || 'Search units…'}
          kinds={['unit']}
          wrapperClassName="w-full mb-6"
          listZIndex={80}
          inputClassName="w-full"
          inputStyle={{
            width: '100%',
            background: '#1a1a1a',
            border: '1px solid #2a2a2a',
            borderRadius: '6px',
            padding: '7px 10px',
            fontSize: '12px',
            color: 'white',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />

        {/* Cost Filter */}
        <div>
          <div style={{ fontSize: '10px', color: '#333', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px', marginTop: '16px' }}>
            Cost
          </div>
          <div className="flex flex-wrap gap-2">
            {(['all', 1, 2, 3, 4, 5] as const).map((cost) => (
              <button
                key={cost}
                onClick={() => setCostFilter(cost)}
                style={{
                  padding: '3px 10px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  border: costFilter === cost ? '1px solid var(--color-ally-accent)40' : '1px solid #1a1a2e',
                  background: costFilter === cost ? 'var(--color-ally-accent)10' : 'transparent',
                  color: costFilter === cost ? 'var(--color-ally-accent)' : '#555',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {cost === 'all' ? 'All' : cost}
              </button>
            ))}
          </div>
        </div>

        {/* Tier Filter */}
        <div>
          <div style={{ fontSize: '10px', color: '#333', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px', marginTop: '16px' }}>
            Tier
          </div>
          <div className="flex flex-wrap gap-2">
            {(['all', 'S', 'A', 'B', 'C'] as const).map((tier) => (
              <button
                key={tier}
                onClick={() => setTierFilter(tier)}
                style={{
                  padding: '3px 10px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  border: tierFilter === tier ? '1px solid var(--color-ally-accent)40' : '1px solid #2a2a2a',
                  background: tierFilter === tier ? 'var(--color-ally-accent)10' : 'transparent',
                  color: tierFilter === tier ? 'var(--color-ally-accent)' : '#555',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {tier}
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
        <TFTStaticDataBanner meta={tft.meta} count={filtered.length} label="units" />
        <div className="grid grid-cols-4 gap-2">
          {filtered.map((unit, index) => (
            <UnitCard
              key={unit.id}
              unit={unit}
              index={index}
              onClick={() => handleUnitClick(unit)}
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
  )
}

function UnitCard({ unit, index, onClick }: { unit: UnitGuideEntry; index: number; onClick: () => void }) {
  const tierColors = TIER_COLORS[unit.tier] ?? TIER_COLORS.C

  return (
    <div
      className="relative overflow-hidden cursor-pointer"
      style={{
        background: 'var(--color-ally-card)',
        border: '1px solid var(--color-ally-border)',
        borderRadius: '10px',
        padding: '0',
        transition: 'all 0.15s ease',
        animation: `cardEnter 0.4s cubic-bezier(0.25, 1, 0.5, 1) ${index * 40}ms both`,
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-ally-accent)30'
        e.currentTarget.style.transform = 'translateY(-1px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#2a2a2a'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {/* Unit Icon */}
      <div
        style={{
          width: '100%',
          height: '120px',
          borderRadius: '10px 10px 0 0',
          overflow: 'hidden',
          background: '#111827',
        }}
      >
        <GameIcon
          src={unit.iconUrl}
          fallbackSrc={unitIconUrl(unit.name)}
          alt={unit.name}
          width={120}
          height={120}
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
        />
      </div>

      {/* Content */}
      <div style={{ padding: '6px' }}>
        {/* Unit Name */}
        <div style={{ fontSize: '11px', fontWeight: 600, color: 'white', marginBottom: '4px' }}>
          {unit.name}
        </div>

        {/* Cost Dot + Traits */}
        <div className="flex items-center gap-2 mb-2">
          <div
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: COST_COLORS[unit.cost],
            }}
          />
          <div style={{ fontSize: '9px', color: '#555' }}>{unit.traits.slice(0, 2).join(' / ')}</div>
        </div>

        {/* Tier Pill */}
        <div
          style={{
            display: 'inline-block',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '9px',
            fontWeight: 600,
            color: tierColors.text,
            background: tierColors.bg,
            border: `1px solid ${tierColors.border}`,
          }}
        >
          {unit.tier}
        </div>
      </div>
    </div>
  )
}

function UnitDetail({ unit, onBack }: { unit: UnitGuideEntry; onBack: () => void }) {
  const tierColors = TIER_COLORS[unit.tier] ?? TIER_COLORS.C

  return (
    <div className="h-full overflow-y-auto" style={{
      background: C.content,
      padding: '16px',
      animation: 'detailEnter 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
    }}>
      {/* Back Button */}
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
        ← Units
      </button>

      {/* Hero Section */}
      <div className="flex gap-6 mb-8" style={{ animation: 'statCardEnter 0.3s cubic-bezier(0.25, 1, 0.5, 1) 0.1s both' }}>
        <div
          style={{
            width: '120px',
            height: '120px',
            borderRadius: '10px',
            overflow: 'hidden',
            flexShrink: 0,
            background: '#1a1a1a',
            border: '1px solid #2a2a2a',
          }}
        >
          <GameIcon
            src={unit.iconUrl}
            fallbackSrc={unitIconUrl(unit.name)}
            alt={unit.name}
            width={120}
            height={120}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'white', marginBottom: '8px' }}>{unit.name}</h2>
          <div className="flex items-center gap-3 mb-2">
            <div
              style={{
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: 600,
                background: COST_COLORS[unit.cost],
                color: '#fff',
              }}
            >
              Cost {unit.cost}
            </div>
            <div style={{ fontSize: '13px', color: '#555' }}>{unit.traits.join(' / ')}</div>
          </div>
          <div
            style={{
              display: 'inline-block',
              padding: '4px 12px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              color: tierColors.text,
              background: tierColors.bg,
              border: `1px solid ${tierColors.border}`,
            }}
          >
            {unit.tier} Tier
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { label: 'HP', value: '550' },
          { label: 'AD', value: '55' },
          { label: 'AP', value: '0' },
          { label: 'AS', value: '0.75' },
          { label: 'Armor', value: '20' },
          { label: 'MR', value: '20' },
        ].map((stat, i) => (
          <div
            key={stat.label}
            style={{
              padding: '12px',
              borderRadius: '8px',
              background: '#111827',
              border: '1px solid #16162a',
              animation: `statCardEnter 0.3s cubic-bezier(0.25, 1, 0.5, 1) ${0.15 + i * 0.05}s both`,
            }}
          >
            <div style={{ fontSize: '11px', color: '#555', marginBottom: '4px' }}>{stat.label}</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'white' }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Ability Section */}
      <div style={{ marginBottom: '32px', animation: 'statCardEnter 0.3s cubic-bezier(0.25, 1, 0.5, 1) 0.35s both' }}>
        <div style={{ fontSize: '10px', color: '#333', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px' }}>
          Ability
        </div>
        <div style={{ padding: '16px', borderRadius: '8px', background: '#1a1a1a', border: '1px solid #2a2a2a' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-ally-accent)', marginBottom: '8px' }}>{unit.name}'s Ability</div>
          <div style={{ fontSize: '13px', color: '#ccc', marginBottom: '8px' }}>Deals damage to enemies based on {unit.cost} cost.</div>
          <div style={{ fontSize: '11px', color: '#555' }}>Damage: {unit.cost * 10}</div>
        </div>
      </div>

      {/* Best Items */}
      <div style={{ marginBottom: '32px', animation: 'statCardEnter 0.3s cubic-bezier(0.25, 1, 0.5, 1) 0.4s both' }}>
        <div style={{ fontSize: '10px', color: '#333', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px' }}>
          Best Items
        </div>
        <div className="flex flex-wrap gap-2">
          {['Bloodthirster', 'Infinity Edge', 'Guardian Angel'].map((item, i) => (
            <span
              key={item}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 500,
                background: 'rgba(251, 191, 36, 0.1)',
                border: '1px solid rgba(251, 191, 36, 0.3)',
                color: '#fbbf24',
                animation: `pillEnter 0.2s cubic-bezier(0.25, 1, 0.5, 1) ${i * 50}ms both`,
              }}
            >
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Best Comps */}
      <div style={{ animation: 'statCardEnter 0.3s cubic-bezier(0.25, 1, 0.5, 1) 0.45s both' }}>
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
    </div>
  )
}
