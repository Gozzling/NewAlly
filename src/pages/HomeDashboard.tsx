import { useMemo } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { StatCard } from '@/components/StatCard'
import { CompCard } from '@/components/CompCard'
import { META_COMPS } from '@/data/metaComps'
import { Activity, Trophy, Zap, ChevronRight, Play } from 'lucide-react'

export function HomeDashboard({ onNavigate }: { onNavigate: (page: string) => void }) {
  const state = useAppStore((s: any) => s.gameState)
  const personalMatches = useAppStore((s) => s.personalMatches)

  const stats = useMemo(() => {
    if (personalMatches.length === 0) return { avgPlace: 'N/A', top4: '0%', winRate: '0%' }
    const places = personalMatches.map(m => m.placement).filter((p): p is number => typeof p === 'number')
    if (places.length === 0) return { avgPlace: 'N/A', top4: '0%', winRate: '0%' }
    const avg = places.reduce((a, b) => a + b, 0) / places.length
    const top4 = (places.filter(p => p <= 4).length / places.length) * 100
    const wins = (places.filter(p => p === 1).length / places.length) * 100
    return {
      avgPlace: avg.toFixed(1),
      top4: `${Math.round(top4)}%`,
      winRate: `${Math.round(wins)}%`
    }
  }, [personalMatches])

  const topComps = useMemo(() => {
    return META_COMPS.slice(0, 3).map(c => ({ ...c, tier: 'S' as const }))
  }, [])

  const isInGame = state?.isInGame

  return (
    <div className="space-y-8 animate-ally-page-in">
      {/* Hero / Live Match Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-heading font-display uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-5 h-5 text-ally-accent" />
            Live Status
          </h2>
          {isInGame && (
            <span className="flex items-center gap-1.5 text-caption text-ally-success font-bold font-display uppercase tracking-widest animate-pulse">
              <span className="w-2 h-2 rounded-full bg-ally-success" />
              In Match
            </span>
          )}
        </div>

        <div
          onClick={() => onNavigate('in-game')}
          className={`relative overflow-hidden rounded-xl border-2 transition-all cursor-pointer group ${
            isInGame
              ? 'bg-ally-accent/5 border-ally-accent shadow-accent'
              : 'bg-ally-card border-ally-border hover:border-ally-accent/50'
          }`}
        >
          <div className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-display font-display font-bold uppercase tracking-tight">
                {isInGame ? 'Active Engagement' : 'Tactical Standby'}
              </h3>
              <p className="text-body text-ally-muted max-w-md">
                {isInGame
                  ? `Currently deploying tactics in ${state.stage || 'Live'} stage. Click to view full scouting data and unit tracking.`
                  : 'No active match detected. Launch Teamfight Tactics to begin real-time tactical analysis.'}
              </p>
            </div>
            <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
              isInGame ? 'bg-ally-accent text-ally-bg scale-110' : 'bg-ally-bg border border-ally-border text-ally-muted group-hover:text-ally-accent'
            }`}>
              {isInGame ? <Activity className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
            </div>
          </div>
          {isInGame && (
            <div className="h-1 bg-ally-accent absolute bottom-0 left-0 animate-shimmer" style={{ width: '100%', backgroundSize: '200% 100%' }} />
          )}
        </div>
      </section>

      {/* Stats Grid */}
      <section>
        <h2 className="text-heading font-display uppercase tracking-wider flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-ally-accent" />
          Performance Summary
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard label="Avg Placement" value={stats.avgPlace} subtext="Last 20 matches" />
          <StatCard label="Top 4 Rate" value={stats.top4} valueClass="text-ally-success" subtext="Consistent climbing" />
          <StatCard label="Win Rate" value={stats.winRate} valueClass="text-yellow-400" subtext="Victory dominance" />
        </div>
      </section>

      {/* Top Comps */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-heading font-display uppercase tracking-wider flex items-center gap-2">
            <Zap className="w-5 h-5 text-ally-accent" />
            Meta High EV Comps
          </h2>
          <button
            onClick={() => onNavigate('comps')}
            className="flex items-center gap-1 text-caption font-bold text-ally-accent hover:text-ally-text transition-colors uppercase font-display tracking-widest"
          >
            View All <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-3">
          {topComps.map(comp => (
            <CompCard key={comp.compName} comp={comp} />
          ))}
        </div>
      </section>
    </div>
  )
}
