import { useEffect, useRef, useState, useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { subscribeToStateSnapshots } from '@/services/ipcService';
import { TeamBuilder } from '@/pages/TeamBuilder';
import { CompCard } from '@/components/CompCard';
import { MatchHistory } from '@/pages/MatchHistory';
import { UnitGuide } from '@/pages/UnitGuide';
import { SynergyGuide } from '@/pages/SynergyGuide';
import { ItemsGuide } from '@/pages/ItemsGuide';
import { AugmentGuide } from '@/pages/AugmentGuide';
import { Settings } from '@/pages/Settings';
import { ThemeProvider } from '@/components/ThemeProvider';

import { META_COMPS } from '@/data/metaComps';



function getCurrentWindowId(): Promise<string> {
  return new Promise((resolve) => {
    overwolf.windows.getCurrentWindow((r: any) => {
      if (r.status === 'success') resolve(r.window.id);
    });
  });
}

// TFT data for typing animation
const CHAMPIONS = [
  'Aatrox',
  'Briar',
  'Caitlyn',
  'ChoGath',
  'Ezreal',
  'Leona',
  'Lissandra',
  'Nasus',
  'Poppy',
  'RekSai',
  'Talon',
  'Teemo',
  'Twisted Fate',
  'Veigar',
  'Akali',
  'Belveth',
  'Gnar',
  'Gragas',
  'Gwen',
  'Jax',
  'Jinx',
  'Meepsie',
  'Milio',
  'Mordekaiser',
  'Pantheon',
  'Pyke',
  'Zoe',
  'Aurora',
  'Diana',
  'Fizz',
  'Illaoi',
  'Kaisa',
  'Lulu',
  'Maokai',
  'Miss Fortune',
  'Ornn',
  'Rhaast',
  'Samira',
  'Urgot',
  'Viktor',
  'Aurelion Sol',
  'Corki',
  'Karma',
  'Kindred',
  'Leblanc',
  'Master Yi',
  'Nami',
  'Nunu',
  'Rammus',
  'Riven',
  'Tahm Kench',
  'The Mighty Mech',
  'Xayah',
  'Bard',
  'Blitzcrank',
  'Fiora',
  'Graves',
  'Jhin',
  'Morgana',
  'Shen',
  'Sona',
  'Vex',
  'Zed',
];

const ITEMS = [
  'Adaptive Helm',
  'Archangel Staff',
  'Bloodthirster',
  'Blue Buff',
  'Bramble Vest',
  'Crownguard',
  'Deathblade',
  'Dragon Claw',
  'Edge of Night',
  'Evenshroud',
  'Gargoyle Stoneplate',
  'Giant Slayer',
  'Guinsoo Rageblade',
  'Hand Of Justice',
  'Hextech Gunblade',
  'Infinity Edge',
  'Ionic Spark',
  'Jeweled Gauntlet',
  'Kraken Fury',
  'Last Whisper',
  'Morellonomicon',
  'Nashor Tooth',
  'Protector Vow',
  'Quicksilver',
  'Rabadon Deathcap',
  'Red Buff',
  'Spear of Shojin',
  'Spirit Visage',
  'Steadfast Heart',
  'Sterak Gage',
  'Striker Flail',
  'Sunfire Cape',
  'Thief Gloves',
  'Titan Resolve',
  'Void Staff',
  'Warmog Armor',
  'Anima Emblem',
  'Arbiter Emblem',
  'Bastion Emblem',
  'Brawler Emblem',
  'Challenger Emblem',
  'Dark Star Emblem',
  'Marauder Emblem',
  'Meeple Emblem',
  'N.O.V.A. Emblem',
  'Primordian Emblem',
  'Psionic Emblem',
  'Rogue Emblem',
  'Shepherd Emblem',
  'Sniper Emblem',
  'Space Groove Emblem',
  'Stargazer Emblem',
  'Timebreaker Emblem',
  'Vanguard Emblem',
  'Voyager Emblem',
];

const PLAYERS = [
  'Fuktigt Rostbröd#Hiii',
  'Double61#EUW',
  'K3Soju#KR',
  'Prestivent#NA',
  'Setsuko#EUW',
  'Kurumx#NA',
  'Dishsoap#EUW',
  'RiotMax#RIOT',
  'RiotMort#RIOT',
  'RiotPhroxzon#RIOT',
  'RiotMatt#RIOT',
  'RiotAugust#RIOT',
  'RiotRoaming#RIOT',
  'RiotSapMagic#RIOT',
  'RiotMeddler#RIOT',
];

const TRAITS = [
  'Anima',
  'Arbiter',
  'Dark Star',
  'Mecha',
  'Meeple',
  'N.O.V.A.',
  'Primordian',
  'Psionic',
  'Space Groove',
  'Stargazer',
  'Timebreaker',
  'Shepherd',
  'Bastion',
  'Brawler',
  'Channeler',
  'Challenger',
  'Commander',
  'Divine Duelist',
  'Eradicator',
  'Fateweaver',
  'Marauder',
  'Party Animal',
  'Replicator',
  'Rogue',
  'Sniper',
  'Vanguard',
  'Voyager',
];

const AUGMENTS = [
  'Accretion',
  'Ardent Censer',
  'Backfoot',
  'Battlemage',
  'Blue Battery',
  'Cull',
  'Cybernetic Implants',
  'Daring',
  'Deathblade',
  'Electrocharge',
  'Economizer',
  'Feint',
  'First Aid Kit',
  'Gotta Go Fast',
  'Greed',
  'Heart of Steel',
  'Hextech Gunblade',
  'High Voltage',
  'Illuminated',
  'Last Stand',
  'Lethality',
  'Lightning Greaves',
  'Lucky Looter',
  'Luden Echo',
  'Meditation',
  'Metabolic Accelerator',
  'Multistrike',
  'Mystic',
  'Never Give Up',
  'Pantheon',
  'Phoenix',
  'Plunder',
  'Power Surge',
  'Precious Cargo',
  'Prismatic Heart',
  'Promoted',
  'Protector',
  'Quickdraw',
  'Rapid Fire',
  'Reconnaissance',
  'Reinforced',
  'Resurrection',
  'Ricochet',
  'Second Wind',
  'Shapeshifter',
  'Siphon',
  'Spectral',
  'Stoneskin Plate',
  'Sunfire',
  'Tactical',
  'Thieves Tools',
  'Titan Wrath',
  'Tri Force',
  'Underdog',
  'Verdant Veil',
  'Warlords Banner',
  'Wise Sage',
  'Wishful Thinking',
];

const NAV_TABS = [
  {
    id: 'in-game',
    label: 'In Game',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <line x1="6" y1="12" x2="10" y2="12" />
        <line x1="8" y1="10" x2="8" y2="14" />
        <line x1="15" y1="13" x2="15.01" y2="13" />
        <line x1="18" y1="11" x2="18.01" y2="11" />
        <rect x="2" y="6" width="20" height="12" rx="2" />
      </svg>
    ),
  },
  {
    id: 'comps',
    label: 'Comps',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    id: 'items',
    label: 'Items',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M14.5 17.5L3 6V3h3l11.5 11.5" />
        <path d="M13 19l6-6" />
        <path d="M16 16l4 4" />
        <path d="M19 21l2-2" />
      </svg>
    ),
  },
  {
    id: 'units',
    label: 'Units',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    id: 'traits',
    label: 'Traits',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
  {
    id: 'augments',
    label: 'Augments',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
  },
  {
    id: 'team-builder',
    label: 'Team Builder',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <line x1="3" y1="9" x2="21" y2="9" />
        <line x1="9" y1="21" x2="9" y2="9" />
      </svg>
    ),
  },
  {
    id: 'match-history',
    label: 'Match History',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
];

