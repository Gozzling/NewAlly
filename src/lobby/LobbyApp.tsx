import { useState, useEffect } from 'react'
import type { LobbyPlayer } from '../types/riot'
import { getLobbyPlayers } from '../services/lcuClient'
import { fetchPlayerCard } from '../services/riotApiClient'
import { User, RefreshCw, WifiOff } from 'lucide-react'

interface EnrichedPlayer extends LobbyPlayer {
  tier?: string
  rank?: string
  lp?: number
  level?: number
  loading?: boolean
  error?: string
}

export function LobbyApp() {
  const [players, setPlayers] = useState<EnrichedPlayer[]>([])
  const [lcuError, setLcuError] = useState(false)

  async function loadLobby() {
    setLcuError(false)

    const lobby = await getLobbyPlayers()
    if (lobby.length === 0) {
      setLcuError(true)
      // Mock data for demo / dev
      setPlayers([
        { summonerName: 'PlayerOne', summonerId: '1', tier: 'Gold', rank: 'II', lp: 87, level: 42 },
        { summonerName: 'TFTMaster', summonerId: '2', tier: 'Platinum', rank: 'IV', lp: 23, level: 55 },
        { summonerName: 'SettMain', summonerId: '3', tier: 'Silver', rank: 'I', lp: 76, level: 38 },
        { summonerName: 'HyperRoll', summonerId: '4', tier: 'Diamond', rank: 'III', lp: 12, level: 67 },
        { summonerName: 'YuumiOTP', summonerId: '5', tier: 'Gold', rank: 'III', lp: 45, level: 41 },
        { summonerName: 'Voidling', summonerId: '6', tier: 'Platinum', rank: 'II', lp: 54, level: 50 },
        { summonerName: 'BrawlerBoy', summonerId: '7', tier: 'Silver', rank: 'II', lp: 33, level: 29 },
        { summonerName: 'AssassinAmy', summonerId: '8', tier: 'Gold', rank: 'I', lp: 92, level: 47 },
      ])
      return
    }

    // Enrich with Riot API data (async)
    const enriched: EnrichedPlayer[] = lobby.map((p) => ({ ...p, loading: true }))
    setPlayers(enriched)

    // Fetch ranks in parallel with limited concurrency
    const region = localStorage.getItem('tft-ally::region') ?? 'euw1'
    for (let i = 0; i < enriched.length; i++) {
      const p = enriched[i]
      try {
        const card = await fetchPlayerCard(p.summonerName, region as any)
        setPlayers((prev) =>
          prev.map((pl) =>
            pl.summonerId === p.summonerId
              ? {
                  ...pl,
                  tier: card.tier ?? undefined,
                  rank: card.rank ?? undefined,
                  lp: card.lp ?? undefined,
                  level: card.level,
                  loading: false,
                }
              : pl,
          ),
        )
      } catch {
        setPlayers((prev) =>
          prev.map((pl) => (pl.summonerId === p.summonerId ? { ...pl, loading: false, error: 'Failed' } : pl)),
        )
      }
    }
  }

  useEffect(() => {
    void loadLobby()
  }, [])

  const tierColors: Record<string, string> = {
    IRON: 'text-neutral-500',
    BRONZE: 'text-amber-700',
    SILVER: 'text-slate-400',
    GOLD: 'text-yellow-500',
    PLATINUM: 'text-cyan-400',
    DIAMOND: 'text-blue-400',
    MASTER: 'text-purple-400',
    GRANDMASTER: 'text-red-400',
    CHALLENGER: 'text-yellow-300',
  }

  return (
    <div className="w-full h-full bg-[#0d0d0d] text-white font-sans flex flex-col">
      {/* Header */}
      <div className="h-10 flex items-center justify-between px-3 border-b border-[#2a2a2a] bg-[#111111]">
        <span className="text-xs font-bold tracking-wide text-[#35c3e7]">TFT Lobby</span>
        <button
          onClick={() => void loadLobby()}
          className="text-[#a1a1a1] hover:text-white transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Player list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {lcuError && (
          <div className="flex items-center gap-2 text-[11px] text-yellow-500 bg-yellow-950/20 border border-yellow-900/30 rounded-lg px-3 py-2 mb-2">
            <WifiOff className="w-3.5 h-3.5" />
            LCU not available. Showing mock data.
          </div>
        )}

        {players.map((p) => (
          <div
            key={p.summonerId}
            className="flex items-center gap-3 bg-ally-card border border-[#2a2a2a] rounded-lg px-3 py-2.5"
          >
            <div className="w-8 h-8 bg-[#181818] rounded-full flex items-center justify-center border border-[#2a2a2a] shrink-0">
              <User className="w-4 h-4 text-[#a1a1a1]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-white truncate">{p.summonerName}</div>
              {p.loading ? (
                <div className="text-[10px] text-[#a1a1a1]">Loading...</div>
              ) : p.tier ? (
                <div className={`text-[11px] font-medium ${tierColors[p.tier.toUpperCase()] ?? 'text-[#a1a1a1]'}`}>
                  {p.tier} {p.rank}
                  {p.lp !== undefined && ` · ${p.lp} LP`}
                  {p.level !== undefined && ` · Lv.${p.level}`}
                </div>
              ) : p.error ? (
                <div className="text-[10px] text-red-400">{p.error}</div>
              ) : (
                <div className="text-[10px] text-[#a1a1a1]">No ranked data</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
