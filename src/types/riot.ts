export type RiotRegion = 'br1' | 'eun1' | 'euw1' | 'jp1' | 'kr' | 'la1' | 'la2' | 'na1' | 'oc1' | 'tr1' | 'ru' | 'ph2' | 'sg2' | 'th2' | 'tw2' | 'vn2'

export type MatchRegion = 'americas' | 'europe' | 'asia' | 'sea'

export interface Summoner {
  id: string
  accountId: string
  puuid: string
  name: string
  profileIconId: number
  revisionDate: number
  summonerLevel: number
}

export interface LeagueEntry {
  leagueId: string
  summonerId: string
  summonerName: string
  queueType: string
  tier: string
  rank: string
  leaguePoints: number
  wins: number
  losses: number
  hotStreak: boolean
  veteran: boolean
  freshBlood: boolean
  inactive: boolean
}

export interface TftParticipant {
  placement: number
  level: number
  last_round: number
  time_eliminated: number
  companion: {
    content_ID: string
    skin_ID: number
    species: string
  }
  traits: Array<{
    name: string
    num_units: number
    style: number
    tier_current: number
    tier_total: number
  }>
  units: Array<{
    character_id: string
    itemNames: string[]
    name: string
    rarity: number
    tier: number
  }>
  augments: string[]
  puuid: string
}

export interface TftMatchInfo {
  game_datetime: number
  game_length: number
  game_version: string
  participants: TftParticipant[]
  queue_id: number
  tft_game_type: string
  tft_set_number: number
  tft_set_core_name: string
}

export interface MatchDetail {
  metadata: {
    data_version: string
    match_id: string
    participants: string[]
  }
  info: TftMatchInfo
}

export interface Match {
  matchId: string
  placement: number
  level: number
  date: Date
  gameLength: number
  gameType: string
  units: string[]
  augments: string[]
  traits: string[]
  comp: string | null
  // Optional: Real LP gain/loss from ranked games
  // Not currently populated by Riot API — would require live event tracking
  lpChange?: number
}

export interface PlayerCard {
  name: string
  puuid: string
  level: number
  profileIconId: number
  rank: string | null
  tier: string | null
  lp: number | null
}

export interface PlayerStats {
  totalMatches: number
  top4Count: number
  top4Rate: number
  avgPlacement: number
  winCount: number
  winRate: number
  avgLevel: number
  mostPlayedComps: Array<{ comp: string; count: number; top4Rate: number }>
  winRateByComp: Record<string, number>
  mostPickedAugments: Array<{ augment: string; count: number }>
  placements: number[]
}

export interface LobbyPlayer {
  summonerName: string
  summonerId: string
  rank?: string
  tier?: string
  lp?: number
  level?: number
}
