import { useEffect, useMemo, useState, Fragment } from 'react'
import { UnitPortrait } from '@/components/UnitPortrait'
import { SearchInputWithSuggestions } from '@/components/SearchInputWithSuggestions'
import { useTypewriterPlaceholder } from '@/hooks/useTypewriterPlaceholder'
import { useAppStore } from '@/store/useAppStore'
import type { ItemGuideCategory, ItemGuideEntry } from '@/data/itemGuideCatalog'
import { itemPortraitUrls } from '@/utils/iconResolver'
import { IconWithFallback } from '@/components/IconWithFallback'
import { ReferenceDetailModal } from '@/components/ReferenceDetailModal'

/* ─── Design tokens ─── */
const C = {
  bg:         'var(--color-ally-bg)',
  surface:    'var(--color-ally-sidebar)',
  border:     'var(--color-ally-border)',
  accent:     'var(--color-ally-accent)',
  accentDim:  'color-mix(in srgb, var(--color-ally-accent) 18%, transparent)',
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

const CATEGORY_LABELS: { id: ItemGuideCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'core', label: 'Core' },
  { id: 'emblem', label: 'Emblems' },
  { id: 'psionic', label: 'Psionic' },
  { id: 'artifact', label: 'Artifacts' },
  { id: 'divine', label: 'Divine' },
  { id: 'anima', label: 'Anima' },
]

interface ItemsGuideProps {
  query: string
  setQuery: (value: string) => void
  categoryFilter: ItemGuideCategory | 'all'
  setCategoryFilter: (value: ItemGuideCategory | 'all') => void
  tagFilter: string
  setTagFilter: (value: string) => void
  tierFilter: string
  setTierFilter: (value: string) => void
  onItemSelect: (itemName: string) => void
  initialItem?: string | null
}

const ITEMS_GUIDE_PLACEHOLDER_WORDS = ['Omniweapon', 'Blue Buff', 'Anima Emblem', 'Thresh\'s Lantern']

