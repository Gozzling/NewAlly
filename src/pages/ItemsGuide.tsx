import { useMemo, useState } from 'react'
import { unitIconUrl } from '@/utils/unitDisplay'
import { GameIcon } from '@/components/GameIcon'
import { itemIconUrl } from '@/utils/itemDisplay'
import { SearchInputWithSuggestions } from '@/components/SearchInputWithSuggestions'
import { useTypewriterPlaceholder } from '@/hooks/useTypewriterPlaceholder'
import { useTFTData } from '@/hooks/useTFTData'
import { buildItemGuideEntries, type ItemGuideEntry } from '@/lib/tftStaticMappers'
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

const TIER_COLORS: Record<string, { text: string; bg: string; border: string; hover: string }> = {
  S: { text: '#fbbf24', bg: 'rgba(251, 191, 36, 0.1)', border: 'rgba(251, 191, 36, 0.2)', hover: '#fbbf24' },
  A: { text: '#4ade80', bg: 'rgba(74, 222, 128, 0.1)', border: 'rgba(74, 222, 128, 0.2)', hover: '#4ade80' },
  B: { text: '#60a5fa', bg: 'rgba(96, 165, 250, 0.1)', border: 'rgba(96, 165, 250, 0.2)', hover: '#60a5fa' },
  C: { text: '#9ca3af', bg: 'rgba(156, 163, 175, 0.1)', border: 'rgba(156, 163, 175, 0.2)', hover: '#9ca3af' }
}

type ItemRecipe = ItemGuideEntry

interface ItemsGuideProps {
  query: string
  setQuery: (value: string) => void
  tagFilter: string
  setTagFilter: (value: string) => void
  tierFilter: string
  setTierFilter: (value: string) => void
  onItemSelect: (itemName: string) => void
}

const ITEMS_GUIDE_PLACEHOLDER_WORDS = ['Rabadon', 'Blue Buff', 'Warmog', 'Infinity Edge']

