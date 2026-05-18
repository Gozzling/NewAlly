import { useState } from 'react'
import { PATCHES, CURRENT_PATCH } from '../data/patches'
import { FileText, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp, Sparkles, AlertTriangle, Swords } from 'lucide-react'

const TYPE_ICON: Record<string, React.ReactNode> = {
  unit: <Swords className="w-3 h-3" />,
  trait: <Sparkles className="w-3 h-3" />,
  augment: <AlertTriangle className="w-3 h-3" />,
  item: <FileText className="w-3 h-3" />,
}

const TYPE_COLORS: Record<string, string> = {
  unit: 'text-red-400 bg-red-500/10',
  trait: 'text-purple-400 bg-purple-500/10',
  augment: 'text-yellow-400 bg-yellow-500/10',
  item: 'text-blue-400 bg-blue-500/10',
}

export function PatchNotes() {
  const [expanded, setExpanded] = useState<string | null>(CURRENT_PATCH.version)

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center gap-2"><FileText className="w-5 h-5 text-[#35c3e7]" /><h1 className="text-lg font-bold text-white">Patch Notes</h1></div>
      <div className="text-xs text-neutral-400">Current patch: <span className="text-[#35c3e7] font-semibold">{CURRENT_PATCH.version}</span> &middot; {CURRENT_PATCH.date}</div>

      {PATCHES.map((patch) => {
        const isOpen = expanded === patch.version
        return (
          <div key={patch.version} className="bg-ally-card border border-[#2a2a2a] rounded-xl overflow-hidden">
            <button onClick={() => setExpanded(isOpen ? null : patch.version)} className="w-full flex items-center gap-3 p-4 text-left hover:bg-[#252525] transition-colors">
              <div className="bg-[#35c3e7]/10 w-12 h-12 rounded-lg flex items-center justify-center text-[#35c3e7] font-bold text-sm">{patch.version}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white">Patch {patch.version}</div>
                <div className="text-[11px] text-neutral-400">{patch.date}</div>
              </div>
              {isOpen ? <ChevronUp className="w-4 h-4 text-neutral-500 shrink-0" /> : <ChevronDown className="w-4 h-4 text-neutral-500 shrink-0" />}
            </button>
            {isOpen && (
              <div className="px-4 pb-4 pt-0 border-t border-[#2a2a2a] space-y-3">
                <div className="mt-3">
                  <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1.5">Highlights</div>
                  <ul className="space-y-1">
                    {patch.highlights.map((h, i) => <li key={i} className="text-xs text-neutral-300 flex items-start gap-2"><Sparkles className="w-3 h-3 text-[#35c3e7] shrink-0 mt-0.5" />{h}</li>)}
                  </ul>
                </div>
                {patch.buffs.length > 0 && (
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-green-500 mb-1.5 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Buffs</div>
                    <div className="space-y-1">
                      {patch.buffs.map((b, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium flex items-center gap-1 ${TYPE_COLORS[b.type]}`}>{TYPE_ICON[b.type]}{b.target}</span>
                          <span className="text-neutral-300">{b.change}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {patch.nerfs.length > 0 && (
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-red-400 mb-1.5 flex items-center gap-1"><TrendingDown className="w-3 h-3" /> Nerfs</div>
                    <div className="space-y-1">
                      {patch.nerfs.map((n, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium flex items-center gap-1 ${TYPE_COLORS[n.type]}`}>{TYPE_ICON[n.type]}{n.target}</span>
                          <span className="text-neutral-300">{n.change}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {patch.newMechanics.length > 0 && (
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-[#35c3e7] mb-1.5">New Mechanics</div>
                    <ul className="space-y-1">
                      {patch.newMechanics.map((m, i) => <li key={i} className="text-xs text-neutral-300 flex items-start gap-2"><AlertTriangle className="w-3 h-3 text-yellow-400 shrink-0 mt-0.5" />{m}</li>)}
                    </ul>
                  </div>
                )}
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1.5">Comp Viability</div>
                  <div className="space-y-1">
                    {patch.compViability.map((c, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        {c.direction === 'up' ? <TrendingUp className="w-3 h-3 text-green-400" /> : c.direction === 'down' ? <TrendingDown className="w-3 h-3 text-red-400" /> : <Minus className="w-3 h-3 text-neutral-400" />}
                        <span className="text-white font-medium">{c.comp}</span>
                        <span className="text-neutral-400">— {c.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
