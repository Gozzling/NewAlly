import { useMemo, useState } from 'react'
import { unitIconUrl } from '@/utils/unitDisplay'
import { itemIconUrl } from '@/utils/itemDisplay'
import { SearchInputWithSuggestions } from '@/components/SearchInputWithSuggestions'
import { useTypewriterPlaceholder } from '@/hooks/useTypewriterPlaceholder'

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

interface ItemRecipe {
  name: string
  components: [string, string]
  effect: string
  tags: string[]
  tier: 'S' | 'A' | 'B' | 'C'
  bestOn: string[]
}

const ITEMS: ItemRecipe[] = [
  { name: "Bloodthirster", components: ["B.F. Sword", "Negatron Cloak"], effect: "+20% AD. Attacks heal for 25% of damage dealt.", tags: ["offense","sustain"], tier: 'S', bestOn: ["Fiora","Aatrox","Samira","Briar"] },
  { name: "Guardian Angel", components: ["B.F. Sword", "Chain Vest"], effect: "+15% AD. Once per combat, revive with 400 HP after 2s.", tags: ["offense","defense"], tier: 'S', bestOn: ["Fiora","Bard","Caitlyn","Jhin"] },
  { name: "Infinity Edge", components: ["B.F. Sword", "B.F. Sword"], effect: "+35% AD. Abilities can crit. +25% crit damage.", tags: ["offense","crit"], tier: 'S', bestOn: ["Jhin","Caitlyn","Corki","Samira","Kalista"] },
  { name: "Last Whisper", components: ["B.F. Sword", "Giant's Belt"], effect: "+15% AD. Attacks shred 30% armor for 5s.", tags: ["offense","shred"], tier: 'A', bestOn: ["Jhin","Corki","Samira"] },
  { name: "Rapid Firecannon", components: ["B.F. Sword", "Recurve Bow"], effect: "+30% AS. Attacks cannot miss. +1 range.", tags: ["offense","range"], tier: 'A', bestOn: ["Jhin","Caitlyn","Corki"] },
  { name: "Giant Slayer", components: ["B.F. Sword", "Tear of the Goddess"], effect: "+15% AD. Deal +25% damage to targets with >1800 HP.", tags: ["offense"], tier: 'A', bestOn: ["Jhin","Caitlyn","Samira"] },
  { name: "Guinsoo's Rageblade", components: ["Recurve Bow", "Recurve Bow"], effect: "+30% AS. Attacks grant 5% stacking AS (max 10 stacks).", tags: ["offense","AS"], tier: 'A', bestOn: ["Kai'Sa","Samira","Jhin"] },
  { name: "Rabadon's Deathcap", components: ["Needlessly Large Rod", "Needlessly Large Rod"], effect: "+50 AP. Abilities deal +35% bonus damage.", tags: ["AP","offense"], tier: 'S', bestOn: ["Vex","Ezreal","LeBlanc","Aurelion Sol","Karma","Bard"] },
  { name: "Jeweled Gauntlet", components: ["Needlessly Large Rod", "Sparring Gloves"], effect: "+25 AP. Spells can crit. +30% spell crit damage.", tags: ["AP","crit"], tier: 'S', bestOn: ["Vex","Ezreal","LeBlanc","Aurelion Sol"] },
  { name: "Blue Buff", components: ["Tear of the Goddess", "Tear of the Goddess"], effect: "+30 starting mana. After casting, set mana to 20.", tags: ["mana","AP"], tier: 'S', bestOn: ["Vex","Ezreal","LeBlanc","Aurelion Sol","Zoe","Veigar"] },
  { name: "Spear of Shojin", components: ["B.F. Sword", "Tear of the Goddess"], effect: "+15% AD, +15 AP. Attacks restore 5 bonus mana.", tags: ["mana","hybrid"], tier: 'S', bestOn: ["Karma","Bard","Vex"] },
  { name: "Morellonomicon", components: ["Needlessly Large Rod", "Giant's Belt"], effect: "+25 AP. Spells apply 30% grievous wounds and burn for 10% max HP over 10s.", tags: ["AP","grievous"], tier: 'A', bestOn: ["Karma","Zoe","Veigar","Lissandra"] },
  { name: "Warmog's Armor", components: ["Giant's Belt", "Giant's Belt"], effect: "+600 HP. Regenerate 5% max HP per second.", tags: ["tank","HP"], tier: 'S', bestOn: ["Aatrox","Gnar","Urgot","Cho'Gath","Mordekaiser"] },
  { name: "Sunfire Cape", components: ["Giant's Belt", "Chain Vest"], effect: "+300 HP, +25 armor. Every 2s, burn nearest enemy for 8% max HP and apply grievous wounds.", tags: ["tank","grievous"], tier: 'S', bestOn: ["Gnar","Urgot","Cho'Gath","Mordekaiser","Diana"] },
  { name: "Bramble Vest", components: ["Chain Vest", "Chain Vest"], effect: "+50 armor. Negates bonus damage from crits. Reflect 80 magic damage on being hit.", tags: ["tank","armor"], tier: 'A', bestOn: ["Gnar","Urgot","Cho'Gath","Mordekaiser","Poppy"] },
  { name: "Titan's Resolve", components: ["Chain Vest", "Recurve Bow"], effect: "+25 armor, +15% AS. Stack +25 armor and +5% AS on hit (max 25 stacks). At max, gain +25 armor and MR.", tags: ["tank","AS"], tier: 'A', bestOn: ["Aatrox","Gnar","Urgot","Briar"] },
  { name: "Ionic Spark", components: ["Negatron Cloak", "Needlessly Large Rod"], effect: "+25 MR. Enemies within 2 hexes have -50% MR. On enemy casting, deal 200% max mana as magic damage.", tags: ["tank","MR","utility"], tier: 'A', bestOn: ["Gnar","Urgot","Cho'Gath","Diana"] },
  { name: "Redemption", components: ["Giant's Belt", "Tear of the Goddess"], effect: "+300 HP, +15 mana. Every 5s, heal allies within 1 hex for 15% missing HP.", tags: ["support","heal"], tier: 'A', bestOn: ["Karma","Leona","Bard"] },
]

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
  const [selectedItem, setSelectedItem] = useState<ItemRecipe | null>(null)

  const { placeholderAnimated: itemsSearchPlaceholder } = useTypewriterPlaceholder(
    ITEMS_GUIDE_PLACEHOLDER_WORDS,
    query.length > 0,
  )

  const filtered = useMemo(() => {
    let list = query ? ITEMS.filter(i => i.name.toLowerCase().includes(query.toLowerCase()) || i.components.some(c => c.toLowerCase().includes(query.toLowerCase()))) : [...ITEMS]
    if (tagFilter !== 'all') list = list.filter(i => i.tags.includes(tagFilter))
    if (tierFilter !== 'all') list = list.filter(i => i.tier === tierFilter)

    // Sort by tier: S first, then A, B, C
    const tierOrder = { S: 0, A: 1, B: 2, C: 3 }
    return list.sort((a, b) => tierOrder[a.tier] - tierOrder[b.tier])
  }, [query, tagFilter, tierFilter])

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
            {(['all', 'offense', 'defense', 'AP', 'tank', 'sustain', 'mana', 'hybrid'] as const).map((tag) => (
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
        <div className="grid grid-cols-3 gap-3">
          {filtered.map((item, index) => (
            <ItemCard
              key={item.name}
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
        <img
          src={itemIconUrl(item.name)}
          alt=""
          width={40}
          height={40}
          style={{ borderRadius: 6, objectFit: 'cover', flexShrink: 0 }}
          onError={(e) => { e.currentTarget.style.display = 'none' }}
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
        <img
          src={itemIconUrl(item.name)}
          alt=""
          width={48}
          height={48}
          style={{ borderRadius: 8, objectFit: 'cover', border: `1px solid ${C.border}` }}
          onError={(e) => { e.currentTarget.style.display = 'none' }}
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
