import { useState, useMemo } from 'react'
import { UNITS } from '@/data/units'
import { SYNERGIES } from '@/data/synergies'
import { Hammer, X } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'

const COST_COLORS: Record<number, string> = { 1: 'text-neutral-400', 2: 'text-green-400', 3: 'text-blue-400', 4: 'text-purple-400', 5: 'text-yellow-400' }

export function TeamBuilder() {
  const [team, setTeam] = useState<string[]>([])
  const [selectedCompId, setSelectedCompId] = useState<string>('')

  const { savedComps, addSavedComp, removeSavedComp, loadSavedComp } = useAppStore(
    (s) => ({
      savedComps: s.savedComps,
      addSavedComp: s.addSavedComp,
      removeSavedComp: s.removeSavedComp,
      loadSavedComp: s.loadSavedComp,
    })
  )

  const addUnit = (name: string) => { if (team.length < 10 && !team.includes(name)) setTeam([...team, name]) }
  const removeUnit = (name: string) => setTeam(team.filter(u => u !== name))
  const clearTeam = () => setTeam([])

  const handleSave = () => {
    const name = window.prompt('Enter a name for this composition:')
    if (name) {
      const newComp = {
        id: `${Date.now()}-${name.replace(/\s+/g, '-')}`,
        name,
        units: team,
        timestamp: Date.now(),
      }
      addSavedComp(newComp)
    }
  }

  const handleLoad = () => {
    if (selectedCompId) {
      loadSavedComp(selectedCompId)
      // Also load the comp into the team builder for editing
      const comp = savedComps.find(c => c.id === selectedCompId)
      if (comp) {
        setTeam(comp.units)
      }
    }
  }

  const handleDelete = () => {
    if (selectedCompId && window.confirm('Are you sure you want to delete this saved comp?')) {
      removeSavedComp(selectedCompId)
      setSelectedCompId('')
    }
  }

  const handleShare = () => {
    if (selectedCompId) {
      const comp = savedComps.find(c => c.id === selectedCompId)
      if (comp) {
        const compData = btoa(JSON.stringify(comp))
        const url = `${window.location.origin}${window.location.pathname}?comp=${compData}`
        window.prompt('Share this URL:', url)
      }
    }
  }

  const teamUnits = useMemo(() => team.map(n => UNITS.find(u => u.name === n)).filter(Boolean) as typeof UNITS, [team])

  const activeTraits = useMemo(() => {
    const traitCounts: Record<string, number> = {}
    teamUnits.forEach(u => u.traits.forEach(t => { traitCounts[t] = (traitCounts[t] || 0) + 1 }))
    return Object.entries(traitCounts)
      .map(([name, count]) => {
        const syn = SYNERGIES.find(s => s.name === name)
        const threshold = syn?.thresholds.filter(t => count >= t.count).pop()
        return { name, count, syn, active: !!threshold, nextThreshold: syn?.thresholds.find(t => count < t.count) }
      })
      .sort((a, b) => (b.active ? 1 : 0) - (a.active ? 1 : 0))
  }, [teamUnits])

  const totalCost = useMemo(() => teamUnits.reduce((s, u) => s + u.cost, 0), [teamUnits])

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2"><Hammer className="w-5 h-5 text-[#35c3e7]" /><h1 className="text-lg font-bold text-white">Team Builder</h1></div>
        <div className="flex flex-wrap gap-2">
          <button onClick={handleSave} className="text-xs bg-[#35c3e7]/20 hover:bg-[#35c3e7]/30 text-[#35c3e7] hover:text-white transition-colors px-2 py-1 rounded">Save Comp</button>
          <select
            value={selectedCompId}
            onChange={(e) => setSelectedCompId(e.target.value)}
            className="text-xs border border-[#2a2a2a] rounded px-2 py-1 bg-[#1f1f1f] text-white"
          >
            <option value="">Load a saved comp</option>
            {savedComps.map(comp => (
              <option key={comp.id} value={comp.id}>
                {comp.name} ({new Date(comp.timestamp).toLocaleString()})
              </option>
            ))}
          </select>
          <button
            onClick={handleLoad}
            disabled={!selectedCompId}
            className={`text-xs bg-[#35c3e7]/20 hover:bg-[#35c3e7]/30 text-[#35c3e7] hover:text-white transition-colors px-2 py-1 rounded ${!selectedCompId ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Load
          </button>
          <button
            onClick={handleDelete}
            disabled={!selectedCompId}
            className={`text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-white transition-colors px-2 py-1 rounded ${!selectedCompId ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Delete
          </button>
          <button
            onClick={handleShare}
            disabled={!selectedCompId}
            className={`text-xs bg-[#35c3e7]/20 hover:bg-[#35c3e7]/30 text-[#35c3e7] hover:text-white transition-colors px-2 py-1 rounded ${!selectedCompId ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Share
          </button>
        </div>
      </div>

      {/* Active team */}
      <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-xl p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs text-neutral-400">{team.length}/10 units &middot; Total cost: <span className="text-yellow-400 font-semibold">{totalCost}</span></div>
        </div>
        {team.length === 0 ? <div className="text-xs text-neutral-500 text-center py-4">Click units below to build your team</div> : (
          <div className="flex flex-wrap gap-1.5">
            {teamUnits.map(u => (
              <button key={u.name} onClick={() => removeUnit(u.name)} className="flex items-center gap-1 px-2 py-1 bg-[#2a2a2a] hover:bg-red-500/20 hover:text-red-400 rounded text-xs text-white transition-colors">
                {u.name} <span className={COST_COLORS[u.cost]}>${u.cost}</span> <X className="w-3 h-3" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Active traits */}
      {activeTraits.length > 0 && (
        <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-xl p-3 space-y-1.5">
          <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1">Active Traits</div>
          {activeTraits.map(t => (
            <div key={t.name} className={`flex items-center gap-2 text-xs ${t.active ? 'text-white' : 'text-neutral-500'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${t.active ? 'bg-[#35c3e7]/20 text-[#35c3e7]' : 'bg-[#2a2a2a] text-neutral-500'}`}>{t.count}</span>
              <span className="font-medium">{t.name}</span>
              {t.active && t.syn && <span className="text-[10px] text-neutral-400">{t.syn.thresholds.filter(th => t.count >= th.count).pop()?.effect}</span>}
              {!t.active && t.nextThreshold && <span className="text-[10px] text-neutral-500">({t.nextThreshold.count} for next)</span>}
            </div>
          ))}
        </div>
      )}

      {/* Unit pool */}
      <div className="space-y-2">
        <div className="text-[10px] uppercase tracking-wider text-neutral-500">Unit Pool</div>
        {[5, 4, 3, 2, 1].map(cost => (
          <div key={cost}>
            <div className={`text-xs font-semibold mb-1 ${COST_COLORS[cost]}`}>${cost} Units</div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
              {UNITS.filter(u => u.cost === cost).map(u => (
                <button key={u.id} onClick={() => addUnit(u.name)} disabled={team.includes(u.name)} className={`text-left px-2 py-1.5 rounded bg-[#1f1f1f] border border-[#2a2a2a] hover:border-[#35c3e7] transition-colors text-xs ${team.includes(u.name) ? 'opacity-40' : ''}`}>
                  <div className="text-white font-medium truncate">{u.name}</div>
                  <div className="text-[10px] text-neutral-500 truncate">{u.traits.join(', ')</div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}