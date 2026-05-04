import React, { useMemo, useState, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import placeholderImg from '@/assets/icons/placeholder.svg'

/**
 * TFT unit data – a simplified shape for the tier list component.
 */
export interface TFTUnit {
  id: string
  name: string
  portraitUrl: string
  cost: 1 | 2 | 3 | 4 | 5
  tier: 'S' | 'A' | 'B' | 'C' | 'D'
  avgPlace: number // lower is better
  winRate: number // 0‑100
  top4Rate: number // 0‑100
  pickRate: number // 0‑100
  frequency: number // raw pick count
  items: { id: string; iconUrl: string; name: string }[] // up to 5
  traits: string[]
}

interface UnitTierListProps {
  units: TFTUnit[]
  isLoading: boolean
}

/** Colour helpers */
const avgPlaceColor = (value: number) => {
  if (value <= 2) return 'text-emerald-400'
  if (value <= 4) return 'text-lime-300'
  if (value <= 6) return 'text-yellow-300'
  if (value <= 8) return 'text-orange-300'
  return 'text-rose-400'
}

const TIER_COLORS: Record<TFTUnit['tier'], string> = {
  S: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  A: 'text-green-400 bg-green-500/10 border-green-500/30',
  B: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  C: 'text-neutral-400 bg-neutral-500/10 border-neutral-500/30',
  D: 'text-red-400 bg-red-500/10 border-red-500/30',
}

export const UnitTierList: React.FC<UnitTierListProps> = ({ units, isLoading }) => {
  // ---- Sorting -----------------------------------------------------------
  const [sortKey, setSortKey] = useState<keyof TFTUnit>('avgPlace')
  const [asc, setAsc] = useState<boolean>(true)

  const toggleSort = (key: keyof TFTUnit) => {
    if (sortKey === key) setAsc(!asc)
    else {
      setSortKey(key)
      setAsc(true)
    }
  }

  // ---- Filtering ----------------------------------------------------------
  const [filterTier, setFilterTier] = useState<TFTUnit['tier'] | 'All'>('All')
  const [filterCost, setFilterCost] = useState<number | 'All'>('All')

  // ---- Pagination ---------------------------------------------------------
  const [page, setPage] = useState(1)
  const pageSize = 30

  // ---- Derived data -------------------------------------------------------
  const displayed = useMemo(() => {
    let data = [...units]
    if (filterTier !== 'All') data = data.filter(u => u.tier === filterTier)
    if (filterCost !== 'All') data = data.filter(u => u.cost === filterCost)

    data.sort((a, b) => {
      const aVal = a[sortKey] as any
      const bVal = b[sortKey] as any
      if (typeof aVal === 'string') return asc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      return asc ? aVal - bVal : bVal - aVal
    })

    const totalPages = Math.max(1, Math.ceil(data.length / pageSize))
    const start = (page - 1) * pageSize
    const rows = data.slice(start, start + pageSize)
    return { rows, totalPages }
  }, [units, filterTier, filterCost, sortKey, asc, page])

  // Reset page whenever filters or sorting change
  useEffect(() => {
    setPage(1)
  }, [filterTier, filterCost, sortKey, asc])

  // ---- Render helpers -----------------------------------------------------
  const renderHeader = (label: string, key?: keyof TFTUnit) => (
    <th
      className="px-2 py-1 text-left text-xs font-medium text-ally-muted cursor-pointer select-none"
      onClick={() => key && toggleSort(key)}
    >
      <div className="flex items-center space-x-1">
        <span>{label}</span>
        {key && sortKey === key && (
          <ChevronDown className={`w-3 h-3 transition-transform ${asc ? 'rotate-180' : ''}`} />
        )}
      </div>
    </th>
  )

  const renderSkeletonRow = (i: number) => (
    <tr key={i} className="animate-pulse">
      <td className="px-2 py-1 flex items-center space-x-2">
        <div className="w-10 h-10 rounded bg-ally-hover" />
        <div className="h-4 w-24 rounded bg-ally-hover" />
      </td>
      <td className="px-2 py-1"><div className="h-4 w-6 rounded bg-ally-hover" /></td>
      <td className="px-2 py-1"><div className="h-4 w-8 rounded bg-ally-hover" /></td>
      <td className="px-2 py-1"><div className="h-4 w-8 rounded bg-ally-hover" /></td>
      <td className="px-2 py-1"><div className="h-4 w-8 rounded bg-ally-hover" /></td>
      <td className="px-2 py-1 flex items-center space-x-1"><div className="h-4 w-12 rounded bg-ally-hover" /><div className="text-ally-muted text-xs">(---%)</div></td>
      <td className="px-2 py-1 flex -space-x-2">
        {[...Array(5)].map((_, idx) => (
          <div key={idx} className="w-6 h-6 rounded-full bg-ally-hover border-2 border-ally-bg" />
        ))}
      </td>
      <td className="px-2 py-1"><div className="h-4 w-6 rounded bg-ally-hover" /></td>
    </tr>
  )

  // ---- Main render --------------------------------------------------------
  return (
    <div className="w-full">
      {/* Filter bar – hidden during skeleton */}
      {!isLoading && (
        <div className="flex flex-wrap gap-2 mb-4">
          {/* Tier filters */}
          <button
            className={`px-3 py-1 rounded text-xs ${filterTier === 'All' ? 'bg-ally-accent text-black' : 'bg-ally-card text-ally-muted'}`}
            onClick={() => setFilterTier('All')}
          >
            All Tiers
          </button>
          {(['S', 'A', 'B', 'C', 'D'] as const).map(t => (
            <button
              key={t}
              className={`px-3 py-1 rounded text-xs ${filterTier === t ? 'bg-ally-accent text-black' : 'bg-ally-card text-ally-muted'}`}
              onClick={() => setFilterTier(t)}
            >
              {t}
            </button>
          ))}
          {/* Cost filters */}
          <button
            className={`px-3 py-1 rounded text-xs ${filterCost === 'All' ? 'bg-ally-accent text-black' : 'bg-ally-card text-ally-muted'}`}
            onClick={() => setFilterCost('All')}
          >
            All Costs
          </button>
          {[1, 2, 3, 4, 5].map(c => (
            <button
              key={c}
              className={`px-3 py-1 rounded text-xs ${filterCost === c ? 'bg-ally-accent text-black' : 'bg-ally-card text-ally-muted'}`}
              onClick={() => setFilterCost(c)}
            >
              {c}g
            </button>
          ))}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full table-fixed">
          <thead className={isLoading ? "bg-ally-card text-ally-muted invisible" : "bg-ally-card text-ally-muted"}>
                <tr>
                  {renderHeader('Unit')}
                  {renderHeader('Tier', 'tier')}
                  {renderHeader('Avg Place', 'avgPlace')}
                  {renderHeader('Win %', 'winRate')}
                  {renderHeader('Top‑4 %', 'top4Rate')}
                  {renderHeader('Pick %', 'pickRate')}
                  <th className="px-2 py-1 text-left text-xs font-medium text-ally-muted">Popular Items</th>
                  {renderHeader('Cost', 'cost')}
                </tr>
              </thead>
          <tbody className="divide-y divide-ally-border">
            {isLoading
              ? Array.from({ length: 12 }).map((_, i) => renderSkeletonRow(i))
              : displayed.rows.map(unit => (
                  <tr
                    key={unit.id}
                    className="bg-ally-card hover:bg-ally-hover transition-colors duration-200"
                    title={unit.traits.join(', ')}
                  >
                    {/* Unit */}
                    <td className="px-2 py-1 flex items-center space-x-2">
                      <img src={unit.portraitUrl} alt={unit.name} className="w-10 h-10 rounded-full object-cover" onError={(e)=>{(e.target as HTMLImageElement).src=placeholderImg}} />
                      <span className="text-sm text-white">{unit.name}</span>
                    </td>
                    {/* Tier */}
                    <td className="px-2 py-1">
                      <span className={`inline-block px-1.5 py-0.5 text-xs font-medium rounded border ${TIER_COLORS[unit.tier]}`}>
                        {unit.tier}
                      </span>
                    </td>
                    {/* Avg Place */}
                    <td className={`px-2 py-1 ${avgPlaceColor(unit.avgPlace)}`}>{unit.avgPlace.toFixed(1)}</td>
                    {/* Win Rate */}
                    <td className="px-2 py-1 text-white">{unit.winRate.toFixed(1)}%</td>
                    {/* Top‑4 Rate */}
                    <td className="px-2 py-1 text-white">{unit.top4Rate.toFixed(1)}%</td>
                    {/* Pick Rate + frequency */}
                    <td className="px-2 py-1 text-white flex items-center space-x-1">
                      <span>{unit.pickRate.toFixed(1)}%</span>
                      <span className="text-ally-muted text-xs">({unit.frequency.toLocaleString()})</span>
                    </td>
                    {/* Popular Items */}
                    <td className="px-2 py-1 flex -space-x-2 items-center">
                      {unit.items.slice(0, 5).map(it => (
                        <img
                          key={it.id}
                          src={it.iconUrl}
                          alt={it.name}
                          title={it.name}
                          className="w-6 h-6 rounded-full object-cover border-2 border-ally-bg"
                        />
                      ))}
                    </td>
                    {/* Cost */}
                    <td className="px-2 py-1">
                      <span className="inline-block w-4 h-4 rounded-full bg-ally-accent" title={`${unit.cost} gold`} />
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!isLoading && displayed.totalPages > 1 && (
        <div className="flex justify-center mt-3 space-x-2">
          {Array.from({ length: displayed.totalPages }).map((_, i) => (
            <button
              key={i}
              className={`px-2 py-0.5 rounded ${page === i + 1 ? 'bg-ally-accent text-black' : 'bg-ally-card text-ally-muted'}`}
              onClick={() => setPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default UnitTierList