export function ItemsGuide({ query, setQuery, categoryFilter, setCategoryFilter, tagFilter, setTagFilter, tierFilter, setTierFilter, onItemSelect, initialItem }: ItemsGuideProps) {
  const guideItems = useAppStore((s) => s.gameData.items)
  const [selectedItem, setSelectedItem] = useState<ItemGuideEntry | null>(null)

  useEffect(() => {
    if (!initialItem) return
    const it = guideItems.find((i) => i.name === initialItem)
    if (it) setSelectedItem(it)
  }, [initialItem, guideItems])

  const { placeholderAnimated: itemsSearchPlaceholder } = useTypewriterPlaceholder(
    guideItems.length > 0 ? guideItems.slice(0, 10).map(i => i.name) : ITEMS_GUIDE_PLACEHOLDER_WORDS,
    query.length > 0,
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = [...guideItems]
    if (q) {
      list = list.filter((i) => {
        const hay = `${i.name} ${i.stats} ${i.effect} ${i.components?.join(' ') ?? ''}`.toLowerCase()
        return hay.includes(q)
      })
    }
    if (categoryFilter !== 'all') list = list.filter((i) => i.category === categoryFilter)
    if (tagFilter !== 'all') list = list.filter((i) => i.tags.includes(tagFilter))
    if (tierFilter !== 'all') list = list.filter((i) => i.tier === tierFilter)

    const tierOrder = { S: 0, A: 1, B: 2, C: 3 }
    return list.sort((a, b) => tierOrder[a.tier] - tierOrder[b.tier])
  }, [query, categoryFilter, tagFilter, tierFilter, guideItems])

  const handleItemClick = (item: ItemGuideEntry) => {
    onItemSelect(item.name)
    setSelectedItem(item)
  }

  const handleBack = () => {
    setSelectedItem(null)
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

        {/* Category */}
        <div>
          <div className="ally-sidebar-label">
            Category
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_LABELS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setCategoryFilter(id)}
                style={{
                  padding: '3px 10px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  border: categoryFilter === id ? `1px solid color-mix(in srgb, ${C.accent} 25%, transparent)` : '1px solid #2a2a2a',
                  background: categoryFilter === id ? C.accentDim : 'transparent',
                  color: categoryFilter === id ? C.accent : '#555',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {label}
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
            {(['all', 'offense', 'defense', 'AP', 'tank', 'sustain', 'mana', 'hybrid', 'emblem', 'artifact', 'anima', 'divine', 'psionic', 'core'] as const).map((tag) => (
              <button
                key={tag}
                onClick={() => setTagFilter(tag)}
                style={{
                  padding: '3px 10px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  border: tagFilter === tag ? `1px solid color-mix(in srgb, ${C.accent} 25%, transparent)` : '1px solid #2a2a2a',
                  background: tagFilter === tag ? C.accentDim : 'transparent',
                  color: tagFilter === tag ? C.accent : '#555',
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
          <div className="ally-sidebar-label">
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
                  border: tierFilter === tier ? `1px solid color-mix(in srgb, ${C.accent} 25%, transparent)` : '1px solid #2a2a2a',
                  background: tierFilter === tier ? C.accentDim : 'transparent',
                  color: tierFilter === tier ? C.accent : '#555',
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
        {filtered.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center rounded-xl border border-ally-border bg-ally-card px-8 py-16 text-center"
            style={{ minHeight: 280 }}
          >
            <p className="font-display text-ally-text text-lg font-semibold mb-2">No items match</p>
            <p className="text-ally-muted text-sm max-w-md">
              Try clearing search or filters — widen the category, tag, or tier to see more gear.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((item, index) => (
              <ItemCard
                key={item.name}
                item={item}
                index={index}
                onClick={() => handleItemClick(item)}
              />
            ))}
          </div>
        )}
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
      open={Boolean(selectedItem)}
      onClose={handleBack}
      ariaLabel={selectedItem ? `${selectedItem.name} item details` : 'Item details'}
    >
      {selectedItem ? (
        <ItemDetail
          item={selectedItem}
          onBack={handleBack}
          onItemSelect={onItemSelect}
          embedded
        />
      ) : null}
    </ReferenceDetailModal>
    </Fragment>
  )
}

function ItemCard({ item, index, onClick }: { item: ItemGuideEntry; index: number; onClick: () => void }) {
  const tierColors = TIER_COLORS[item.tier] ?? TIER_COLORS.C

  return (
    <div
      className="ally-card relative overflow-hidden cursor-pointer flex items-center gap-4 p-3"
      style={{
        animation: `cardEnter 0.4s cubic-bezier(0.25, 1, 0.5, 1) ${index * 40}ms both`,
      }}
      onClick={onClick}
    >
      <IconWithFallback
        urls={itemPortraitUrls(item.name, item.iconUrl, item.iconSlug)}
        alt={item.name}
        size={44}
        style={{ borderRadius: 6, flexShrink: 0 }}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <div className="text-white text-sm font-bold font-display uppercase tracking-wide truncate">{item.name}</div>
          <div
            className="px-1.5 py-0.5 rounded text-[9px] font-bold border"
            style={{
              color: tierColors.text,
              background: tierColors.bg,
              borderColor: tierColors.border,
            }}
          >
            {item.tier}
          </div>
        </div>
        <div className="text-gray-400 text-xs line-clamp-1 opacity-80">{item.effect}</div>
      </div>

      <div className="hidden md:flex items-center gap-3 px-4 border-l border-ally-border/50">
        <div className="flex flex-col items-center">
          <div className="text-[9px] text-ally-muted uppercase tracking-tighter mb-1 font-display font-bold">Best On</div>
          <div className="flex -space-x-2">
            {item.bestOn.slice(0, 3).map((unit) => (
              <UnitPortrait key={unit} name={unit} size={24} radius={12} style={{ border: '1px solid #1f1f1f' }} />
            ))}
          </div>
        </div>
        <div className="flex flex-col items-end min-w-[80px]">
          <div className="text-[9px] text-cyan-600 uppercase tracking-widest font-display font-bold mb-0.5">{item.category}</div>
          <div className="text-[10px] text-gray-500 font-medium truncate w-full text-right">
            {item.components ? item.components.join(' + ') : 'Unique'}
          </div>
        </div>
      </div>
    </div>
  )
}

function ItemDetail({
  item,
  onBack,
  onItemSelect,
  embedded = false,
}: {
  item: ItemGuideEntry
  onBack: () => void
  onItemSelect: (unitName: string) => void
  embedded?: boolean
}) {
  const tierColors = TIER_COLORS[item.tier] ?? TIER_COLORS.C

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
          ← Items
        </button>
      ) : null}

      {/* Item Name + Tier */}
      <div className="flex items-center gap-4 mb-8" style={{ animation: 'statCardEnter 0.3s cubic-bezier(0.25, 1, 0.5, 1) 0.1s both' }}>
        <IconWithFallback
          urls={itemPortraitUrls(item.name, item.iconUrl, item.iconSlug)}
          alt={item.name}
          size={48}
          style={{ borderRadius: 8, border: `1px solid ${C.border}` }}
        />
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'white' }}>{item.name}</h2>
        <span style={{ fontSize: '11px', color: '#6b9aa8', textTransform: 'uppercase' }}>{item.category}</span>
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

      {/* Stats */}
      {item.stats ? (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '10px', color: '#333', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px' }}>
            Stats
          </div>
          <div style={{ padding: '14px', borderRadius: '8px', background: C.surface, border: `1px solid ${C.border}`, fontSize: '13px', color: '#b8e8f5', whiteSpace: 'pre-line' }}>
            {item.stats}
          </div>
        </div>
      ) : null}

      {/* Components */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ fontSize: '10px', color: '#333', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px' }}>
          {item.components ? 'Components' : 'Source'}
        </div>
        {item.components ? (
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
        ) : (
          <div style={{ fontSize: '13px', color: '#888' }}>Ornn artifact, carousel drop, or Anima Squad reward (not crafted from components).</div>
        )}
      </div>

      {/* Effect */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ fontSize: '10px', color: '#333', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px' }}>
          Effect
        </div>
        <div style={{ padding: '16px', borderRadius: '8px', background: C.surface, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: '13px', color: '#ccc' }}>{item.effect}</div>
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
          {item.bestOn.length === 0 ? (
            <span style={{ fontSize: '12px', color: '#555' }}>—</span>
          ) : null}
          {item.bestOn.map((unit, i) => (
            <div
              key={unit}
              style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'2px',cursor:'pointer',animation:`pillEnter 0.2s cubic-bezier(0.25, 1, 0.5, 1) ${i * 50}ms both`}}
              onClick={() => onItemSelect(unit)}
            >
              <UnitPortrait name={unit} size={48} radius={8} />
              <div style={{ fontSize: '11px', color: '#555' }}>{unit}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
