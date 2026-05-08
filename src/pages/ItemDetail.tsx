import { ArrowLeft, Box } from 'lucide-react'
import { unitIconUrl } from '@/utils/unitDisplay'
import { itemIconUrl } from '@/utils/itemDisplay'

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
}

interface ItemDetailProps {
  itemName: string
  onBack: () => void
}

export function ItemDetail({ itemName, onBack }: ItemDetailProps) {
  const item = ITEMS.find((i) => i.name === itemName)
  if (!item) return null

  const tierColors = TIER_COLORS[item.tier] ?? TIER_COLORS.C

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
        <img
          src={itemIconUrl(item.name)}
          alt=""
          width={44}
          height={44}
          style={{ borderRadius: 8, objectFit: 'cover', border: `1px solid ${C.border}` }}
          onError={(e) => { e.currentTarget.style.display = 'none' }}
        />
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: C.text }}>{item.name}</h1>
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
          {/* Components */}
          <div
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: '12px',
              padding: '20px',
              animation: `cardEnter 0.3s cubic-bezier(0.25, 1, 0.5, 1) 100ms both`,
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: C.muted, marginBottom: '12px' }}>Recipe</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ flex: 1, textAlign: 'center', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', fontSize: '13px', color: C.text }}>
                {item.components[0]}
              </div>
              <span style={{ fontSize: '20px', color: C.accent }}>+</span>
              <div style={{ flex: 1, textAlign: 'center', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', fontSize: '13px', color: C.text }}>
                {item.components[1]}
              </div>
            </div>
          </div>

          {/* Effect */}
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
            <div style={{ fontSize: '14px', color: '#d1d5db', lineHeight: 1.6, fontStyle: 'italic' }}>{item.effect}</div>
          </div>

          {/* Tags */}
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
          {/* Best On */}
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
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {item.bestOn.map((unit) => (
                <div key={unit} style={{ position: 'relative' }} title={unit}>
                  <img
                    src={unitIconUrl(unit)}
                    alt={unit}
                    style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }}
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                </div>
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
