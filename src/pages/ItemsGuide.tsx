import { useState, useMemo } from 'react'
import { Search, Box, Shield, Sword, Zap, Heart, Crosshair, Sparkles } from 'lucide-react'

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
  offense: <Sword className="w-3 h-3" />, defense: <Shield className="w-3 h-3" />, AP: <Sparkles className="w-3 h-3" />, tank: <Box className="w-3 h-3" />, sustain: <Heart className="w-3 h-3" />, mana: <Zap className="w-3 h-3" />, hybrid: <Crosshair className="w-3 h-3" />,
}

const TIER_COLORS = { S: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20', A: 'text-green-400 bg-green-500/10 border-green-500/20', B: 'text-blue-400 bg-blue-500/10 border-blue-500/20', C: 'text-neutral-400 bg-neutral-500/10 border-neutral-500/20' }

export function ItemsGuide() {
  const [query, setQuery] = useState('')
  const [tagFilter, setTagFilter] = useState('all')

  const filtered = useMemo(() => {
    let list = query ? ITEMS.filter(i => i.name.toLowerCase().includes(query.toLowerCase()) || i.components.some(c => c.toLowerCase().includes(query.toLowerCase()))) : [...ITEMS]
    if (tagFilter !== 'all') list = list.filter(i => i.tags.includes(tagFilter))
    return list.sort((a, b) => (a.tier === 'S' ? -1 : b.tier === 'S' ? 1 : a.tier.localeCompare(b.tier)))
  }, [query, tagFilter])

  const allTags = Array.from(new Set(ITEMS.flatMap(i => i.tags)))

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center gap-2"><Box className="w-5 h-5 text-[#35c3e7]" /><h1 className="text-lg font-bold text-white">Items Guide</h1></div>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search item or component..." className="w-full bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#35c3e7]" /></div>
        <select value={tagFilter} onChange={e => setTagFilter(e.target.value)} className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#35c3e7]">
          <option value="all">All Tags</option>{allTags.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filtered.map(item => (
          <div key={item.name} className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-white">{item.name}</div>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${TIER_COLORS[item.tier]}`}>{item.tier}</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {item.tags.map(t => <span key={t} className="flex items-center gap-1 px-1.5 py-0.5 bg-[#2a2a2a] rounded text-[10px] text-neutral-400">{TAG_ICONS[t] || <Box className="w-3 h-3" />}{t}</span>)}
            </div>
            <div className="text-xs text-neutral-400">{item.components.join(' + ')}</div>
            <div className="text-xs text-neutral-300">{item.effect}</div>
            <div className="text-[11px] text-neutral-500">Best on: <span className="text-[#35c3e7]">{item.bestOn.join(', ')}</span></div>
          </div>
        ))}
      </div>
    </div>
  )
}
