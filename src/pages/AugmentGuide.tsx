import { useEffect, useMemo, useState } from 'react'
import { augmentIconUrl } from '@/utils/augmentDisplay'
import { SearchInputWithSuggestions } from '@/components/SearchInputWithSuggestions'
import { useTypewriterPlaceholder } from '@/hooks/useTypewriterPlaceholder'

/* ─── Design tokens ─── */
const C = {
  bg:         '#0e0e0e',
  surface:    '#111111',
  border:     '#2a2a2a',
  accent:     '#35c3e7',
  accentDim:  'rgba(53, 195, 231, 0.15)',
  text:       '#ffffff',
  muted:      '#9ca3af',
  content:    '#0e0e0e',
}

const TIER_COLORS: Record<string, { text: string; bg: string; border: string; accent: string; glow: string }> = {
  prismatic: { text: '#a855f7', bg: 'rgba(168, 85, 247, 0.1)', border: 'rgba(168, 85, 247, 0.3)', accent: '#a855f7', glow: '0 0 16px rgba(168, 85, 247, 0.15)' },
  gold: { text: '#f0b429', bg: 'rgba(240, 180, 41, 0.1)', border: 'rgba(240, 180, 41, 0.3)', accent: '#f0b429', glow: 'none' },
  silver: { text: '#9aa4af', bg: 'rgba(154, 164, 175, 0.1)', border: 'rgba(154, 164, 175, 0.3)', accent: '#9aa4af', glow: 'none' }
}

interface Augment {
  id: string
  name: string
  tier: 'prismatic' | 'gold' | 'silver'
  description: string
  effect: string
  bestComps: string[]
  pickRate: number
  winRate: number
  avgPlacement: number
  synergies: string[]
  counters: string[]
  tags: string[]
}

