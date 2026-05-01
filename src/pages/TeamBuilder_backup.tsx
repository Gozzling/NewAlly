import { useState, useMemo, useCallback } from 'react'
import { UNITS } from '@/data/units'
import { SYNERGIES } from '@/data/synergies'
import { useAppStore } from '@/store/useAppStore'

const CC: Record<number, string> = { 1: 'text-gray-400', 2: 'text-green-400', 3: 'text-blue-400', 4: 'text-purple-400', 5: 'text-yellow-400' }
const CB: Record<number, string> = { 1: 'bg-gray-700', 2: 'bg-green-700', 3: 'bg-blue-700', 4: 'bg-purple-700', 5: 'bg-yellow-600' }
const HW = 90, HH = 78

function hp(w: number, h: number) {
  return `${w * 0.5},0 ${w},${h * 0.25} ${w},${h * 0.75} ${w * 0.5},${h} 0,${h * 0.75} 0,${h * 0.25}`
}
function clone<T>(x: T): T { return JSON.parse(JSON.stringify(x)) }

type B = (string | null)[]
type H = { board: B; bench: B }
const IB: B = Array(26).fill(null)
const IBe: B = Array(9).fill(null)

export function TeamBuilder() {
  const [hist, setHist] = useState<H[]>([{ board: clone(IB), bench: clone(IBe) }])
  const [hi, setHi] = useState(0)
  const [pk, setPk] = useState<{ t: 'board' | 'bench'; i: number } | null>(null)
  const [se, setSe] = useState(false)
  const [sn, setSn] = useState(true)
  const [st, setSt] = useState(true)
  const [sid, setSid] = useState('')
  const [augs, setAugs] = useState<string[]>([])
  const [comps, setComps] = useState<string[]>([])

  const savedComps = useAppStore(s => s.savedComps)
  const addSavedComp = useAppStore(s => s.addSavedComp)
  const removeSavedComp = useAppStore(s => s.removeSavedComp)
  const loadSavedComp = useAppStore(s => s.loadSavedComp)

  const cur = hist[hi], board = cur.board, bench = cur.bench
  const ps = useCallback((n: H) => {
    const nh = hist.slice(0, hi + 1).concat(n)
    if (nh.length > 50) nh.shift()
    setHist(nh); setHi(nh.length - 1)
  }, [hist, hi])

  const place = (name: string, t: 'board' | 'bench', i: number) => {
    const nb = clone(board), nbe = clone(bench)
    if (t === 'board') nb[i] = name; else nbe[i] = name
    ps({ board: nb, bench: nbe }); setPk(null)
  }
  const remove = (t: 'board' | 'bench', i: number) => {
    const nb = clone(board), nbe = clone(bench)
    if (t === 'board') nb[i] = null; else nbe[i] = null
    ps({ board: nb, bench: nbe })
  }
  const clear = () => ps({ board: clone(IB), bench: clone(IBe) })
  const undo = () => { if (hi > 0) setHi(hi - 1) }
  const redo = () => { if (hi < hist.length - 1) setHi(hi + 1) }

  const all = [...board, ...bench].filter(Boolean) as string[]
  const um = useMemo(() => {
    const m = new Map<string, typeof UNITS[number]>()
    all.forEach(n => { const u = UNITS.find(x => x.name === n); if (u) m.set(n, u) })
    return m
  }, [all])

  const traits = useMemo(() => {
    const c: Record<string, number> = {}
    all.forEach(n => um.get(n)?.traits.forEach(t => c[t] = (c[t] || 0) + 1))
    return Object.entries(c).map(([name, count]) => {
      const syn = SYNERGIES.find(s => s.name === name)
      const th = syn?.thresholds.filter(t => count >= t.count).pop()
      return { name, count, syn, active: !!th, next: syn?.thresholds.find(t => count < t.count) }
    }).sort((a, b) => (b.active ? 1 : 0) - (a.active ? 1 : 0))
  }, [all, um])

  const cost = all.reduce((s, n) => s + (um.get(n)?.cost || 0), 0)

  const save = () => {
    const n = window.prompt('Name:')
    if (n) addSavedComp({ id: `${Date.now()}-${n.replace(/\s+/g, '-')}`, name: n, units: all, timestamp: Date.now() })
  }
  const load = () => {
    if (!sid) return
    loadSavedComp(sid)
    const c = savedComps.find(x => x.id === sid)
    if (c) {
      const nb = clone(IB), nbe = clone(IBe)
      c.units.forEach((u, i) => { if (i < 26) nb[i] = u; else if (i < 35) nbe[i - 26] = u })
      ps({ board: nb, bench: nbe })
    }
  }
  const del = () => { if (sid && window.confirm('Delete?')) { removeSavedComp(sid); setSid('') } }
  const share = () => {
    const c = savedComps.find(x => x.id === sid)
    if (c) window.prompt('URL:', `${window.location.origin}${window.location.pathname}?comp=${btoa(JSON.stringify(c))}`)
  }

  const rows = [7, 6, 7, 6]

  return (
    <div className="p-4 space-y-3 select-none min-w-[560px]">
      {/* Toolbar */}
      <div className="flex items-center gap-1.5 flex-wrap mb-2">
        <button onClick={undo} disabled={hi <= 0} className="px-3 py-1.5 rounded-[20px] border border-[#252545] bg-[#0f0f22] text-[#666] text-[11px] cursor-pointer transition-all hover:border-[#555] hover:text-[#ccc] disabled:opacity-40">Undo</button>
        <button onClick={redo} disabled={hi >= hist.length - 1} className="px-3 py-1.5 rounded-[20px] border border-[#252545] bg-[#0f0f22] text-[#666] text-[11px] cursor-pointer transition-all hover:border-[#555] hover:text-[#ccc] disabled:opacity-40">Redo</button>
        <button onClick={clear} className="px-3 py-1.5 rounded-[20px] border border-[#252545] bg-[#0f0f22] text-[#666] text-[11px] cursor-pointer transition-all hover:border-[#555] hover:text-[#ccc]">Clear</button>
        <div className="flex-1 min-w-[6px]"></div>
        <button onClick={() => { const fi = board.findIndex(x => x === null); if (fi >= 0) setPk({ t: 'board', i: fi }) }} className={`px-3 py-1.5 rounded-[20px] border bg-[#0f0f22] text-[11px] cursor-pointer transition-all ${pk ? 'border-[#f0b429] text-[#f0b429] bg-[rgba(240,180,41,0.12)]' : 'border-[#f0b429] text-[#f0b429]'}`}>+ Units</button>
        <div className="flex-1 min-w-[6px]"></div>
        <button onClick={() => setSe(s => !s)} className={`px-3 py-1.5 rounded-[20px] border text-[11px] cursor-pointer transition-all ${se ? 'border-[#f0b429] text-[#f0b429] bg-[rgba(240,180,41,0.08)]' : 'border-[#252545] bg-[#0f0f22] text-[#555]'}`}>Enemy</button>
        <button onClick={() => setSn(s => !s)} className={`px-3 py-1.5 rounded-[20px] border text-[11px] cursor-pointer transition-all ${sn ? 'border-[#f0b429] text-[#f0b429] bg-[rgba(240,180,41,0.08)]' : 'border-[#252545] bg-[#0f0f22] text-[#555]'}`}>Names</button>
        <button onClick={() => setSt(s => !s)} className={`px-3 py-1.5 rounded-[20px] border text-[11px] cursor-pointer transition-all ${st ? 'border-[#f0b429] text-[#f0b429] bg-[rgba(240,180,41,0.08)]' : 'border-[#252545] bg-[#0f0f22] text-[#555]'}`}>Traits</button>
      </div>

      {/* Save / Load Toolbar */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <select value={sid} onChange={e => setSid(e.target.value)} className="text-xs bg-[#0f0f22] border border-[#252545] text-white rounded px-2 py-1">
          <option value="">Load comp…</option>
          {savedComps.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
        </select>
        <button onClick={load} disabled={!sid} className="px-3 py-1.5 rounded-[20px] border border-[#252545] bg-[#0f0f22] text-[#666] text-[11px] cursor-pointer transition-all hover:border-[#555] hover:text-[#ccc] disabled:opacity-40">Load</button>
        <button onClick={save} className="px-3 py-1.5 rounded-[20px] border border-[#35c3e7]/30 bg-[#0f0f22] text-[#35c3e7] text-[11px] cursor-pointer transition-all hover:border-[#35c3e7]/60">Save</button>
        <button onClick={del} disabled={!sid} className="px-3 py-1.5 rounded-[20px] border border-red-900/30 bg-[#0f0f22] text-red-400 text-[11px] cursor-pointer transition-all hover:border-red-500/60 disabled:opacity-40">Delete</button>
        <button onClick={share} disabled={!sid} className="px-3 py-1.5 rounded-[20px] border border-[#252545] bg-[#0f0f22] text-[#666] text-[11px] cursor-pointer transition-all hover:border-[#555] hover:text-[#ccc] disabled:opacity-40">Share</button>
      </div>

      {/* Board */}
      <div className="relative bg-[#0f0f1a] rounded-xl border border-[#1a1a2e] shadow-inner p-3 w-full flex justify-center">
        <svg width="100%" height="100%" viewBox="0 0 685 340" preserveAspectRatio="xMidYMid meet">
          {rows.map((cnt, r) => {
            const off = r % 2 === 1 ? HW / 2 : 0
            const baseIdx = rows.slice(0, r).reduce((a, b) => a + b, 0)
            return Array.from({ length: cnt }, (_, c) => {
              const idx = baseIdx + c
              const x = off + c * HW
              const y = r * HH * 0.75 + 5
              const u = board[idx]
              const unit = u ? UNITS.find(x => x.name === u) : null
              return (
                <g key={`${r}-${c}`} transform={`translate(${x},${y})`}>
                  <polygon points={hp(HW, HH)} fill={u ? CB[unit?.cost || 1] : '#1a1a2e'} stroke={u ? '#3a3a5c' : '#3a3a5c'} strokeWidth={2}
                    className="cursor-pointer hover:stroke-[#f0b429] transition-colors"
                    onClick={() => { if (u) remove('board', idx); else setPk({ t: 'board', i: idx }) }} />
                  {!u && <text x={HW / 2} y={HH / 2 + 5} textAnchor="middle" fill="#1a1a32" fontSize="16" pointerEvents="none">+</text>}
                  {sn && u && <text x={HW / 2} y={HH / 2 - 3} textAnchor="middle" fill="white" fontSize="10" fontWeight="600" pointerEvents="none">{u.length > 11 ? u.slice(0, 10) + '…' : u}</text>}
                  {sn && u && unit && <text x={HW / 2} y={HH / 2 + 9} textAnchor="middle" fill={CC[unit.cost]} fontSize="7.5" pointerEvents="none">${unit.cost}</text>}
                  {st && u && unit && <text x={HW / 2} y={HH - 8} textAnchor="middle" fill={CC[unit.cost]} fontSize="8" pointerEvents="none">{unit.traits.slice(0, 2).join(',')}</text>}
                </g>
              )
            })
          })}
          {/* Bench */}
          {(() => {
            const bw = 65, bg = 6, bh = 55
            const totalW = 9 * bw + 8 * bg
            const startX = (685 - totalW) / 2
            const by = 270
            return bench.map((u, i) => {
              const unit = u ? UNITS.find(x => x.name === u) : null
              return (
                <g key={`bench-${i}`}>
                  <rect x={startX + i * (bw + bg)} y={by} width={bw} height={bh} rx={4}
                    fill={u ? CB[unit?.cost || 1] : '#1a1a2e'} stroke="#3a3a5c" strokeWidth={2}
                    className="cursor-pointer hover:stroke-[#f0b429] transition-colors"
                    onClick={() => { if (u) remove('bench', i); else setPk({ t: 'bench', i }) }} />
                  {sn && u && <text x={startX + i * (bw + bg) + bw / 2} y={by + bh / 2} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="10" fontWeight="bold" pointerEvents="none">{u}</text>}
                </g>
              )
            })
          })()}
        </svg>
        <div className="mt-1 text-center text-[10px] text-neutral-500">Total Cost: <span className="text-yellow-400 font-bold">${cost}</span> · Units: {all.length}</div>
      </div>

      {/* Traits */}
      <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-xl p-3">
        <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1">Active Traits</div>
        <div className="flex flex-wrap gap-2">
          {traits.map(t => (
            <div key={t.name} className={`text-xs px-2 py-1 rounded border ${t.active ? 'bg-[#2a2218] border-[#f0b429] text-yellow-400' : 'bg-[#1f1f1f] border-[#2a2a2a] text-neutral-500'}`}>
              <span className="font-semibold">{t.name}</span> <span className="ml-1">{t.count}</span>
              {t.active && t.syn && <span className="ml-1 text-[10px] opacity-70">{t.syn.thresholds.filter(th => t.count >= th.count).pop()?.effect}</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Augments & Components */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-xl p-3">
          <div className="flex items-center justify-between mb-2"><span className="text-xs font-semibold text-white">Augments</span><button onClick={() => { const a = window.prompt('Augment:'); if (a) setAugs([...augs, a]) }} className="text-xs bg-[#35c3e7]/20 text-[#35c3e7] px-2 py-0.5 rounded">+</button></div>
          {augs.map((a, i) => (<div key={i} className="text-xs text-neutral-300 flex justify-between items-center"><span>{a}</span><button onClick={() => setAugs(augs.filter((_, j) => j !== i))} className="text-red-400 text-[10px]">✕</button></div>))}
          {augs.length === 0 && <div className="text-[10px] text-neutral-500">No augments added</div>}
        </div>
        <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-xl p-3">
          <div className="flex items-center justify-between mb-2"><span className="text-xs font-semibold text-white">Components</span><button onClick={() => { const c = window.prompt('Component:'); if (c) setComps([...comps, c]) }} className="text-xs bg-[#35c3e7]/20 text-[#35c3e7] px-2 py-0.5 rounded">+</button></div>
          <div className="flex flex-wrap gap-1">{comps.map((c, i) => (<span key={i} className="text-xs bg-neutral-800 text-neutral-300 px-1.5 py-0.5 rounded">{c} <button onClick={() => setComps(comps.filter((_, j) => j !== i))} className="text-red-400">✕</button></span>))}</div>
          {comps.length === 0 && <div className="text-[10px] text-neutral-500">No components added</div>}
        </div>
      </div>

      {/* Unit Picker Modal */}
      {pk && <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center" onClick={() => setPk(null)}>
        <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-xl p-4 max-h-[80vh] overflow-y-auto w-[360px]" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-3"><span className="text-sm font-bold text-white">Pick Unit</span><button onClick={() => setPk(null)} className="text-neutral-400 hover:text-white">✕</button></div>
          {[5, 4, 3, 2, 1].map(cost => {
            const list = UNITS.filter(u => u.cost === cost)
            if (list.length === 0) return null
            return (
              <div key={cost} className="mb-3">
                <div className={`text-xs font-bold mb-1 ${CC[cost]}`}>${cost} Units</div>
                <div className="grid grid-cols-3 gap-1.5">
                  {list.map(u => {
                    const disabled = board.includes(u.name) || bench.includes(u.name)
                    return (
                      <button key={u.id} disabled={disabled} onClick={() => place(u.name, pk.t, pk.i)} className={`text-left px-2 py-1 rounded border text-xs transition-colors ${disabled ? 'opacity-40 cursor-not-allowed bg-neutral-800 border-neutral-700' : 'bg-[#2a2a2a] border-[#3a3a3a] hover:border-[#35c3e7]'}`}>
                        <div className={`font-medium truncate ${disabled ? 'text-neutral-500' : 'text-white'}`}>{u.name}</div>
                        <div className="text-[9px] text-neutral-500 truncate">{u.traits.join(',')}</div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>}
    </div>
  )
}
