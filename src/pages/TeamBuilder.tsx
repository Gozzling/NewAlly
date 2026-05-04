import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { UNITS } from '@/data/units'
import { SYNERGIES } from '@/data/synergies'
import { useAppStore } from '@/store/useAppStore'
import type { MetaComp } from '@/types/tft'

/* ─── Design tokens ─── */
const C = {
  bg:         '#181818',
  surface:    '#1f1f1f',
  border:     '#2a2a2a',
  accent:     '#00d4ff',
  accentDim:  'rgba(0,212,255,0.12)',
  danger:     '#ef4444',
  dangerDim:  'rgba(239,68,68,0.12)',
  text:       '#ffffff',
  muted:      '#a1a1a1',
  hexEmpty:   '#141414',
  hexHover:   '#1c1c1c',
  cost: {
    1: '#9aa4af', 2: '#34d399', 3: '#60a5fa',
    4: '#c084fc', 5: '#f59e0b',
  } as Record<number, string>,
}

/* ─── Hex geometry — R=22 for compact board ─── */
const R     = 22
const COL_W = R * Math.sqrt(3)
const ROW_H = R * 1.5
const PAD   = 16
const VW    = 300
const VH    = 171

function hexPts(cx: number, cy: number) {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 180) * (60 * i - 30)
    return `${cx + R * Math.cos(a)},${cy + R * Math.sin(a)}`
  }).join(' ')
}

type HexPos = { cx: number; cy: number }
const HEX_POSITIONS: HexPos[] = []
const ROW_COUNTS = [7, 6, 7, 6]
for (let r = 0; r < 4; r++) {
  for (let c = 0; c < ROW_COUNTS[r]; c++) {
    const offset = r % 2 === 1 ? COL_W / 2 : 0
    HEX_POSITIONS.push({ cx: PAD + R + offset + c * COL_W, cy: PAD + R + r * ROW_H })
  }
}
const BOARD_LEN = 26
type HistoryEntry = { pBoard: (string | null)[]; eBoard: (string | null)[] }

/* ─── Button tokens ─── */
const btnBase = {
  borderRadius: 6,
  transition: 'all 0.12s ease',
  cursor: 'pointer' as const,
  fontFamily: 'Rajdhani, sans-serif',
}

/* ─── Unit pill ─── */
function UnitPill({ name, traits, cost, placed, onClick }: {
  name: string; traits: string[]; cost: number; placed: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        ...btnBase,
        display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
        padding: '5px 9px',
        border: `1px solid ${placed ? C.accent : C.border}`,
        backgroundColor: placed ? `${C.accent}1a` : 'transparent',
        boxShadow: placed
          ? `0 0 10px rgba(0,212,255,0.5), 0 0 22px rgba(0,212,255,0.18)`
          : 'none',
        color: placed ? C.accent : C.muted,
        minWidth: 72, maxWidth: 84,
        fontFamily: 'Rajdhani, sans-serif',
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.01em',
        lineHeight: 1.3,
        transition: 'all 0.12s ease',
      }}
    >
      <span style={{ color: placed ? C.accent : C.muted, fontWeight: 700, fontSize: 10, lineHeight: 1.3 }}>{name}</span>
      <span style={{ color: C.muted, fontSize: 8, marginTop: 2, lineHeight: 1.2, opacity: 0.7 }}>{traits.slice(0, 2).join(' · ')}</span>
    </button>
  )
}

