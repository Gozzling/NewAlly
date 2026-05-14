import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import {
  BookOpen,
  Coins,
  LayoutGrid,
  Package,
  ScanLine,
  ShoppingCart,
  Sparkles,
} from 'lucide-react'
import { UnitPortrait } from '@/components/UnitPortrait'
import { unitPortraitPrimaryUrl } from '@/utils/unitDisplay'
import {
  buildGameStateFromBoard,
  recommendationsFromGameState,
  type AllyRecommendation,
} from '@/engine/recommendations'
import { useCoachMatchHistory } from '@/hooks/useCoachMatchHistory'
import { STATIC_META_VERSION } from '@/meta/tftCurrentSet'
import { useAppStore } from '@/store/useAppStore'
import { BUNDLED_SET_DATA } from '@/services/cdnDataService'
import { displayThresholdEffect } from '@/utils/traitThresholdDisplay'
import type { MetaComp } from '@/types/tft'
import { AllySpinner } from '@/components/AllyLoading'

/* ─── Design tokens ─── */
const C = {
  bg:         '#0d0d0d',
  surface:    '#1f1f1f',
  border:     '#1a1a1a',
  accent:     'var(--color-ally-accent)',
  accentDim:  'color-mix(in srgb, var(--color-ally-accent) 14%, transparent)',
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
function UnitPill({ name, traits, cost, placed, onClick, iconUrl }: {
  name: string; traits: string[]; cost: number; placed: boolean; onClick: () => void; iconUrl?: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        ...btnBase,
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '5px 9px',
        border: `1px solid ${placed ? C.accent : C.border}`,
        backgroundColor: placed ? `${C.accent}1a` : 'transparent',
        boxShadow: placed
          ? `0 0 10px color-mix(in srgb, ${C.accent} 45%, transparent), 0 0 22px color-mix(in srgb, ${C.accent} 22%, transparent)`
          : 'none',
        color: placed ? C.accent : C.muted,
        minWidth: 100,
        fontFamily: 'Rajdhani, sans-serif',
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.01em',
        lineHeight: 1.3,
        transition: 'all 0.12s ease',
      }}
    >
      <UnitPortrait name={name} cdnUrl={iconUrl} size={24} radius={4} />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        <span style={{ color: placed ? C.accent : C.muted, fontWeight: 700, fontSize: 10, lineHeight: 1.3 }}>{name}</span>
        <span style={{ color: C.muted, fontSize: 8, marginTop: 2, lineHeight: 1.2, opacity: 0.7 }}>{traits.slice(0, 2).join(' · ')}</span>
      </div>
    </button>
  )
}

