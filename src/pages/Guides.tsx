import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'

interface ItemRecipe {
  item: string
  components: [string, string]
  category: 'AP' | 'AD' | 'Tank' | 'Utility'
}

const CATEGORIES = ['All', 'AP', 'AD', 'Tank', 'Utility'] as const

export function Guides() {
  const [recipes, setRecipes] = useState<ItemRecipe[]>([])
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<(typeof CATEGORIES)[number]>('All')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('./itemRecipes.json')
      .then((r) => r.json())
      .then((data: Record<string, [string, string]>) => {
        // Categorize roughly by item name heuristics
        const list: ItemRecipe[] = Object.entries(data).map(([item, components]) => {
          const name = item.toLowerCase()
          let category: ItemRecipe['category'] = 'Utility'
          if (name.includes('deathcap') || name.includes('gauntlet') || name.includes('shojin') || name.includes('gunblade') || name.includes('morello') || name.includes('rageblade') || name.includes('shadowflame') || name.includes('ionic')) category = 'AP'
          else if (name.includes('edge') || name.includes('whisper') || name.includes('firecannon') || name.includes('hurricane') || name.includes('shiv')) category = 'AD'
          else if (name.includes('warmog') || name.includes('bramble') || name.includes('dragon') || name.includes('titan') || name.includes('stoneplate') || name.includes('sunfire') || name.includes('portal') || name.includes('zeke')) category = 'Tank'
          return { item, components, category }
        })
        setRecipes(list)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const filtered = recipes.filter((r) => {
    const matchesCategory = activeCategory === 'All' || r.category === activeCategory
    const matchesSearch =
      !search.trim() ||
      r.item.toLowerCase().includes(search.toLowerCase()) ||
      r.components.some((c) => c.toLowerCase().includes(search.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  const categoryColors: Record<string, string> = {
    AP: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    AD: 'bg-red-500/15 text-red-400 border-red-500/30',
    Tank: 'bg-green-500/15 text-green-400 border-green-500/30',
    Utility: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#a1a1a1] text-sm">Loading item recipes...</div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a1a1a1]" />
          <input
            type="text"
            placeholder="Search items or components..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-[#a1a1a1] focus:outline-none focus:border-[#35c3e7]"
          />
        </div>
        <div className="flex gap-1">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCategory(c)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeCategory === c ? 'bg-[#252525] text-white' : 'text-[#a1a1a1] hover:text-white'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((r) => (
          <div
            key={r.item}
            className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-xl p-4 hover:border-[#35c3e7]/30 transition-colors"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${categoryColors[r.category]}`}>
                {r.category}
              </span>
            </div>
            <div className="text-sm font-semibold text-white mb-2">{r.item}</div>
            <div className="flex gap-2 text-[11px] text-[#a1a1a1]">
              <span className="px-2 py-1 bg-[#181818] border border-[#2a2a2a] rounded">{r.components[0]}</span>
              <span className="text-[#a1a1a1]">+</span>
              <span className="px-2 py-1 bg-[#181818] border border-[#2a2a2a] rounded">{r.components[1]}</span>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-[#a1a1a1] text-sm">No items match your search.</div>
      )}
    </div>
  )
}