/* ═══════════════════════════════════════════════════════════════
   TeamBuilder
═══════════════════════════════════════════════════════════════ */
export function TeamBuilder({ importComp }: { importComp?: MetaComp }) {
  const savedComps      = useAppStore(s => s.savedComps)
  const addSavedComp    = useAppStore(s => s.addSavedComp)
  const removeSavedComp = useAppStore(s => s.removeSavedComp)

  const [hist, setHist] = useState<HistoryEntry[]>([
    { pBoard: Array(BOARD_LEN).fill(null), eBoard: Array(BOARD_LEN).fill(null) }
  ])
  const [hi, setHi] = useState(0)
  const cur = hist[hi]
  const pBoard = cur.pBoard
  const eBoard = cur.eBoard

  const [showEnemy,  setShowEnemy]  = useState(false)
  const [showNames, setShowNames]  = useState(true)
  const [showTraits, setShowTraits] = useState(true)
  const [showUnits,  setShowUnits]  = useState(false)
  const [sid, setSid]               = useState('')
  const [augs, setAugs]             = useState<string[]>([])
  const [comps, setComps]           = useState<string[]>([])
  const [unitPanelBoard, setUnitPanelBoard] = useState<'player' | 'enemy'>('player')

  // Import a comp's required units when triggered from outside
  useEffect(() => {
    if (importComp) {
      const nb = Array(BOARD_LEN).fill(null);
      importComp.requiredUnits.slice(0, BOARD_LEN).forEach((u, i) => {
        nb[i] = u;
      });
      // Reset history to start with imported composition
      setHist([{ pBoard: nb, eBoard: Array(BOARD_LEN).fill(null) }]);
      setHi(0);
    }
  }, [importComp]);

  /* Drag state */
  type DragItem  = { board: 'player' | 'enemy'; idx: number } | null
  const [dragItem,    setDragItem]    = useState<DragItem>(null)
  const [dragTarget, setDragTarget]  = useState<{ board: 'player' | 'enemy'; idx: number } | null>(null)

  /* SVG refs — used for mouse coordinate → SVG coordinate conversion */
  const svgPRef = useRef<SVGSVGElement>(null)
  const svgERef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  /* Guard: onClick fires after mouseup before setDragItem(null) commits */
  const justDroppedRef = useRef<{ board: 'player' | 'enemy'; idx: number } | null>(null)

  /* Hit-test: given a mouse event on an SVG, return the hex index under the cursor (or null) */
  const hitTest = (e: React.MouseEvent | MouseEvent, svgRef: React.RefObject<SVGSVGElement | null>) => {
    const svg = svgRef.current
    if (!svg) return null
    const rect = svg.getBoundingClientRect()
    const scaleX = VW / rect.width
    const scaleY = VH / rect.height
    const svgX = (e.clientX - rect.left) * scaleX
    const svgY = (e.clientY - rect.top)  * scaleY
    let closest = 0, minDist = Infinity
    for (let i = 0; i < BOARD_LEN; i++) {
      const dx = svgX - HEX_POSITIONS[i].cx
      const dy = svgY - HEX_POSITIONS[i].cy
      const d  = Math.sqrt(dx * dx + dy * dy)
      if (d < minDist) { minDist = d; closest = i }
    }
    return minDist < R * 1.5 ? closest : null
  }

  const pushHistory = useCallback((entry: HistoryEntry) => {
    setHist(prev => {
      const nh = prev.slice(0, hi + 1).concat(entry)
      if (nh.length > 40) nh.shift()
      return nh
    })
    setHi(prev => prev + 1)
  }, [hi])

  const undo = () => { if (hi > 0) setHi(hi - 1) }
  const redo = () => { if (hi < hist.length - 1) setHi(hi + 1) }
  const clear = () => {
    setDragItem(null); setDragTarget(null)
    pushHistory({ pBoard: Array(BOARD_LEN).fill(null), eBoard: Array(BOARD_LEN).fill(null) })
  }

  /* ─── Mouse-based drag: start ─── */
  const startDrag = (board: 'player' | 'enemy', idx: number) => {
    const arr = board === 'player' ? pBoard[idx] : eBoard[idx]
    if (arr) setDragItem({ board, idx })
  }

  /* ─── Mouse-based drag: drop ─── */
  const doDrop = useCallback((board: 'player' | 'enemy', idx: number) => {
    if (!dragItem) return
    const { board: sBoard, idx: sIdx } = dragItem
    if (sBoard === board && sIdx === idx) { setDragItem(null); setDragTarget(null); return }

    const srcArr = sBoard === 'player' ? [...pBoard] : [...eBoard]
    const dstArr = sBoard === board
      ? srcArr
      : board === 'player' ? [...pBoard] : [...eBoard]
    const unit       = srcArr[sIdx]
    const targetUnit = dstArr[idx]
    if (!unit) { setDragItem(null); setDragTarget(null); return }

    const writeDst = sBoard === board ? srcArr : dstArr
    writeDst[idx]    = unit
    srcArr[sIdx]     = targetUnit ?? null

    if (sBoard === 'player' && board === 'player') pushHistory({ pBoard: srcArr, eBoard: [...eBoard] })
    else if (sBoard === 'player' && board === 'enemy') pushHistory({ pBoard: srcArr, eBoard: dstArr })
    else if (sBoard === 'enemy' && board === 'player')  pushHistory({ pBoard: dstArr, eBoard: srcArr })
    else pushHistory({ pBoard: [...pBoard], eBoard: srcArr })

    justDroppedRef.current = { board, idx }
    setTimeout(() => { justDroppedRef.current = null }, 300)
    setDragItem(null); setDragTarget(null)
  }, [dragItem, pBoard, eBoard, pushHistory])

  /* Global mouse-up: fires when mouse is released anywhere in the window */
  useEffect(() => {
    const onMouseUp = (e: globalThis.MouseEvent) => {
      if (!dragItem) return

      /* Check player SVG */
      const pIdx = hitTest(e as unknown as React.MouseEvent, svgPRef)
      if (pIdx !== null) { doDrop('player', pIdx); return }

      /* Check enemy SVG */
      const eIdx = hitTest(e as unknown as React.MouseEvent, svgERef)
      if (eIdx !== null) { doDrop('enemy', eIdx); return }

      setDragItem(null); setDragTarget(null)
    }

    window.addEventListener('mouseup', onMouseUp)
    return () => window.removeEventListener('mouseup', onMouseUp)
  }, [dragItem, doDrop])

  /* ─── Mouse drag: track hovered target while dragging ─── */
  const handleMouseMove = (e: React.MouseEvent, board: 'player' | 'enemy') => {
    if (!dragItem) { setDragTarget(null); return }
    const ref = board === 'player' ? svgPRef : svgERef
    const idx = hitTest(e, ref)
    if (idx === null) { setDragTarget(null); return }
    setDragTarget({ board, idx })
  }

  const handleMouseLeave = (_e: React.MouseEvent, board: 'player' | 'enemy') => {
    if (dragItem) setDragTarget(null)
  }

  /* ─── Hex click: remove unit ─── */
  const handleHexClick = (board: 'player' | 'enemy', idx: number) => {
    const jd = justDroppedRef.current
    if (jd?.board === board && jd?.idx === idx) return
    if (dragItem) return
    const arr = board === 'player' ? pBoard : eBoard
    if (!arr[idx]) return
    const nb = [...arr]; nb[idx] = null
    if (board === 'player') pushHistory({ pBoard: nb, eBoard: [...eBoard] })
    else pushHistory({ pBoard: [...pBoard], eBoard: nb })
  }

  /* ─── Board computed data ─── */
  const pUnits = useMemo(() => pBoard.filter(Boolean) as string[], [pBoard])
  const eUnits = useMemo(() => eBoard.filter(Boolean) as string[], [eBoard])
  const allUnits = useMemo(() => [...pUnits, ...eUnits], [pUnits, eUnits])

  const unitMap = useMemo(() => {
    const m = new Map<string, typeof UNITS[number]>()
    allUnits.forEach(n => { const u = UNITS.find(x => x.name === n); if (u) m.set(n, u) })
    return m
  }, [allUnits])

  const traits = useMemo(() => {
    const c: Record<string, number> = {}
    allUnits.forEach(n => unitMap.get(n)?.traits.forEach(t => { c[t] = (c[t] || 0) + 1 }))
    return Object.entries(c).map(([name, count]) => {
      const syn = SYNERGIES.find(s => s.name === name)
      const active = !!syn?.thresholds.filter(t => count >= t.count).pop()
      const next   = syn?.thresholds.find(t => count < t.count)
      return { name, count, active, next, effect: syn && count > 0 ? syn.thresholds.filter(t => count >= t.count).pop()?.effect : '' }
    }).sort((a, b) => (b.active ? 1 : 0) - (a.active ? 1 : 0))
  }, [allUnits, unitMap])

  const pBoardUnits = pUnits.length
  const pBoardCost  = pUnits.reduce((s, n) => s + (unitMap.get(n)?.cost || 0), 0)
  const eBoardUnits = eUnits.length
  const eBoardCost  = eUnits.reduce((s, n) => s + (unitMap.get(n)?.cost || 0), 0)
  const activeTraits = traits.filter(t => t.active)

  /* ─── Drag hint ─── */
  const dragHint = dragItem
    ? dragTarget
      ? 'Release to place'
      : 'Drag to a hex'
    : null

  /* ─── Save / Load / Delete / Share ─── */
  const targetBoard = unitPanelBoard === 'player' ? pBoard : eBoard
  const handleUnitClick = (name: string) => {
    const existingIdx = targetBoard.indexOf(name)
    let nb: (string | null)[]
    if (existingIdx !== -1) { nb = [...targetBoard]; nb[existingIdx] = null }
    else {
      const emptyIdx = targetBoard.findIndex(x => x === null)
      if (emptyIdx === -1) return
      nb = [...targetBoard]; nb[emptyIdx] = name
    }
    if (unitPanelBoard === 'player') pushHistory({ pBoard: nb, eBoard: [...eBoard] })
    else pushHistory({ pBoard: [...pBoard], eBoard: nb })
  }

  const saveComp = () => {
    const n = window.prompt('Composition name:')
    if (!n) return
    addSavedComp({ id: Date.now().toString(), name: n, units: Object.values(pBoard).filter(Boolean) as string[], timestamp: Date.now() })
  }
  const loadComp = () => {
    if (!sid) return
    const c = savedComps.find(x => x.id === sid)
    if (!c) return
    const nb: (string | null)[] = Array(BOARD_LEN).fill(null)
    c.units.slice(0, BOARD_LEN).forEach((u, i) => { nb[i] = u })
    pushHistory({ pBoard: nb, eBoard: Array(BOARD_LEN).fill(null) })
  }
  const deleteComp = () => {
    if (!sid) return
    if (window.confirm(`Delete "${savedComps.find(x => x.id === sid)?.name}"?`)) { removeSavedComp(sid); setSid('') }
  }
  const shareComp = () => {
    if (!sid) return
    const c = savedComps.find(x => x.id === sid)
    if (!c) return
    window.prompt('Share URL:', `${window.location.origin}${window.location.pathname}?comp=${btoa(JSON.stringify(c))}`)
  }

  /* ─── Hex glyph ─── */
  const HexGlyph = ({
    pos, unit, uData, boardName,
  }: {
    pos: HexPos; unit: string | null; uData: typeof UNITS[number] | null
    boardName: 'player' | 'enemy'
  }) => {
    const isSrc  = dragItem?.board === boardName && dragItem?.idx === HEX_POSITIONS.indexOf(pos)
    const isOver = dragTarget?.board === boardName && dragTarget?.idx === HEX_POSITIONS.indexOf(pos)
    const costCol = uData ? C.cost[uData.cost] : C.accent

    const fillBase = boardName === 'enemy' ? '#160808' : C.hexEmpty
    const fillOcc  = boardName === 'enemy' ? '#200c0c' : C.hexHover
    const strokeBase = boardName === 'enemy' ? '#3a1515' : C.border

    const fill = unit ? fillOcc : fillBase
    const strokeCol = isSrc ? costCol : isOver ? C.accent : (unit ? costCol : strokeBase)
    const strokeW = isSrc || isOver ? 2 : (unit ? 1.5 : 1)

    return (
      <>
        {unit && !isSrc && (
          <polygon
            points={hexPts(pos.cx, pos.cy)}
            fill="none" stroke={costCol} strokeWidth={8} opacity={0.08}
            style={{ filter: 'blur(6px)' }}
          />
        )}
        <polygon
          points={hexPts(pos.cx, pos.cy)}
          fill={isSrc ? '#282828' : fill}
          stroke={strokeCol}
          strokeWidth={strokeW}
          style={{ transition: 'fill 0.1s, stroke 0.1s' }}
        />
        {showNames && unit && uData && (
          <>
            <title>{unit}</title>
            {(() => {
              const iconSize = R * 1.8
              const iconX = pos.cx - iconSize / 2
              const iconY = pos.cy - iconSize / 2
              return (
                <image
                  href={`/unit-icons/${unit}.webp`}
                  x={iconX}
                  y={iconY}
                  width={iconSize}
                  height={iconSize}
                  clipPath={`url(#hex-clip-${HEX_POSITIONS.indexOf(pos)})`}
                  preserveAspectRatio="xMidYMid slice"
                />
              )
            })()}
          </>
        )}
      </>
    )
  }

  /* ─── Board renderer ─── */
  const renderBoard = (boardArr: (string | null)[], isEnemy: boolean) => {
    const bgCol  = isEnemy ? '#160808' : C.hexEmpty
    const bName  = isEnemy ? 'enemy' : 'player'
    const svgRef = isEnemy ? svgERef : svgPRef

    return (
      <div style={{
        background: bgCol,
        borderRadius: 8,
        border: `1px solid ${isEnemy ? '#3a1515' : C.border}`,
        padding: PAD,
        boxSizing: 'border-box',
        boxShadow: isEnemy
          ? '0 8px 24px rgba(0,0,0,0.7), 0 2px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,80,80,0.04)'
          : '0 8px 24px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
        animation: 'hexEnter 0.4s ease-out both',
      }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VW} ${VH}`}
          style={{ width: '100%', height: 'auto', display: 'block' }}
          preserveAspectRatio="xMidYMid meet"
          onMouseMove={(e) => handleMouseMove(e, bName)}
          onMouseLeave={(e) => handleMouseLeave(e, bName)}
        >
          <defs>
            <linearGradient id={`${isEnemy ? 'e' : 'p'}-vignette`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="rgba(0,0,0,0)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0.3)" />
            </linearGradient>
            {HEX_POSITIONS.map((pos, idx) => (
              <clipPath key={idx} id={`hex-clip-${idx}`}>
                <polygon points={hexPts(pos.cx, pos.cy)} />
              </clipPath>
            ))}
          </defs>
          <rect width={VW} height={VH} fill={bgCol} rx={4} />

          {/* 3D vignette overlay — darkens bottom edge */}
          <rect width={VW} height={VH} fill={`url(#${isEnemy ? 'e' : 'p'}-vignette)`} rx={4}
            pointerEvents="none" />

          {HEX_POSITIONS.map((pos, idx) => {
            const unit  = boardArr[idx]
            const uData = unit ? UNITS.find(x => x.name === unit) ?? null : null
            const isSrc  = dragItem?.board === bName && dragItem?.idx === idx

            return (
              <g
                key={idx}
                onMouseDown={() => unit && (isSrc ? undefined : startDrag(bName, idx))}
                onDoubleClick={() => !dragItem && handleHexClick(bName, idx)}
                style={{
                  cursor: unit ? 'grab' : 'default',
                  opacity: isSrc ? 0.45 : 1,
                }}
              >
                <HexGlyph pos={pos} unit={unit} uData={uData} boardName={bName} />
                {unit === null && (
                  <polygon
                    points={hexPts(pos.cx, pos.cy)}
                    fill="transparent"
                    stroke="transparent"
                    strokeWidth={8}
                  />
                )}
              </g>
            )
          })}
        </svg>
      </div>
    )
  }

  /* ─── Stat pill ─── */
  const StatPill = ({ label, value, col }: { label: string; value: string; col: string }) => (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 5,
      background: 'transparent',
      border: `1px solid ${C.border}`,
      fontSize: 10, fontWeight: 600,
      fontFamily: 'Rajdhani, sans-serif',
    }}>
      <span style={{ color: C.muted }}>{label}</span>
      <span style={{ color: col }}>{value}</span>
    </div>
  )

  return (
    <div ref={containerRef} style={{
      width: '100%', boxSizing: 'border-box',
      fontFamily: 'Rajdhani, sans-serif',
      color: C.text, minHeight: '100%', padding: '10px 0',
      background: C.bg,
    }}>

      {/* ─── Toolbar ─── */}
      <div style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 8,
        padding: '7px 12px',
        display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
        marginBottom: 8,
      }}>
        {/* Undo / Redo / Clear */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            disabled={hi <= 0} onClick={undo}
            style={{ ...btnBase, background: 'transparent', border: `1px solid ${C.border}`, color: C.muted, padding: '4px 9px', fontSize: 10, opacity: hi <= 0 ? 0.35 : 1 }}>
            ↩
          </button>
          <button
            disabled={hi >= hist.length - 1} onClick={redo}
            style={{ ...btnBase, background: 'transparent', border: `1px solid ${C.border}`, color: C.muted, padding: '4px 9px', fontSize: 10, opacity: hi >= hist.length - 1 ? 0.35 : 1 }}>
            ↪
          </button>
          <button onClick={clear}
            style={{ ...btnBase, background: 'transparent', border: `1px solid ${C.border}`, color: C.muted, padding: '4px 9px', fontSize: 10 }}>
            Clear
          </button>
        </div>

        <div style={{ width: 1, height: 18, background: C.border }} />

        {/* Player / Enemy board toggles */}
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={() => setShowEnemy(v => !v)}
            style={{ ...btnBase, background: showEnemy ? 'transparent' : 'transparent', border: `1px solid ${showEnemy ? C.danger : C.border}`, color: showEnemy ? C.danger : C.muted, padding: '4px 12px', fontSize: 10, fontWeight: 600 }}>
            Enemy
          </button>
          <button
            onClick={() => setShowNames(v => !v)}
            style={{ ...btnBase, background: 'transparent', border: `1px solid ${showNames ? C.accent : C.border}`, color: showNames ? C.accent : C.muted, padding: '4px 12px', fontSize: 10, fontWeight: 600 }}>
            Names
          </button>
          <button
            onClick={() => setShowTraits(v => !v)}
            style={{ ...btnBase, background: 'transparent', border: `1px solid ${showTraits ? C.accent : C.border}`, color: showTraits ? C.accent : C.muted, padding: '4px 12px', fontSize: 10, fontWeight: 600 }}>
            Traits
          </button>
        </div>

        <div style={{ flex: 1 }} />

        {/* Units panel toggle */}
        <button
          onClick={() => { setShowUnits(v => !v); setUnitPanelBoard('player') }}
          style={{
            ...btnBase,
            background: showUnits ? C.accentDim : 'transparent',
            border: `1px solid ${showUnits ? C.accent : C.border}`,
            color: showUnits ? C.accent : C.muted,
            padding: '4px 14px', fontSize: 10, fontWeight: 700,
          }}>
          {showUnits ? '✕ Close' : '+ Units'}
        </button>

        <div style={{ width: 1, height: 18, background: C.border }} />

        {/* Save / Load / Share / Delete */}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <select value={sid} onChange={e => setSid(e.target.value)}
            style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, color: C.text, fontSize: 10, padding: '4px 8px', cursor: 'pointer', fontFamily: 'Rajdhani, sans-serif' }}>
            <option value="" style={{ background: '#1a1a1a' }}>Load comp…</option>
            {savedComps.map(c => (<option key={c.id} value={c.id} style={{ background: '#1a1a1a' }}>{c.name}</option>))}
          </select>
          <button disabled={!sid} onClick={loadComp}
            style={{ ...btnBase, background: 'transparent', border: `1px solid ${C.border}`, color: !sid ? C.muted : C.accent, padding: '4px 12px', fontSize: 10, fontWeight: 600, opacity: !sid ? 0.35 : 1 }}>
            Load
          </button>
          <button onClick={saveComp}
            style={{ ...btnBase, background: 'transparent', border: `1px solid ${C.border}`, color: C.muted, padding: '4px 12px', fontSize: 10, fontWeight: 600 }}>
            Save
          </button>
          <button disabled={!sid} onClick={deleteComp}
            style={{ ...btnBase, background: 'transparent', border: `1px solid ${C.border}`, color: !sid ? C.muted : C.danger, padding: '4px 12px', fontSize: 10, fontWeight: 600, opacity: !sid ? 0.35 : 1 }}>
            Delete
          </button>
          <button disabled={!sid} onClick={shareComp}
            style={{ ...btnBase, background: 'transparent', border: `1px solid ${C.border}`, color: !sid ? C.muted : C.accent, padding: '4px 12px', fontSize: 10, fontWeight: 600, opacity: !sid ? 0.35 : 1 }}>
            Share
          </button>
        </div>
      </div>

      {/* ─── Units panel ─── */}
      {showUnits && (
        <div style={{
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 8,
          marginBottom: 8,
          animation: 'hintSlide 0.2s ease-out',
        }}>
          {showEnemy && (
            <div style={{ display: 'flex', gap: 6, padding: '8px 12px 6px', borderBottom: `1px solid ${C.border}` }}>
              {(['player', 'enemy'] as const).map(b => (
                <button key={b} onClick={() => setUnitPanelBoard(b)} style={{
                  padding: '3px 12px', borderRadius: 5, fontSize: 9.5, fontWeight: 700,
                  border: `1px solid ${unitPanelBoard === b ? (b === 'enemy' ? C.danger : C.accent) : C.border}`,
                  background: unitPanelBoard === b ? (b === 'enemy' ? C.dangerDim : C.accentDim) : 'transparent',
                  color: unitPanelBoard === b ? (b === 'enemy' ? C.danger : C.accent) : C.muted,
                  cursor: 'pointer', transition: 'all 0.12s', textTransform: 'capitalize' as const,
                  fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.04em',
                }}>
                  {b === 'player' ? 'My Board' : 'Enemy Board'}
                </button>
              ))}
            </div>
          )}
          <div style={{ padding: '8px 12px 12px', display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 220, overflowY: 'auto' }}>
            {[5, 4, 3, 2, 1].map(cost => {
              const costUnits = UNITS.filter(u => u.cost === cost)
              if (costUnits.length === 0) return null
              return (
                <div key={cost}>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.cost[cost], marginBottom: 5 }}>
                    ★ Cost {cost}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {costUnits.map(u => (
                      <UnitPill key={u.id} name={u.name} traits={u.traits} cost={u.cost}
                        placed={targetBoard.includes(u.name)} onClick={() => handleUnitClick(u.name)} />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ─── Two-column main area: board + traits/stats ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 8, alignItems: 'start' }}>

        {/* Left: player board + enemy board + stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {renderBoard(pBoard, false)}

          {/* Stats row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 2px', flexWrap: 'wrap' }}>
            <StatPill label="Units" value={`${pBoardUnits}/10`}
              col={pBoardUnits === 0 ? C.muted : pBoardUnits < 5 ? C.text : C.accent} />
            <StatPill label="Cost" value={`$${pBoardCost}`}
              col={C.cost[Math.min(5, Math.max(1, Math.ceil(pBoardCost / 10)))]} />
            {dragHint && (
              <div style={{
                padding: '3px 10px', borderRadius: 5,
                background: `${C.accent}18`, border: `1px solid ${C.accent}50`,
                fontSize: 9.5, color: C.accent, fontWeight: 600,
                animation: 'hintSlide 0.15s ease-out',
                fontFamily: 'Rajdhani, sans-serif',
              }}>
                {dragHint}
              </div>
            )}
          </div>

          {/* Enemy board */}
          {showEnemy && (
            <div style={{ marginTop: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{ flex: 1, height: 1, background: `${C.danger}30` }} />
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: `${C.danger}80` }}>
                  Enemy Board
                </span>
                <div style={{ flex: 1, height: 1, background: `${C.danger}30` }} />
              </div>
              {renderBoard(eBoard, true)}
              <div style={{ display: 'flex', gap: 6, padding: '4px 2px' }}>
                <StatPill label="Units" value={`${eBoardUnits}/10`} col={C.danger} />
                <StatPill label="Cost"  value={`$${eBoardCost}`}  col={C.danger} />
              </div>
            </div>
          )}
        </div>

        {/* Right: traits + augments/components */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

          {/* Active traits */}
          {showTraits && (
            <div style={{
              background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 12px',
              animation: 'hintSlide 0.2s ease-out',
            }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.muted, marginBottom: 8 }}>
                Active Traits
              </div>
              {activeTraits.length === 0
                ? <div style={{ fontSize: 10, color: C.muted, opacity: 0.4 }}>No active traits yet</div>
                : <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {traits.map((t, i) => (
                      <div key={t.name} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '5px 10px', borderRadius: 6,
                        border: `1px solid ${t.active ? C.accent : C.border}`,
                        background: t.active ? `${C.accent}10` : 'transparent',
                        color: t.active ? C.accent : C.muted,
                        fontSize: 10, fontWeight: 600,
                        transition: 'all 0.12s',
                        animation: t.active ? `hintSlide 0.2s ease-out ${i * 40}ms both` : undefined,
                      }}>
                        <span>{t.name}</span>
                        <span style={{ opacity: 0.5 }}>{t.count}</span>
                        {t.active && t.effect && <span style={{ opacity: 0.6, fontWeight: 400, fontSize: 9 }}>{t.effect}</span>}
                        {!t.active && t.next && <span style={{ opacity: 0.3, fontWeight: 400, fontSize: 9 }}>→ {t.next.count}</span>}
                      </div>
                    ))}
                  </div>
              }
            </div>
          )}

          {/* Augments + Components */}
          {(['Augments', 'Components'] as const).map(section => {
            const items = section === 'Augments' ? augs : comps
            const setItems = section === 'Augments' ? setAugs : setComps
            return (
              <div key={section} style={{
                background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 12px',
                transition: 'border-color 0.12s',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.text, letterSpacing: '0.04em' }}>{section}</span>
                  <button onClick={() => {
                    const v = window.prompt(`${section.slice(0, -1)}:`)
                    if (v?.trim()) setItems(p => [...p, v.trim()])
                  }}
                    style={{ ...btnBase, background: 'transparent', border: `1px solid ${C.border}`, color: C.muted, padding: '3px 8px', fontSize: 9.5, fontWeight: 700 }}>
                    +
                  </button>
                </div>
                {items.length === 0
                  ? <div style={{ fontSize: 10, color: C.muted, opacity: 0.3 }}>No {section.toLowerCase()}</div>
                  : <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {items.map((item, i) => (
                        <div key={i} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '4px 8px', borderRadius: 5,
                          background: 'rgba(255,255,255,0.03)',
                          border: `1px solid ${C.border}`,
                          fontSize: 10, color: C.text,
                        }}>
                          <span>{item}</span>
                          <button onClick={() => setItems(p => p.filter((_, j) => j !== i))}
                            style={{ color: C.muted, background: 'none', border: 'none', cursor: 'pointer', fontSize: 9, padding: '1px', opacity: 0.5, transition: 'opacity 0.12s' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = C.danger; (e.currentTarget as HTMLButtonElement).style.opacity = '1' }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = C.muted; (e.currentTarget as HTMLButtonElement).style.opacity = '0.5' }}>
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                }
              </div>
            )
          })}
        </div>
      </div>

      {/* CSS keyframe animations */}
      <style>{`
        * { box-sizing: border-box; }

        @keyframes hexEnter {
          from { opacity: 0; transform: scale(0.92); }
          to   { opacity: 1; transform: scale(1); }
        }

        @keyframes hexPop {
          0%   { transform: scale(1.15); }
          100% { transform: scale(1); }
        }

        @keyframes hintSlide {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        .hex-group polygon {
          transition: fill 0.1s, stroke 0.1s;
        }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }

        button:not(:disabled):hover {
          border-color: #3a3a3a !important;
          color: #d0d0d0 !important;
        }
      `}</style>
    </div>
  )
}