/* ═══════════════════════════════════════════════════════════════
   TeamBuilder
═══════════════════════════════════════════════════════════════ */
export function TeamBuilder({ importComp, onNavigate }: { importComp?: MetaComp; onNavigate?: (page: string, id?: string) => void }) {
  const savedComps      = useAppStore(s => s.savedComps)
  const addSavedComp    = useAppStore(s => s.addSavedComp)
  const removeSavedComp = useAppStore(s => s.removeSavedComp)
  const showToast       = useAppStore(s => s.showToast)
  const personalMatches = useAppStore((s) => s.personalMatches)
  const selectedPlayer  = useAppStore((s) => s.selectedPlayer)
  const gameData = useAppStore(s => s.gameData)
  const roster = gameData.champions.length > 0 ? gameData.champions : BUNDLED_SET_DATA.champions
  const traitRoster = gameData.traits.length > 0 ? gameData.traits : BUNDLED_SET_DATA.traits

  const { matchHistory, isLoading: coachHistoryLoading } = useCoachMatchHistory()

  const displayGameName = useMemo(() => {
    const fromPlayer = selectedPlayer?.name?.trim()
    const fromPersonal = personalMatches.find((m) => m.summonerName)?.summonerName?.trim()
    let fromLs = ''
    try {
      fromLs = localStorage.getItem('tft-ally::summoner-name')?.trim() ?? ''
    } catch {
      /* ignore */
    }
    return fromPlayer || fromPersonal || fromLs || 'you'
  }, [selectedPlayer?.name, personalMatches])

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
  const [unitDetail, setUnitDetail] = useState<{name: string, iconUrl?: string} | null>(null)
  const [selHex, setSelHex]         = useState<string | null>(null)
  const [unitPanelBoard, setUnitPanelBoard] = useState<'player' | 'enemy'>('player')
  const [unitFindQuery, setUnitFindQuery] = useState('')

  // Double-click detection
  const lastClickRef = useRef<{ time: number; idx: number | null }>({ time: 0, idx: null })

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

  /* ─── Hex click: select for swapping or show detail on double-click ─── */
  const handleHexClick = (hexId: string) => {
    const idx = parseInt(hexId, 10)
    const unit = pBoard[idx]
    const uData = unit ? roster.find(x => x.name === unit) : null
    if (!unit) return // empty hex - do nothing (units added via + Units panel)

    const now = Date.now()
    const lastClick = lastClickRef.current

    console.log('[HEX CLICK]', { hexId, idx, unit, now, lastClick, timeDiff: now - lastClick.time })

    // Check for double-click (within 300ms and same hex)
    if (lastClick.idx !== null && now - lastClick.time < 300 && lastClick.idx === idx) {
      console.log('[DOUBLE CLICK DETECTED]', { unit })
      // Double-click detected - show unit detail
      setUnitDetail({ name: unit, iconUrl: uData?.iconUrl })
      setSelHex(null)
      lastClickRef.current = { time: 0, idx: null }
      return
    }

    // Single click - select for swapping
    if (selHex === hexId) {
      console.log('[DESELECT HEX]', { hexId })
      setSelHex(null);
      return
    }
    if (selHex) { // swap mode - do the swap
      console.log('[SWAP MODE]', { selHex, hexId })
      const selIdx = parseInt(selHex, 10)
      const tmp = pBoard[selIdx]; pBoard[selIdx] = pBoard[idx]; pBoard[idx] = tmp
      setSelHex(null)
      return
    }
    // first click on occupied hex - select for swapping
    console.log('[SELECT HEX]', { hexId })
    setSelHex(hexId)
    lastClickRef.current = { time: now, idx }
  }

  /* ─── Board computed data ─── */
  const pUnits = useMemo(() => pBoard.filter(Boolean) as string[], [pBoard])
  const eUnits = useMemo(() => eBoard.filter(Boolean) as string[], [eBoard])
  const allUnits = useMemo(() => [...pUnits, ...eUnits], [pUnits, eUnits])

  const unitMap = useMemo(() => {
    const m = new Map<string, typeof roster[number]>()
    allUnits.forEach(n => { const u = roster.find(x => x.name === n); if (u) m.set(n, u) })
    return m
  }, [allUnits, roster])

  const traits = useMemo(() => {
    const c: Record<string, number> = {}
    allUnits.forEach(n => unitMap.get(n)?.traits.forEach(t => { c[t] = (c[t] || 0) + 1 }))
    return Object.entries(c).map(([name, count]) => {
      const syn = traitRoster.find(s => s.name === name)
      const active = !!syn?.thresholds.filter(t => count >= t.count).pop()
      const next   = syn?.thresholds.find(t => count < t.count)
      return {
        name,
        count,
        active,
        next,
        traitDescription: syn?.description ?? "",
        effect: syn && count > 0 ? syn.thresholds.filter((t) => count >= t.count).pop()?.effect ?? "" : "",
      }
    }).sort((a, b) => (b.active ? 1 : 0) - (a.active ? 1 : 0))
  }, [allUnits, unitMap])

  const pBoardUnits = pUnits.length
  const pBoardCost  = pUnits.reduce((s, n) => s + (unitMap.get(n)?.cost || 0), 0)
  const eBoardUnits = eUnits.length
  const eBoardCost  = eUnits.reduce((s, n) => s + (unitMap.get(n)?.cost || 0), 0)
  const activeTraits = traits.filter(t => t.active)

  const boardSig = pBoard.map((c) => c ?? '').join('|')
  const coachRecs = useMemo(() => {
    if (coachHistoryLoading || matchHistory === null) return null
    return recommendationsFromGameState(
      buildGameStateFromBoard(pBoard, roster, [], {}), // Team Builder specific meta comps/recipes can be added here if needed
      matchHistory,
      STATIC_META_VERSION,
      Date.now(),
      { champions: roster, traits: traitRoster }
    ).slice(0, 5)
  }, [boardSig, pBoard, matchHistory, coachHistoryLoading, roster, traitRoster])

  const coachCategoryIcon = (cat: AllyRecommendation['category']) => {
    const iconProps = { className: 'shrink-0', size: 16, color: C.accent, strokeWidth: 2 }
    switch (cat) {
      case 'shop':
        return <ShoppingCart {...iconProps} />
      case 'items':
        return <Package {...iconProps} />
      case 'economy':
        return <Coins {...iconProps} />
      case 'augments':
        return <Sparkles {...iconProps} />
      case 'board':
        return <LayoutGrid {...iconProps} />
      case 'meta':
        return <BookOpen {...iconProps} />
      case 'scouting':
        return <ScanLine {...iconProps} />
      default:
        return <LayoutGrid {...iconProps} />
    }
  }

  const coachUrgencyAccent = (u: AllyRecommendation['urgency']) => {
    switch (u) {
      case 'high':
        return '#ef4444'
      case 'medium':
        return '#f0b429'
      default:
        return '#35c3e7'
    }
  }

  const coachUrgencyBadge = (u: AllyRecommendation['urgency']) => {
    const col = coachUrgencyAccent(u)
    const label = u === 'high' ? 'HIGH' : u === 'medium' ? 'MED' : 'LOW'
    return (
      <span
        style={{
          fontSize: 8,
          fontWeight: 800,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          padding: '1px 5px',
          borderRadius: 3,
          background: `${col}18`,
          color: col,
          border: `1px solid ${col}44`,
        }}
      >
        {label}
      </span>
    )
  }

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

  const sortedSavedComps = useMemo(
    () => [...savedComps].sort((a, b) => b.timestamp - a.timestamp),
    [savedComps],
  )

  const saveComp = () => {
    const units = Object.values(pBoard).filter(Boolean) as string[]
    if (units.length === 0) {
      window.alert('Place at least one unit on your board before saving.')
      return
    }
    const n = window.prompt('Name this comp (e.g. Sniper Reroll, Arbiter Flex):', 'My comp')
    if (!n?.trim()) return
    addSavedComp({ id: Date.now().toString(), name: n.trim(), units, timestamp: Date.now() })
    showToast(`Saved comp "${n.trim()}"`, 'success')
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
    if (window.confirm(`Delete "${savedComps.find(x => x.id === sid)?.name}"?`)) {
      removeSavedComp(sid)
      setSid('')
      showToast('Comp removed from saved list', 'info')
    }
  }
  const shareComp = () => {
    const units = Object.values(pBoard).filter(Boolean) as string[]
    if (!units.length) { alert('Add some units first!'); return }
    const data = btoa(JSON.stringify({ units }))
    const url = `${window.location.origin}?comp=${data}`
    try {
      navigator.clipboard.writeText(url)
      showToast('Comp link copied to clipboard', 'success')
    } catch {
      window.prompt('Copy this link:', url)
      showToast('Copy the link from the dialog', 'info')
    }
  }

  /* ─── Hex glyph ─── */
  const HexGlyph = ({
    pos, unit, uData, boardName,
  }: {
    pos: HexPos; unit: string | null; uData: typeof roster[number] | null
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
                  href={unitPortraitPrimaryUrl(unit)}
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
        position: 'relative' as const,
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
            const uData_iter = unit ? roster.find(x => x.name === unit) ?? null : null
            const isSrc  = dragItem?.board === bName && dragItem?.idx === idx

            return (
              <g
                key={idx}
                onMouseDown={() => unit && (isSrc ? undefined : startDrag(bName, idx))}
                style={{
                  cursor: unit ? 'grab' : 'default',
                  opacity: isSrc ? 0.45 : 1,
                }}
              >
                <HexGlyph pos={pos} unit={unit} uData={uData_iter} boardName={bName} />
                {/* Transparent click overlay - captures all clicks */}
                <polygon
                  points={hexPts(pos.cx, pos.cy)}
                  fill="transparent"
                  onClick={() => unit && handleHexClick(idx.toString())}
                  style={{ cursor: unit ? 'pointer' : 'default' }}
                />
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
            {sortedSavedComps.map(c => (<option key={c.id} value={c.id} style={{ background: '#1a1a1a' }}>{c.name}</option>))}
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
          <button onClick={shareComp}
            style={{ background:'transparent', border:'none', color: C.accent, fontSize:'11px', cursor:'pointer', padding:'4px 8px' }}>
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
            <input
              type="search"
              value={unitFindQuery}
              onChange={(e) => setUnitFindQuery(e.target.value)}
              placeholder="Find unit…"
              data-no-global-search-focus="true"
              className="w-full rounded-md border border-ally-border bg-ally-bg px-2.5 py-1.5 font-sans text-xs text-ally-text outline-none transition-colors duration-200 placeholder:text-ally-muted focus-visible:ring-2 focus-visible:ring-ally-accent"
            />
            {(() => {
              const q = unitFindQuery.trim().toLowerCase()
              const matchUnit = (u: (typeof roster)[number]) =>
                !q ||
                u.name.toLowerCase().includes(q) ||
                u.traits.some((t) => t.toLowerCase().includes(q)) ||
                u.id.toLowerCase().includes(q)
              return [5, 4, 3, 2, 1].map((cost) => {
                const costUnits = roster.filter((u) => u.cost === cost).filter(matchUnit)
                if (costUnits.length === 0) return null
                return (
                  <div key={cost}>
                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.cost[cost], marginBottom: 5 }}>
                      ★ Cost {cost}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {costUnits.map((u) => (
                        <UnitPill
                          key={u.id}
                          name={u.name}
                          traits={u.traits}
                          cost={u.cost}
                          placed={targetBoard.includes(u.name)}
                          onClick={() => handleUnitClick(u.name)}
                          iconUrl={u.iconUrl}
                        />
                      ))}
                    </div>
                  </div>
                )
              })
            })()}
          </div>
        </div>
      )}

      {/* ─── Two-column main area: board + traits/stats ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 8, alignItems: 'start' }}>

        {/* Left: player board + enemy board + stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ position: 'relative' }}>
            {renderBoard(pBoard, false)}
            {!pBoard.some(Boolean) && (
              <div
                className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg"
                style={{
                  margin: 1,
                  background: 'color-mix(in srgb, var(--color-ally-bg) 65%, transparent)',
                  border: `1px dashed ${C.border}`,
                }}
              >
                <p className="text-center font-display text-ally-muted px-6 text-xs leading-relaxed max-w-[220px]">
                  Empty board — use <span className="text-ally-accent font-semibold">+ Units</span> or drag from the list to build a comp. Save multiple named boards from the toolbar (up to 32).
                </p>
              </div>
            )}
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 2px', flexWrap: 'wrap' }}>
            <StatPill label="Units" value={`${pBoardUnits}/10`}
              col={pBoardUnits === 0 ? C.muted : pBoardUnits < 5 ? C.text : C.accent} />
            <StatPill label="Cost" value={`$${pBoardCost}`}
              col={C.cost[Math.min(5, Math.max(1, Math.ceil(pBoardCost / 10)))]} />
            {dragHint && (
              <div style={{
                padding: '3px 10px', borderRadius: 5,
                background: C.accentDim, border: `1px solid color-mix(in srgb, ${C.accent} 35%, transparent)`,
                fontSize: 9.5, color: C.accent, fontWeight: 600,
                animation: 'hintSlide 0.15s ease-out',
                fontFamily: 'Rajdhani, sans-serif',
              }}>
                {dragHint}
              </div>
            )}
          </div>

          {/* Coach recommendations (static meta + board; no live shop in builder) */}
          <div style={{ marginTop: 4 }}>
            {matchHistory != null && matchHistory.recentPlacements.length > 0 && (
              <div
                style={{
                  fontSize: '9px',
                  color: C.accent,
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Sparkles size={10} color="var(--color-ally-accent)" />
                Personalized for {displayGameName} ({matchHistory.recentPlacements.length} games)
              </div>
            )}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginBottom: 10,
              }}
            >
              <Sparkles size={12} color="var(--color-ally-accent)" strokeWidth={2} className="shrink-0" />
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: '#a8a8b8',
                }}
              >
                Suggestions
              </span>
            </div>
            {pBoardUnits === 0 ? (
              <div
                style={{
                  color: '#333',
                  fontSize: '11px',
                  textAlign: 'center',
                  padding: '16px 0',
                }}
              >
                Add units to get coaching suggestions
              </div>
            ) : coachHistoryLoading || matchHistory === null ? (
              <div className="flex items-center justify-center gap-2 py-3 font-sans text-xs text-ally-muted">
                <AllySpinner />
                Loading personalized tips…
              </div>
            ) : coachRecs !== null && coachRecs.length === 0 ? (
              <div style={{ fontSize: 11, color: '#333', textAlign: 'center', padding: '12px 0' }}>
                No suggestions right now.
              </div>
            ) : coachRecs !== null ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {coachRecs.map((rec, ri) => {
                  const uCol = coachUrgencyAccent(rec.urgency)
                  return (
                    <div key={rec.id}>
                      <div
                        style={{
                          display: 'flex',
                          background: '#0a0a16',
                          border: '1px solid #1a1a2e',
                          borderRadius: 8,
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: 3,
                            flexShrink: 0,
                            background: uCol,
                          }}
                        />
                        <div style={{ flex: 1, minWidth: 0, padding: '10px 12px' }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              flexWrap: 'wrap',
                            }}
                          >
                            {coachCategoryIcon(rec.category)}
                            <span
                              style={{
                                fontSize: 12,
                                fontWeight: 700,
                                color: '#ffffff',
                                flex: 1,
                                minWidth: 0,
                              }}
                            >
                              {rec.title}
                            </span>
                            {coachUrgencyBadge(rec.urgency)}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: '#a3a3a3',
                              marginTop: 4,
                              lineHeight: 1.4,
                            }}
                          >
                            {rec.detail}
                          </div>
                          <div
                            style={{
                              marginTop: 6,
                              height: 2,
                              borderRadius: 1,
                              background: '#1a1a2e',
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                height: '100%',
                                width: `${Math.round(rec.confidence * 100)}%`,
                                background: uCol,
                                borderRadius: 1,
                                transition: 'width 0.2s ease',
                              }}
                            />
                          </div>
                          {rec.reasoning.length > 0 && (
                            <div
                              style={{
                                fontSize: 10,
                                color: '#333',
                                marginTop: 4,
                                lineHeight: 1.45,
                                fontStyle: 'italic',
                              }}
                            >
                              {rec.reasoning.join(' · ')}
                            </div>
                          )}
                        </div>
                      </div>
                      {ri < coachRecs.length - 1 ? (
                        <div
                          style={{
                            height: 1,
                            background: 'rgba(26, 26, 46, 0.65)',
                            margin: '8px 0',
                          }}
                        />
                      ) : null}
                    </div>
                  )
                })}
              </div>
            ) : null}
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
                        {t.active && t.effect && (
                          <span style={{ opacity: 0.6, fontWeight: 400, fontSize: 9 }}>
                            {displayThresholdEffect(t.traitDescription, t.effect)}
                          </span>
                        )}
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

      {unitDetail && (
        <div className="ally-dropdown-surface" style={{
          position:'absolute', top:'50px', left:'50%',
          transform:'translateX(-50%)',
          background:'#0f0f1e', border:'1px solid color-mix(in srgb, var(--color-ally-accent) 25%, transparent)',
          borderRadius:'10px', padding:'12px 16px', zIndex:100,
          display:'flex', alignItems:'center', gap:'12px',
          minWidth:'220px', boxShadow:'0 4px 24px #00000080'
        }}>
          <UnitPortrait name={unitDetail.name} cdnUrl={unitDetail.iconUrl} size={44} radius={8} />
          <div style={{flex:1}}>
            <div style={{color:'white',fontWeight:600,fontSize:'13px'}}>{unitDetail.name}</div>
            <div style={{color:'#444',fontSize:'10px',marginTop:'2px'}}>Double-click to view · Single-click to swap</div>
          </div>
          <button onClick={() => { onNavigate?.('units', unitDetail.name); setUnitDetail(null) }}
            style={{background:'#35c3e715',border:'1px solid #35c3e740',color:'#35c3e7',fontSize:'11px',padding:'5px 12px',borderRadius:'6px',cursor:'pointer'}}>
            View →
          </button>
          <button onClick={() => setUnitDetail(null)}
            style={{background:'transparent',border:'none',color:'#444',cursor:'pointer',fontSize:'16px',lineHeight:1}}>
            ✕
          </button>
        </div>
      )}
    </div>
  )
}