export function ItemsGuide({ query, setQuery, tagFilter, setTagFilter, tierFilter, setTierFilter, onItemSelect }: ItemsGuideProps) {
  const tft = useTFTData()
  const items = useMemo(() => buildItemGuideEntries(tft), [tft])
  const [selectedItem, setSelectedItem] = useState<ItemRecipe | null>(null)

  const placeholderWords = useMemo(
    () => items.slice(0, 12).map((i) => i.name),
    [items],
  )

  const { placeholderAnimated: itemsSearchPlaceholder } = useTypewriterPlaceholder(
    placeholderWords.length > 0 ? placeholderWords : ITEMS_GUIDE_PLACEHOLDER_WORDS,
    query.length > 0,
  )

  const filtered = useMemo(() => {
    let list = query
      ? items.filter(
          (i) =>
            i.name.toLowerCase().includes(query.toLowerCase()) ||
            i.apiName.toLowerCase().includes(query.toLowerCase()) ||
            i.components.some((c) => c.toLowerCase().includes(query.toLowerCase())),
        )
      : [...items]
    if (tagFilter !== 'all') list = list.filter((i) => i.tags.includes(tagFilter) || i.category === tagFilter)
    if (tierFilter !== 'all') list = list.filter((i) => i.tier === tierFilter)

    const tierOrder = { S: 0, A: 1, B: 2, C: 3 }
    return list.sort((a, b) => a.name.localeCompare(b.name) || tierOrder[a.tier] - tierOrder[b.tier])
  }, [query, tagFilter, tierFilter, items])

  const handleItemClick = (item: ItemRecipe) => {
    setSelectedItem(item)
  }

  const handleBack = () => {
    setSelectedItem(null)
  }

  if (selectedItem) {
    return <ItemDetail item={selectedItem} onBack={handleBack} onItemSelect={onItemSelect} />
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
          placeholder={itemsSearchPlaceholder || 'Search items…'}
          kinds={['item']}
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

        {/* Tag Filter */}
        <div>
          <div style={{ fontSize: '10px', color: '#333', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px', marginTop: '16px' }}>
            Tag
          </div>
          <div className="flex flex-wrap gap-2">
            {(['all', 'component', 'finished', 'radiant', 'artifact', 'offense', 'defense', 'AP', 'tank'] as const).map((tag) => (
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
                  border: tierFilter === tier ? '1px solid #35c3e740' : '1px solid #2a2a2a',
                  background: tierFilter === tier ? '#35c3e710' : 'transparent',
                  color: tierFilter === tier ? '#35c3e7' : '#555',
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
        <TFTStaticDataBanner meta={tft.meta} count={filtered.length} label="items" />
        <div className="grid grid-cols-3 gap-3">
          {filtered.map((item, index) => (
            <ItemCard
              key={item.apiName}
              item={item}
              index={index}
              onClick={() => handleItemClick(item)}
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

function ItemCard({ item, index, onClick }: { item: ItemRecipe; index: number; onClick: () => void }) {
  const tierColors = TIER_COLORS[item.tier] ?? TIER_COLORS.C

  return (
    <div
      className="relative overflow-hidden cursor-pointer"
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: '10px',
        padding: '12px',
        transition: 'all 0.15s ease',
        animation: `cardEnter 0.4s cubic-bezier(0.25, 1, 0.5, 1) ${index * 40}ms both`,
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = tierColors.hover
        e.currentTarget.style.transform = 'translateY(-1px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = C.border
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {/* Tier Badge */}
      <div
        className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold"
        style={{
          color: tierColors.text,
          background: tierColors.bg,
          border: `1px solid ${tierColors.border}`,
        }}
      >
        {item.tier}
      </div>

      <div className="flex items-start gap-3 mb-2">
        <GameIcon
          src={item.iconUrl}
          fallbackSrc={itemIconUrl(item.name)}
          width={40}
          height={40}
          style={{ borderRadius: 6, objectFit: 'cover', flexShrink: 0 }}
        />
        <div className="text-white text-sm font-bold">{item.name}</div>
      </div>

      {/* Components */}
      <div className="text-gray-400 text-[10px] mb-2">{item.components.join(' + ')}</div>

      {/* Effect */}
      <div className="text-gray-400 text-xs line-clamp-2" style={{ lineHeight: '1.4' }}>
        {item.effect}
      </div>

      {/* Best On */}
      <div className="flex gap-2">
        {item.bestOn.slice(0, 3).map((unit) => (
          <div
            key={unit}
            style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'2px'}}
          >
            <img
              src={unitIconUrl(unit)}
              alt={unit}
              title={unit}
              style={{width:'28px',height:'28px',borderRadius:'4px',objectFit:'cover'}}
              onError={(e) => { e.currentTarget.parentElement!.style.display='none' }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

function ItemDetail({ item, onBack, onItemSelect }: { item: ItemRecipe; onBack: () => void; onItemSelect: (unitName: string) => void }) {
  const tierColors = TIER_COLORS[item.tier] ?? TIER_COLORS.C

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
        ← Items
      </button>

      {/* Item Name + Tier */}
      <div className="flex items-center gap-4 mb-8" style={{ animation: 'statCardEnter 0.3s cubic-bezier(0.25, 1, 0.5, 1) 0.1s both' }}>
        <GameIcon
          src={item.iconUrl}
          fallbackSrc={itemIconUrl(item.name)}
          width={48}
          height={48}
          style={{ borderRadius: 8, objectFit: 'cover', border: `1px solid ${C.border}` }}
        />
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'white' }}>{item.name}</h2>
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
          {item.tier} Tier
        </div>
      </div>

      {/* Components */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ fontSize: '10px', color: '#333', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px' }}>
          Components
        </div>
        <div className="flex gap-3">
          {item.components.map((component, i) => (
            <div
              key={component}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 500,
                background: C.surface,
                border: `1px solid ${C.border}`,
                animation: `statCardEnter 0.3s cubic-bezier(0.25, 1, 0.5, 1) ${0.15 + i * 0.1}s both`,
              }}
            >
              {component}
            </div>
          ))}
        </div>
      </div>

      {item.stats ? (
        <div style={{ marginBottom: '32px' }}>
          <div style={{ fontSize: '10px', color: '#333', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px' }}>
            Stats
          </div>
          <div style={{ padding: '16px', borderRadius: '8px', background: C.surface, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: '13px', color: '#b8e8f5', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{item.stats}</div>
          </div>
        </div>
      ) : null}

      {/* Effect */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ fontSize: '10px', color: '#333', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px' }}>
          Effect
        </div>
        <div style={{ padding: '16px', borderRadius: '8px', background: C.surface, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: '13px', color: '#ccc', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{item.effect}</div>
        </div>
      </div>

      {/* Tags */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ fontSize: '10px', color: '#333', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px' }}>
          Tags
        </div>
        <div className="flex flex-wrap gap-2">
          {item.tags.map((tag, i) => (
            <span
              key={tag}
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
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Best On */}
      <div>
        <div style={{ fontSize: '10px', color: '#333', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px' }}>
          Best On
        </div>
        <div className="flex gap-4">
          {item.bestOn.map((unit, i) => (
            <div
              key={unit}
              style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'2px',cursor:'pointer',animation:`pillEnter 0.2s cubic-bezier(0.25, 1, 0.5, 1) ${i * 50}ms both`}}
              onClick={() => onItemSelect(unit)}
            >
              <img
                src={unitIconUrl(unit)}
                alt={unit}
                title={unit}
                style={{width:'48px',height:'48px',borderRadius:'8px',objectFit:'cover'}}
                onError={(e) => { e.currentTarget.parentElement!.style.display='none' }}
              />
              <div style={{ fontSize: '11px', color: '#555' }}>{unit}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
