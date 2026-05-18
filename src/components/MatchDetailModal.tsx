import type { Match } from '../types/riot'
import { resolveAugmentDisplayName } from '@/lib/augmentResolver'
import { X, Clock, Trophy, Swords, Shield, Zap, Users } from 'lucide-react'

interface MatchDetailModalProps {
  match: Match
  onClose: () => void
}

export function MatchDetailModal({ match, onClose }: MatchDetailModalProps) {
  const isWin = match.placement === 1
  const isTop4 = match.placement <= 4

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-[#2a2a2a]">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${isWin ? 'bg-yellow-500/20 text-yellow-400' : isTop4 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              {match.placement === 1 ? <Trophy className="w-5 h-5" /> : `#${match.placement}`}
            </div>
            <div>
              <div className="text-sm font-semibold text-white">
                {match.comp ?? 'Mixed Composition'}
              </div>
              <div className="text-[11px] text-[#a1a1a1]">
                {match.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-1.5 hover:bg-[#252525] rounded-lg text-[#a1a1a1] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg p-3 text-center">
              <Users className="w-4 h-4 text-[#35c3e7] mx-auto mb-1" />
              <div className="text-lg font-bold text-white font-numbers">{match.level}</div>
              <div className="text-caption text-ally-muted uppercase tracking-wider font-display font-bold">Level</div>
            </div>
            <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg p-3 text-center">
              <Swords className="w-4 h-4 text-[#35c3e7] mx-auto mb-1" />
              <div className="text-lg font-bold text-white font-numbers">{match.units.length}</div>
              <div className="text-caption text-ally-muted uppercase tracking-wider font-display font-bold">Units</div>
            </div>
            <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg p-3 text-center">
              <Clock className="w-4 h-4 text-[#35c3e7] mx-auto mb-1" />
              <div className="text-lg font-bold text-white font-numbers">{Math.round(match.gameLength / 60)}m</div>
              <div className="text-caption text-ally-muted uppercase tracking-wider font-display font-bold">Duration</div>
            </div>
          </div>

          {/* Units */}
          <div>
            <div className="text-caption text-ally-muted uppercase tracking-wider font-display font-bold mb-2 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" /> Units
            </div>
            <div className="flex flex-wrap gap-1.5">
              {match.units.map((u) => (
                <span key={u} className="px-2 py-1 bg-[#1f1f1f] border border-[#2a2a2a] rounded-md text-xs text-neutral-300">
                  {u}
                </span>
              ))}
            </div>
          </div>

          {/* Traits */}
          {match.traits.length > 0 && (
            <div>
              <div className="text-caption text-ally-muted uppercase tracking-wider font-display font-bold mb-2">Active Traits</div>
              <div className="flex flex-wrap gap-1.5">
                {match.traits.map((t) => (
                  <span key={t} className="px-2 py-1 bg-[#35c3e7]/10 border border-[#35c3e7]/20 rounded-md text-xs text-[#35c3e7]">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Augments */}
          <div>
            <div className="text-caption text-ally-muted uppercase tracking-wider font-display font-bold mb-2 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" /> Augments
            </div>
            <div className="flex flex-wrap gap-1.5">
              {match.augments.map((a) => (
                <span key={a} className="px-2 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-md text-xs text-yellow-400">
                  {resolveAugmentDisplayName(a)}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