/* ─── Quick Tips Component ─── */
function QuickTips() {
  const [currentTip, setCurrentTip] = useState(0)
  const [fadeState, setFadeState] = useState<'in' | 'out'>('in')

  const TIPS = [
    "Position your units to maximize trait synergies",
    "Reroll at level 5 for 1-2 cost carries, level 7 for 3 costs",
    "Save gold early to hit interest thresholds (10/20/30/40/50)",
    "Losing streaks give bonus gold — don't panic sell",
    "Position your tank in front of your backline carry",
    "Check opponent boards each round to predict their comp",
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setFadeState('out')
      setTimeout(() => {
        setCurrentTip((prev) => (prev + 1) % TIPS.length)
        setFadeState('in')
      }, 300)
    }, 8000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div
      style={{
        opacity: fadeState === 'in' ? 1 : 0,
        transition: 'opacity 0.3s ease',
        fontSize: '10px',
        color: '#888',
        lineHeight: 1.4,
        minHeight: '42px',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {TIPS[currentTip]}
    </div>
  )
}

/* ─── In Game Page ─── */
function InGamePage() {
  const MOCK_PLAYERS = [
    { name: 'Gozling', tagline: 'Goz', rank: 'Platinum II', lp: 93, recentPlacements: [2,4,1], avgPlace: 3.8, predictedComp: 'N.O.V.A. Sniper', profileIconId: 4568 },
    { name: 'DoubleUp61', tagline: 'DU', rank: 'Diamond I', lp: 45, recentPlacements: [1,3,2], avgPlace: 2.1, predictedComp: 'Arcanist Academy', profileIconId: 3456 },
    { name: 'TFTMaster', tagline: 'TFT', rank: 'Master IV', lp: 12, recentPlacements: [1,1,2], avgPlace: 1.3, predictedComp: 'Fated Academy', profileIconId: 2345 },
    { name: 'SynergyKing', tagline: 'SK', rank: 'Emerald I', lp: 78, recentPlacements: [3,2,4], avgPlace: 3.2, predictedComp: 'Storyweaver', profileIconId: 5678 },
    { name: 'CompBuilder', tagline: 'CB', rank: 'Platinum I', lp: 56, recentPlacements: [4,3,2], avgPlace: 3.5, predictedComp: 'Behemoth', profileIconId: 6789 },
    { name: 'RankChaser', tagline: 'RC', rank: 'Diamond III', lp: 34, recentPlacements: [2,1,3], avgPlace: 2.4, predictedComp: 'Umbral', profileIconId: 7890 },
    { name: 'MetaSlave', tagline: 'MS', rank: 'Emerald II', lp: 67, recentPlacements: [3,4,2], avgPlace: 3.1, predictedComp: 'Inkshadow', profileIconId: 8901 },
    { name: 'LuckySeven', tagline: 'LS', rank: 'Platinum III', lp: 89, recentPlacements: [4,2,3], avgPlace: 3.6, predictedComp: 'Mythic', profileIconId: 9012 },
  ]

  const [searchName, setSearchName] = useState('')
  const [region, setRegion] = useState('na1')
  const [loading, setLoading] = useState(false)
  const [gameFound, setGameFound] = useState(true)
  const [showingDemo, setShowingDemo] = useState(true)
  const [players] = useState(MOCK_PLAYERS)

  const handleSearch = () => {
    setLoading(true)
    setShowingDemo(false)
    setTimeout(() => {
      setLoading(false)
      setGameFound(true)
    }, 1500)
  }

  const getPlacementColor = (place: number) => {
    if (place === 1) return '#fbbf24'
    if (place <= 4) return '#4ade80'
    return '#ef4444'
  }

  const displayPlayers = showingDemo ? MOCK_PLAYERS : players

  return (
    <div style={{ padding: '16px' }}>
      {/* Demo Banner */}
      {showingDemo && (
        <div style={{
          background: '#1a1a0a',
          border: '1px solid #f0b42930',
          borderRadius: '6px',
          padding: '8px 12px',
          fontSize: '11px',
          color: '#f0b429',
          marginBottom: '12px',
        }}>
          ⚡ Live game detection requires the Overwolf desktop app. Showing demo data.
        </div>
      )}

      {/* Search Bar */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <input
          type="text"
          placeholder="Enter summoner name to view live game"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          style={{
            flex: 1,
            background: '#1a1a1a',
            border: '1px solid #2a2a2a',
            borderRadius: '6px',
            padding: '8px 12px',
            fontSize: '13px',
            color: 'white',
            outline: 'none',
          }}
        />
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          style={{
            background: '#1a1a1a',
            border: '1px solid #2a2a2a',
            borderRadius: '6px',
            padding: '8px 12px',
            fontSize: '13px',
            color: 'white',
            outline: 'none',
          }}
        >
          <option value="na1">NA</option>
          <option value="euw1">EUW</option>
          <option value="kr">KR</option>
          <option value="jp1">JP</option>
        </select>
        <button
          onClick={handleSearch}
          style={{
            background: '#35c3e7',
            border: 'none',
            borderRadius: '6px',
            padding: '8px 16px',
            fontSize: '13px',
            color: 'white',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Search
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              style={{
                height: '120px',
                borderRadius: '10px',
                background: 'linear-gradient(90deg, #111827 25%, #1f2937 50%, #111827 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s infinite',
              }}
            />
          ))}
        </div>
      ) : gameFound ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          {displayPlayers.map((player, i) => (
            <div
              key={i}
              style={{
                background: '#0f0f1c',
                border: '1px solid #1a1a2e',
                borderRadius: '10px',
                padding: '12px',
                transition: 'all 0.15s ease',
                cursor: 'pointer',
                display: 'flex',
                gap: '12px',
                alignItems: 'center',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#35c3e730'
                e.currentTarget.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#1a1a2e'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: '#1a1a1a',
                  border: '2px solid #2a2a2a',
                  overflow: 'hidden',
                  flexShrink: 0,
                }}
              >
                <img
                  src={`https://ddragon.leagueoflegends.com/cdn/14.1.1/img/profileicon/${player.profileIconId}.png`}
                  alt={player.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => { e.currentTarget.style.display = 'none' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'white', marginBottom: '2px' }}>
                  {player.name}
                </div>
                <div style={{ fontSize: '11px', color: '#555', marginBottom: '6px' }}>{player.rank} · {player.lp} LP</div>
                <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
                  {player.recentPlacements.map((place, j) => (
                    <div
                      key={j}
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '4px',
                        background: getPlacementColor(place),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: 'white',
                      }}
                    >
                      {place}
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#555' }}>
                    Avg: <span style={{ color: 'white', fontWeight: 600 }}>{player.avgPlace.toFixed(1)}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#35c3e7', fontWeight: 600 }}>
                    {player.predictedComp}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '200px',
          color: '#555',
          fontSize: '14px',
        }}>
          No live game found for this summoner
        </div>
      )}

      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  )
}