const AUGMENTS: Augment[] = [
  {
    id: "aug_space_god_blessing",
    name: "Space God Blessing",
    tier: "prismatic",
    description: "At the start of each combat, choose 1 of 3 Divine Boons. Boons grant powerful team-wide buffs for that round.",
    effect: "1 Divine Boon per round (choice of 3)",
    bestComps: ["Divine Ascension", "Arbiter Court", "Any"],
    pickRate: 15.2,
    winRate: 54.1,
    avgPlacement: 3.5,
    synergies: ["Divine Right", "Arbiter's Gaze"],
    counters: [],
    tags: ["boon", "prismatic", "combat"]
  },
  {
    id: "aug_divine_right",
    name: "Divine Right",
    tier: "gold",
    description: "Divine units gain a bonus boon effect permanently after each combat they survive. Stacks up to 3 times.",
    effect: "Divine units scale permanently via boons",
    bestComps: ["Divine Ascension", "Space Groove"],
    pickRate: 21.5,
    winRate: 52.8,
    avgPlacement: 3.6,
    synergies: ["Space God Blessing", "Meeple Mayhem"],
    counters: ["Anti-Divine"],
    tags: ["boon", "trait", "gold", "combat"]
  },
  {
    id: "aug_arbiters_gaze",
    name: "Arbiter's Gaze",
    tier: "gold",
    description: "Arbiter units gain +15% damage and +10% damage reduction. Arbiter abilities have 20% chance to trigger twice.",
    effect: "+15% damage, +10% DR, 20% double cast",
    bestComps: ["Arbiter Court", "Divine Ascension"],
    pickRate: 18.3,
    winRate: 53.2,
    avgPlacement: 3.4,
    synergies: ["Space God Blessing", "Divine Right"],
    counters: ["Anti-Arbiter"],
    tags: ["trait", "gold", "offense", "defense"]
  },
  {
    id: "aug_meeple_mayhem",
    name: "Meeple Mayhem",
    tier: "gold",
    description: "Meeple units gain +20% attack speed and +10% ability power. Meeple abilities create clones on cast.",
    effect: "+20% AS, +10% AP, clone on cast",
    bestComps: ["Meeple Mayhem", "N.O.V.A. Core"],
    pickRate: 16.8,
    winRate: 51.9,
    avgPlacement: 3.7,
    synergies: ["Divine Right", "N.O.V.A. Surge"],
    counters: ["Anti-Meeple"],
    tags: ["trait", "gold", "offense", "utility"]
  },
  {
    id: "aug_nova_surge",
    name: "N.O.V.A. Surge",
    tier: "gold",
    description: "N.O.V.A. units gain +25% ability power and +15% mana generation. N.O.V.A. abilities chain to nearby enemies.",
    effect: "+25% AP, +15% mana, chain abilities",
    bestComps: ["N.O.V.A. Core", "Stargazer Council"],
    pickRate: 19.4,
    winRate: 52.5,
    avgPlacement: 3.5,
    synergies: ["Meeple Mayhem", "Stargazer's Call"],
    counters: ["Anti-N.O.V.A."],
    tags: ["trait", "gold", "AP", "mana"]
  },
  {
    id: "aug_stargazers_call",
    name: "Stargazer's Call",
    tier: "gold",
    description: "Stargazer units gain +20% damage and +15% ability power. Stargazer abilities have 25% chance to trigger twice.",
    effect: "+20% damage, +15% AP, 25% double cast",
    bestComps: ["Stargazer Council", "N.O.V.A. Core"],
    pickRate: 17.2,
    winRate: 53.8,
    avgPlacement: 3.3,
    synergies: ["N.O.V.A. Surge", "Cosmic Harmony"],
    counters: ["Anti-Stargazer"],
    tags: ["trait", "gold", "offense", "AP"]
  },
  {
    id: "aug_cosmic_harmony",
    name: "Cosmic Harmony",
    tier: "silver",
    description: "All units gain +5% damage and +5% ability power. Synergies grant +2% bonus stats per active trait.",
    effect: "+5% damage, +5% AP, +2% per trait",
    bestComps: ["Any", "Multi-Trait"],
    pickRate: 24.1,
    winRate: 50.3,
    avgPlacement: 4.1,
    synergies: [],
    counters: [],
    tags: ["economy", "silver", "utility"]
  },
  {
    id: "aug_space_groove",
    name: "Space Groove",
    tier: "silver",
    description: "Space Groove units gain +10% attack speed and +5% ability power. Space Groove abilities have 15% chance to trigger twice.",
    effect: "+10% AS, +5% AP, 15% double cast",
    bestComps: ["Space Groove", "Vanguard Arbiter"],
    pickRate: 22.8,
    winRate: 51.2,
    avgPlacement: 3.9,
    synergies: ["Divine Right", "Vanguard's Might"],
    counters: [],
    tags: ["trait", "silver", "offense", "utility"]
  },
  {
    id: "aug_vanguard_might",
    name: "Vanguard's Might",
    tier: "silver",
    description: "Vanguard units gain +15% damage and +10% damage reduction. Vanguard abilities taunt nearby enemies.",
    effect: "+15% damage, +10% DR, taunt",
    bestComps: ["Vanguard Arbiter", "Bastion N.O.V.A."],
    pickRate: 20.5,
    winRate: 50.8,
    avgPlacement: 4.0,
    synergies: ["Space Groove", "Bastion's Shield"],
    counters: [],
    tags: ["trait", "silver", "offense", "defense"]
  },
  {
    id: "aug_bastion_shield",
    name: "Bastion's Shield",
    tier: "silver",
    description: "Bastion units gain +10% damage and +15% damage reduction. Bastion abilities shield allies.",
    effect: "+10% damage, +15% DR, shield allies",
    bestComps: ["Bastion N.O.V.A.", "Vanguard Arbiter"],
    pickRate: 19.7,
    winRate: 51.5,
    avgPlacement: 3.8,
    synergies: ["Vanguard's Might", "N.O.V.A. Surge"],
    counters: [],
    tags: ["trait", "silver", "defense", "utility"]
  },
  {
    id: "aug_primordial_swarm",
    name: "Primordial Swarm",
    tier: "silver",
    description: "Primordian units gain +15% attack speed and +10% ability power. Primordian abilities spawn swarmlings on hit.",
    effect: "+15% AS, +10% AP, spawn swarmlings",
    bestComps: ["Primordian Swarm", "Brawler Vanguard"],
    pickRate: 18.2,
    winRate: 50.1,
    avgPlacement: 4.2,
    synergies: ["Brawler's Fury", "Rogue's Edge"],
    counters: [],
    tags: ["trait", "silver", "offense", "utility"]
  },
  {
    id: "aug_brawler_fury",
    name: "Brawler's Fury",
    tier: "silver",
    description: "Brawler units gain +20% damage and +10% attack speed. Brawler abilities heal on hit.",
    effect: "+20% damage, +10% AS, heal on hit",
    bestComps: ["Brawler Vanguard", "Primordian Swarm"],
    pickRate: 17.9,
    winRate: 49.8,
    avgPlacement: 4.3,
    synergies: ["Primordial Swarm", "Vanguard's Might"],
    counters: [],
    tags: ["trait", "silver", "offense", "sustain"]
  },
  {
    id: "aug_rogue_edge",
    name: "Rogue's Edge",
    tier: "silver",
    description: "Rogue units gain +25% damage and +15% attack speed. Rogue abilities crit more often.",
    effect: "+25% damage, +15% AS, more crits",
    bestComps: ["Rogue Anima", "Challenger Sniper"],
    pickRate: 16.5,
    winRate: 50.5,
    avgPlacement: 4.0,
    synergies: ["Primordial Swarm", "Challenger's Strike"],
    counters: [],
    tags: ["trait", "silver", "offense", "crit"]
  },
  {
    id: "aug_challenger_strike",
    name: "Challenger's Strike",
    tier: "silver",
    description: "Challenger units gain +20% damage and +10% attack speed. Challenger abilities dash to backline.",
    effect: "+20% damage, +10% AS, dash to backline",
    bestComps: ["Challenger Sniper", "Rogue Anima"],
    pickRate: 15.8,
    winRate: 51.0,
    avgPlacement: 3.9,
    synergies: ["Rogue's Edge", "Sniper's Focus"],
    counters: [],
    tags: ["trait", "silver", "offense", "mobility"]
  },
  {
    id: "aug_sniper_focus",
    name: "Sniper's Focus",
    tier: "silver",
    description: "Sniper units gain +15% damage and +20% attack speed. Sniper abilities have +1 range.",
    effect: "+15% damage, +20% AS, +1 range",
    bestComps: ["Sniper Timebreaker", "Challenger Sniper"],
    pickRate: 14.7,
    winRate: 51.3,
    avgPlacement: 3.8,
    synergies: ["Challenger's Strike", "Timebreaker's Echo"],
    counters: [],
    tags: ["trait", "silver", "offense", "range"]
  },
  {
    id: "aug_timebreaker_echo",
    name: "Timebreaker's Echo",
    tier: "silver",
    description: "Timebreaker units gain +10% damage and +15% ability power. Timebreaker abilities slow enemies.",
    effect: "+10% damage, +15% AP, slow enemies",
    bestComps: ["Timebreaker Sniper", "Sniper's Focus"],
    pickRate: 13.9,
    winRate: 50.7,
    avgPlacement: 4.1,
    synergies: ["Sniper's Focus", "Psionic Overload"],
    counters: [],
    tags: ["trait", "silver", "offense", "utility"]
  },
  {
    id: "aug_psionic_overload",
    name: "Psionic Overload",
    tier: "silver",
    description: "Psionic units gain +20% ability power and +10% mana generation. Psionic abilities chain to nearby enemies.",
    effect: "+20% AP, +10% mana, chain abilities",
    bestComps: ["Psionic Marauder", "Timebreaker Sniper"],
    pickRate: 12.5,
    winRate: 49.9,
    avgPlacement: 4.2,
    synergies: ["Timebreaker's Echo", "Marauder's Charge"],
    counters: [],
    tags: ["trait", "silver", "AP", "mana"]
  },
  {
    id: "aug_marauder_charge",
    name: "Marauder's Charge",
    tier: "silver",
    description: "Marauder units gain +15% damage and +10% attack speed. Marauder abilities gain bonus damage on kill.",
    effect: "+15% damage, +10% AS, bonus damage on kill",
    bestComps: ["Marauder Psionic", "Psionic Overload"],
    pickRate: 11.8,
    winRate: 50.2,
    avgPlacement: 4.0,
    synergies: ["Psionic Overload", "Voyager's Journey"],
    counters: [],
    tags: ["trait", "silver", "offense", "sustain"]
  },
  {
    id: "aug_voyager_journey",
    name: "Voyager's Journey",
    tier: "silver",
    description: "Voyager units gain +10% damage and +15% ability power. Voyager abilities heal allies.",
    effect: "+10% damage, +15% AP, heal allies",
    bestComps: ["Voyager Marauder", "Marauder's Charge"],
    pickRate: 10.9,
    winRate: 50.6,
    avgPlacement: 3.9,
    synergies: ["Marauder's Charge", "Replicator's Field"],
    counters: [],
    tags: ["trait", "silver", "AP", "support"]
  },
  {
    id: "aug_replicator_field",
    name: "Replicator's Field",
    tier: "silver",
    description: "Replicator units gain +15% ability power and +10% mana generation. Replicator abilities create clones.",
    effect: "+15% AP, +10% mana, create clones",
    bestComps: ["Replicator Voyager", "Voyager's Journey"],
    pickRate: 9.7,
    winRate: 49.5,
    avgPlacement: 4.3,
    synergies: ["Voyager's Journey", "Shepherd's Blessing"],
    counters: [],
    tags: ["trait", "silver", "AP", "utility"]
  },
  {
    id: "aug_shepherd_blessing",
    name: "Shepherd's Blessing",
    tier: "silver",
    description: "Shepherd units gain +10% damage and +20% ability power. Shepherd abilities shield allies.",
    effect: "+10% damage, +20% AP, shield allies",
    bestComps: ["Shepherd Replicator", "Replicator's Field"],
    pickRate: 8.8,
    winRate: 50.1,
    avgPlacement: 4.1,
    synergies: ["Replicator's Field", "Anima's Grace"],
    counters: [],
    tags: ["trait", "silver", "AP", "support"]
  },
  {
    id: "aug_anima_grace",
    name: "Anima's Grace",
    tier: "silver",
    description: "Anima units gain +15% damage and +10% ability power. Anima abilities heal on hit.",
    effect: "+15% damage, +10% AP, heal on hit",
    bestComps: ["Anima Shepherd", "Shepherd's Blessing"],
    pickRate: 7.9,
    winRate: 49.8,
    avgPlacement: 4.2,
    synergies: ["Shepherd's Blessing", "Dark Star's Embrace"],
    counters: [],
    tags: ["trait", "silver", "offense", "sustain"]
  },
  {
    id: "aug_dark_star_embrace",
    name: "Dark Star's Embrace",
    tier: "silver",
    description: "Dark Star units gain +20% damage and +15% ability power. Dark Star abilities gain bonus on ally death.",
    effect: "+20% damage, +15% AP, bonus on ally death",
    bestComps: ["Dark Star Anima", "Anima's Grace"],
    pickRate: 7.2,
    winRate: 50.4,
    avgPlacement: 3.9,
    synergies: ["Anima's Grace", "Mecha's Might"],
    counters: [],
    tags: ["trait", "silver", "offense", "AP"]
  },
  {
    id: "aug_mecha_might",
    name: "Mecha's Might",
    tier: "silver",
    description: "Mecha units gain +15% damage and +10% damage reduction. Mecha abilities shield self.",
    effect: "+15% damage, +10% DR, shield self",
    bestComps: ["Mecha Dark Star", "Dark Star's Embrace"],
    pickRate: 6.5,
    winRate: 49.7,
    avgPlacement: 4.4,
    synergies: ["Dark Star's Embrace", "Conduit's Flow"],
    counters: [],
    tags: ["trait", "silver", "offense", "defense"]
  },
  {
    id: "aug_conduit_flow",
    name: "Conduit's Flow",
    tier: "silver",
    description: "Trait-focused augment for Conduit (TFT mana trait). Verify exact numbers in-game — not from Riot string tables.",
    effect: "Conduit synergy (see client)",
    bestComps: ["Conduit Mecha", "Mecha's Might"],
    pickRate: 5.8,
    winRate: 50.0,
    avgPlacement: 4.1,
    synergies: ["Mecha's Might", "Stargazer's Call"],
    counters: [],
    tags: ["trait", "silver", "AP", "utility"]
  }
]

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
  const [selectedAugment, setSelectedAugment] = useState<Augment | null>(null)

  useEffect(() => {
    if (!initialAugment) return
    const a = AUGMENTS.find((x) => x.name === initialAugment || x.id === initialAugment)
    if (a) setSelectedAugment(a)
  }, [initialAugment])

  const { placeholderAnimated: augmentsSearchPlaceholder } = useTypewriterPlaceholder(
    AUGMENT_GUIDE_PLACEHOLDER_WORDS,
    query.length > 0,
  )

  const filtered = useMemo(() => {
    let list = query ? AUGMENTS.filter(a =>
      a.name.toLowerCase().includes(query.toLowerCase()) ||
      a.description.toLowerCase().includes(query.toLowerCase()) ||
      a.tags.some(t => t.toLowerCase().includes(query.toLowerCase()))
    ) : [...AUGMENTS]

    if (tierFilter !== 'all') {
      list = list.filter(a => a.tier === tierFilter)
    }

    if (tagFilter !== 'all') {
      list = list.filter(a => a.tags.includes(tagFilter))
    }

    const tierOrder = { prismatic: 0, gold: 1, silver: 2 }
    return list.sort((a, b) => tierOrder[a.tier] - tierOrder[b.tier])
  }, [query, tierFilter, tagFilter])

  const handleAugmentClick = (augment: Augment) => {
    setSelectedAugment(augment)
  }

  const handleBack = () => {
    setSelectedAugment(null)
  }

  if (selectedAugment) {
    return <AugmentDetail augment={selectedAugment} onBack={handleBack} />
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
          <div style={{ fontSize: '10px', color: '#333', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px', marginTop: '16px' }}>
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
          <div style={{ fontSize: '10px', color: '#333', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px', marginTop: '16px' }}>
            Tag
          </div>
          <div className="flex flex-wrap gap-2">
            {(['all', 'boon', 'trait', 'economy', 'offense', 'defense', 'AP', 'mana', 'sustain', 'utility', 'crit', 'mobility', 'range', 'support'] as const).map((tag) => (
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
        <div className="grid grid-cols-2 gap-3">
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
  )
}

function AugmentCard({ augment, index, onClick }: { augment: Augment; index: number; onClick: () => void }) {
  const tierColors = TIER_COLORS[augment.tier] ?? TIER_COLORS.silver

  return (
    <div
      className="relative overflow-hidden cursor-pointer"
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: '10px',
        padding: '12px',
        transition: 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
        animation: `cardEnter 0.4s cubic-bezier(0.25, 1, 0.5, 1) ${index * 40}ms both`,
        boxShadow: augment.tier === 'prismatic' ? tierColors.glow : 'none',
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = tierColors.accent
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.3)'
        e.currentTarget.style.transform = 'scale(1.02)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = C.border
        e.currentTarget.style.boxShadow = augment.tier === 'prismatic' ? tierColors.glow : 'none'
        e.currentTarget.style.transform = 'scale(1)'
      }}
    >
      {/* Left Border Accent */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '3px',
          background: tierColors.accent,
        }}
      />

      {/* Tier Badge */}
      <div
        className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold"
        style={{
          color: tierColors.text,
          background: tierColors.bg,
          border: `1px solid ${tierColors.border}`,
        }}
      >
        {augment.tier.charAt(0).toUpperCase() + augment.tier.slice(1)}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, paddingLeft: 8 }}>
        <img
          src={augmentIconUrl(augment.name)}
          alt=""
          width={36}
          height={36}
          style={{ borderRadius: 6, objectFit: 'cover', flexShrink: 0 }}
          onError={(e) => { e.currentTarget.style.display = 'none' }}
        />
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'white' }}>{augment.name}</div>
      </div>

      {/* Description */}
      <div style={{ fontSize: '11px', color: '#555', lineHeight: '1.4', marginBottom: '8px', paddingLeft: '8px' }}>
        {augment.description}
      </div>

      {/* Stats Row */}
      <div
        className="flex gap-4"
        style={{
          paddingLeft: '8px',
          paddingTop: '8px',
          borderTop: `1px solid ${C.border}`,
        }}
      >
        <div>
          <div
            className="text-sm font-bold"
            style={{
              color: augment.winRate > 52 ? '#22c55e' : augment.winRate < 50 ? '#ef4444' : '#fbbf24',
            }}
          >
            {augment.winRate}%
          </div>
          <div className="text-gray-400 text-[10px]">WIN</div>
        </div>
        <div>
          <div className="text-white text-sm font-bold">{augment.pickRate}%</div>
          <div className="text-gray-400 text-[10px]">PICK</div>
        </div>
        <div>
          <div className="text-white text-sm font-bold">#{augment.avgPlacement}</div>
          <div className="text-gray-400 text-[10px]">AVG</div>
        </div>
      </div>
    </div>
  )
}

function AugmentDetail({ augment, onBack }: { augment: Augment; onBack: () => void }) {
  const tierColors = TIER_COLORS[augment.tier] ?? TIER_COLORS.silver

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
        ← Augments
      </button>

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
        <img
          src={augmentIconUrl(augment.name)}
          alt=""
          width={44}
          height={44}
          style={{ borderRadius: 8, objectFit: 'cover', border: '1px solid #2a2a2a' }}
          onError={(e) => { e.currentTarget.style.display = 'none' }}
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