export function DesktopApp() {
  const state = useAppStore((s: any) => s.gameState);
  const accentColor = useAppStore((s: any) => s.settings.accentColor) ?? '#35c3e7';
  const lastRawRef = useRef<string>('');
  const [activePage, setActivePage] = useState<string>('in-game');
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [typingText, setTypingText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentTerm, setCurrentTerm] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Unit Guide filters
  const [unitQuery, setUnitQuery] = useState('');
  const [unitCostFilter, setUnitCostFilter] = useState<number | 'all'>('all');
  const [unitTierFilter, setUnitTierFilter] = useState('all');

  // Synergy Guide filters
  const [synergyQuery, setSynergyQuery] = useState('');
  const [synergyTypeFilter, setSynergyTypeFilter] = useState('all');

  // Items Guide filters
  const [itemQuery, setItemQuery] = useState('');
  const [itemTagFilter, setItemTagFilter] = useState('all');
  const [itemTierFilter, setItemTierFilter] = useState('all');

  // Augment Guide filters
  const [augmentQuery, setAugmentQuery] = useState('');
  const [augmentTierFilter, setAugmentTierFilter] = useState('all');
  const [augmentTagFilter, setAugmentTagFilter] = useState('all');
  const sortedMetaComps = useMemo(() => {
    return META_COMPS.map((comp, index) => {
      const tier = index < 2 ? 'S' : index < 6 ? 'A' : index < 8 ? 'B' : index < 9 ? 'C' : 'D';
      return { comp, tier };
    });
  }, []);

  // Random category selection
  const getRandomCategory = () => {
    const categories = [CHAMPIONS, ITEMS, PLAYERS, TRAITS, AUGMENTS];
    return categories[Math.floor(Math.random() * categories.length)];
  };

  const getRandomTerm = (category: string[]) => {
    return category[Math.floor(Math.random() * category.length)];
  };

  // Initialize first random term
  useEffect(() => {
    const randomCategory = getRandomCategory();
    setCurrentTerm(getRandomTerm(randomCategory));
  }, []);

  // Typing animation effect
  useEffect(() => {
    if (isPaused) return;

    const typingSpeed = isDeleting ? 80 : 120;
    const pauseAfterTyping = 2000;
    const pauseBeforeTyping = 1000;

    const timeout = setTimeout(() => {
      if (!isDeleting) {
        // Typing
        if (typingText.length < currentTerm.length) {
          setTypingText(currentTerm.slice(0, typingText.length + 1));
        } else {
          // Finished typing, add ... then pause then start deleting
          setTypingText(currentTerm + '...');
          setTimeout(() => setIsDeleting(true), pauseAfterTyping);
        }
      } else {
        // Deleting
        if (typingText.length > 0) {
          setTypingText(typingText.slice(0, -1));
        } else {
          // Finished deleting, pause before next term
          setIsDeleting(false);
          const randomCategory = getRandomCategory();
          setCurrentTerm(getRandomTerm(randomCategory));
          setIsPaused(true);
          setTimeout(() => setIsPaused(false), pauseBeforeTyping);
        }
      }
    }, typingSpeed);

    return () => clearTimeout(timeout);
  }, [typingText, isDeleting, currentTerm, isPaused]);

  useEffect(() => {
    return subscribeToStateSnapshots();
  }, []);

  async function handleMinimize() {
    overwolf.windows.minimize(await getCurrentWindowId(), () => {});
  }
  async function handleClose() {
    overwolf.windows.close(await getCurrentWindowId(), () => {});
  }

  async function handleMaximize() {
    overwolf.windows.maximize(await getCurrentWindowId(), () => {});
  }

  const rawJson = state
    ? JSON.stringify(state.raw, null, 2)
    : 'Waiting for data...';
  if (rawJson !== lastRawRef.current) lastRawRef.current = rawJson;

  return (
    <ThemeProvider>
      <style>{`
        html { scroll-behavior: smooth; }

        .custom-scrollbar {
          direction: ltr;
          scrollbar-gutter: stable;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #0e0e0e;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #2a2a2a;
          border-radius: 4px;
          border: 1px solid #1a1a1a;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #35c3e7;
        }
        .filter-sidebar-enter {
          animation: slideInLeft 250ms cubic-bezier(0.25, 1, 0.5, 1);
        }
        .smooth-scroll { scroll-behavior: smooth; }
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div className="w-full h-full flex flex-col bg-[#0d0d0d] text-white font-sans smooth-scroll" style={{ '--color-ally-accent': accentColor } as React.CSSProperties}>
      {/* Top Bar */}
      <div
        className="h-12 bg-[#1f1f1f] flex items-center px-4 flex-shrink-0 relative"
        style={{ WebkitAppRegion: 'drag', boxShadow: 'inset 0 -1px 2px rgba(0,0,0,0.3)' } as Record<string, string>}
      >
        {/* Left: ALLY Logo */}
        <div className="absolute" style={{ left: '19px', WebkitAppRegion: 'no-drag' } as Record<string, string>}>
          <svg viewBox="0 0 70 70" fill="none" className="h-5 w-auto">
            <path d="M35 0L67 62.5H49.5L37 30L17 62.5H2" stroke="#35c3e7" strokeWidth="8" strokeLinejoin="round" strokeLinecap="round" />
            <line x1="12" y1="43.75" x2="49.5" y2="43.75" stroke="#35c3e7" strokeWidth="7" />
          </svg>
        </div>

        {/* Center: Search Bar */}
        <div className="flex-1 flex justify-center" style={{ WebkitAppRegion: 'no-drag' } as Record<string, string>}>
          <input
            type="text"
            placeholder="Search..."
            className="bg-[#1a1a1a] border-none rounded-lg px-3 py-1.5 text-[13px] text-white placeholder:text-[#555] outline-none w-64 transition-colors focus-visible:ring-2 focus-visible:ring-[#35c3e7]" style={{ boxShadow: 'inset 1px 1px 2px rgba(0,0,0,0.5), inset -1px -1px 2px rgba(255,255,255,0.05)' }}
          />
        </div>

        {/* Right: Icons + Window Controls */}
        <div className="ml-auto flex items-center gap-1" style={{ WebkitAppRegion: 'no-drag' } as Record<string, string>}>
          {/* Discord */}
          <button className="w-8 h-8 rounded-lg flex items-center justify-center text-white hover:bg-[#1a1a1a] hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-[#35c3e7] transition-all duration-200">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.878.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.927 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.878.076.076 0 0 0-.04.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.069-2.157-2.38 0-1.312.956-2.38 2.157-2.38 1.21 0 2.176 1.068 2.157 2.38 0 1.312-.956 2.38-2.157 2.38zm7.975 0c-1.183 0-2.157-1.069-2.157-2.38 0-1.312.955-2.38 2.157-2.38 1.21 0 2.176 1.068 2.157 2.38 0 1.312-.946 2.38-2.157 2.38z"/>
            </svg>
          </button>

          {/* Notifications */}
          <button className="w-8 h-8 rounded-lg flex items-center justify-center text-white hover:bg-[#1a1a1a] hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-[#35c3e7] transition-all duration-200">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
          </button>

          {/* Settings */}
          <div className="relative">
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
className="w-8 h-8 rounded-lg flex items-center justify-center text-white hover:bg-[#1a1a1a] hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-[#35c3e7] transition-all duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>

            {/* Settings Dropdown */}
            {settingsOpen && (
              <div className="absolute right-0 top-10 w-56 bg-[#1a1a1a] rounded-lg p-4 z-50" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.5), inset 1px 1px 2px rgba(255,255,255,0.03), inset -1px -1px 2px rgba(0,0,0,0.3)' }}>
                <div className="text-white text-sm">Settings</div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="w-px h-5 bg-[#1a1a1a] mx-1" />

          {/* Window Controls */}
          <button onClick={handleMinimize} className="w-8 h-8 rounded-lg flex items-center justify-center text-white hover:bg-[#1a1a1a] hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-[#35c3e7] transition-all duration-200">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
          <button onClick={handleMaximize} className="w-8 h-8 rounded-lg flex items-center justify-center text-white hover:bg-[#1a1a1a] hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-[#35c3e7] transition-all duration-200">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            </svg>
          </button>
          <button onClick={handleClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-white hover:bg-red-500/20 hover:text-red-400 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Icon Sidebar */}
        <div className="w-14 bg-[#1f1f1f] flex flex-col items-center py-3 gap-1 flex-shrink-0" style={{ boxShadow: 'inset -1px 0 2px rgba(0,0,0,0.3)' }}>
          {NAV_TABS.map((tab) => (
            <div key={tab.id} className="relative group">
              <button
                onClick={() => {
                  setActivePage(tab.id)
                  setSelectedUnitId(null)
                }}
                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 ease-out focus-visible:ring-2 focus-visible:ring-[#35c3e7] hover:shadow-lg ${
                  activePage === tab.id
                    ? 'bg-[#1a1a1a] text-[#35c3e7]'
                    : 'text-[#555] hover:bg-[#1a1a1a] hover:text-white hover:scale-105'
                }`}
              >
                {tab.icon}
              </button>
              <div className="absolute left-12 top-1/2 -translate-y-1/2 bg-[#1a1a1a] text-white text-[12px] px-4 py-2 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50" style={{ boxShadow: 'inset 1px 1px 2px rgba(255,255,255,0.05), inset -1px -1px 2px rgba(0,0,0,0.4)' }}>
                {tab.label}
              </div>
            </div>
          ))}
          <div className="flex-1" />
          {/* Settings */}
          <div className="relative group">
            <button
              onClick={() => setActivePage('settings')}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 ease-out focus-visible:ring-2 focus-visible:ring-[#35c3e7] hover:shadow-lg ${
                activePage === 'settings'
                  ? 'bg-[#1a1a1a] text-[#35c3e7]'
                  : 'text-[#555] hover:bg-[#1a1a1a] hover:text-white hover:scale-105'
              }`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06-.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </button>
            <div className="absolute left-12 top-1/2 -translate-y-1/2 bg-[#1a1a1a] text-white text-[12px] px-4 py-2 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50" style={{ boxShadow: 'inset 1px 1px 2px rgba(255,255,255,0.05), inset -1px -1px 2px rgba(0,0,0,0.4)' }}>
              Settings
            </div>
          </div>
          {/* Profile */}
          <div className="relative group">
            <button className="w-10 h-10 rounded-lg flex items-center justify-center text-[#555] hover:bg-[#1a1a1a] hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </button>
            <div className="absolute left-12 top-1/2 -translate-y-1/2 bg-[#1a1a1a] text-white text-[12px] px-4 py-2 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50" style={{ boxShadow: 'inset 1px 1px 2px rgba(255,255,255,0.05), inset -1px -1px 2px rgba(0,0,0,0.4)' }}>
              Profile
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div key={activePage} className={`flex-1 overflow-y-auto min-h-0 h-full bg-[#0d0d0d] custom-scrollbar ${
          ['units','traits','items','augments','team-builder','match-history'].includes(activePage)
            ? ''
            : 'px-8 py-6'
        }`} style={{animation:'fadeIn 0.15s ease'}}>
          {activePage === 'in-game' ? (
            <InGamePage />
          ) : activePage === 'comps' ? (
            <div className="flex flex-col gap-2">
              <div className="text-[11px] uppercase tracking-widest text-white mb-4">Meta Comps</div>
              <div className="grid grid-cols-1 gap-3">
                {sortedMetaComps.map(({ comp, tier }) => (
                  <CompCard
                    key={comp.compName}
                    comp={{
                      ...comp,
                      tier,
                      winRate: Math.round(50 + Math.random() * 20),
                      top4Rate: Math.round(40 + Math.random() * 20),
                      pickRate: Math.round(5 + Math.random() * 15),
                      avgPlace: Math.round(1 + Math.random() * 9),
                    }}
                  />
                ))}
              </div>
            </div>
          ) : activePage === 'items' ? (
            <ItemsGuide
              query={itemQuery}
              setQuery={setItemQuery}
              tagFilter={itemTagFilter}
              setTagFilter={setItemTagFilter}
              tierFilter={itemTierFilter}
              setTierFilter={setItemTierFilter}
              onItemSelect={(itemName) => console.log('Selected item:', itemName)}
            />
          ) : activePage === 'team-builder' ? (
            <TeamBuilder onNavigate={(page, id) => {
              setActivePage(page)
              if (page === 'units' && id) setSelectedUnitId(id)
            }} />
          ) : activePage === 'match-history' ? (
            <MatchHistory />
          ) : activePage === 'units' ? (
            <UnitGuide
              query={unitQuery}
              setQuery={setUnitQuery}
              costFilter={unitCostFilter}
              setCostFilter={setUnitCostFilter}
              tierFilter={unitTierFilter}
              setTierFilter={setUnitTierFilter}
              onUnitSelect={(unitId) => console.log('Selected unit:', unitId)}
              initialUnit={selectedUnitId}
            />
          ) : activePage === 'traits' ? (
            <SynergyGuide
              query={synergyQuery}
              setQuery={setSynergyQuery}
              typeFilter={synergyTypeFilter}
              setTypeFilter={setSynergyTypeFilter}
              onSynergySelect={(synergyId) => console.log('Selected synergy:', synergyId)}
            />
          ) : activePage === 'augments' ? (
            <AugmentGuide
              query={augmentQuery}
              setQuery={setAugmentQuery}
              tierFilter={augmentTierFilter}
              setTierFilter={setAugmentTierFilter}
              tagFilter={augmentTagFilter}
              setTagFilter={setAugmentTagFilter}
              onAugmentSelect={(augmentId) => console.log('Selected augment:', augmentId)}
            />
          ) : activePage === 'settings' ? (
            <Settings />
          ) : (
            <div className="flex items-center justify-center h-full">
              <span className="text-white text-sm capitalize">{activePage.replace('-', ' ')}</span>
            </div>
          )}
        </div>

        {/* Right Sidebar (fixed) - always visible */}
        <div className="w-45 bg-[#0d0d0d] flex-shrink-0 px-3 py-3 flex flex-col gap-4 items-center overflow-y-auto" style={{ boxShadow: 'inset 1px 0 2px rgba(0,0,0,0.3)', borderLeft: '1px solid #1a1a1a', width: '180px' }}>
          {/* Player Card Section */}
          <div style={{ width: '100%' }}>
            <div style={{ fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#a1a1a1', marginBottom: '8px' }}>
              Player
            </div>
            <div style={{
              background: '#1f1f1f',
              border: '1px solid #1a1a1a',
              borderRadius: '8px',
              padding: '10px',
            }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#35c3e7', marginBottom: '4px' }}>
                {state.gameName || 'Unknown'}
              </div>
              <div style={{ fontSize: '10px', color: '#a1a1a1', marginBottom: '8px' }}>
                {state.region?.toUpperCase() || 'NA'}
              </div>
              <div style={{ display: 'flex', gap: '2px', marginBottom: '8px' }}>
                {[1,2,3,4,5,6,7,8,1,2].map((place, i) => (
                  <div
                    key={i}
                    style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '3px',
                      background: place === 1 ? '#fbbf24' : place <= 4 ? '#4ade80' : '#ef4444',
                      border: place === 1 ? '2px solid #fbbf24' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '9px',
                      fontWeight: 700,
                      color: 'white',
                    }}
                  >
                    {place}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '9px', color: '#a1a1a1' }}>Avg</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'white' }}>3.2</div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div style={{ width: '100%', height: '1px', background: '#1a1a1a' }} />

          {/* Live Game Status */}
          <div style={{ width: '100%' }}>
            <div style={{ fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#a1a1a1', marginBottom: '8px' }}>
              Status
            </div>
            <div style={{
              background: '#1f1f1f',
              border: '1px solid #1a1a1a',
              borderRadius: '8px',
              padding: '12px',
              textAlign: 'center',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '4px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4ade80', animation: 'pulse 2s infinite' }} />
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#4ade80' }}>LIVE</span>
              </div>
              <div style={{ fontSize: '10px', color: '#a1a1a1' }}>Round 3-2</div>
            </div>
          </div>

          {/* Divider */}
          <div style={{ width: '100%', height: '1px', background: '#1a1a1a' }} />

          {/* Quick Tips Section */}
          <div style={{ width: '100%' }}>
            <div style={{ fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#a1a1a1', marginBottom: '8px' }}>
              Tips
            </div>
            <QuickTips />
          </div>
        </div>
      </div>
      </div>
    </ThemeProvider>
  );
}