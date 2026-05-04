import { useEffect, useRef, useState, useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { subscribeToStateSnapshots } from '@/services/ipcService';
import { TeamBuilder } from '@/pages/TeamBuilder';
import { CompCard } from '@/components/CompCard';
import { Units } from '@/pages/Units';
import { MatchHistory } from '@/pages/MatchHistory';

import { META_COMPS } from '@/data/metaComps';



function getCurrentWindowId(): Promise<string> {
  return new Promise((resolve) => {
    overwolf.windows.getCurrentWindow((r: any) => {
      if (r.status === 'success') resolve(r.window.id);
    });
  });
}

// Skeleton loader for Items tab
function ItemsSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 bg-ally-hover rounded-full animate-pulse" />
        <h1 className="text-xl font-bold text-white animate-pulse">Items Guide</h1>
      </div>
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 bg-ally-hover rounded-full animate-pulse" />
          <input
            type="text"
            placeholder="Search item or component..."
            className="w-full bg-ally-bg border border-ally-border rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-ally-muted focus:outline-none focus:ring-2 focus:ring-ally-accent"
            readOnly
          />
        </div>
        <select
          className="bg-ally-bg border border-ally-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-ally-accent"
        >
          <option value="offense">Offense</option>
          <option value="defense">Defense</option>
          <option value="AP">Ability Power</option>
          <option value="tank">Tank</option>
          <option value="sustain">Sustain</option>
          <option value="mana">Mana</option>
          <option value="hybrid">Hybrid</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4 py-4">
        {/* Item card skeletons */}
        {[1, 2, 3, 4, 5, 6, 7, 8].map((_, index) => (
          <div key={index} className="bg-ally-card border border-ally-border rounded-xl hover:shadow-lg transition-shadow duration-300" style={{ padding: '16px' }}>
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 bg-ally-hover rounded-full animate-pulse" />
              <div className="flex-1 space-y-1">
                <div className="h-2 w-full bg-ally-hover rounded animate-pulse" />
                <div className="h-1.5 w-3/4 bg-ally-hover rounded animate-pulse" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2].map((_, tagIndex) => (
                <span key={tagIndex} className="flex items-center gap-2 px-2 py-0.5 bg-ally-hover rounded text-[9px] text-neutral-400 animate-pulse">
                  <div className="w-3 h-3 bg-ally-bg rounded" />
                  <span className="w-4 h-1 bg-ally-hover rounded animate-pulse" />
                </span>
              ))}
              <div className="col-span-3">
                <div className="h-2 w-full bg-ally-hover rounded animate-pulse" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="h-1.5 w-full bg-ally-hover rounded animate-pulse" />
              <div className="h-2 w-full bg-ally-hover rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
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

export function DesktopApp() {
  const state = useAppStore((s: any) => s.gameState);
  const lastRawRef = useRef<string>('');
  const [activePage, setActivePage] = useState<string>('in-game');
  const [typingText, setTypingText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentTerm, setCurrentTerm] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
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

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, [isDarkMode]);

  const rawJson = state
    ? JSON.stringify(state.raw, null, 2)
    : 'Waiting for data...';
  if (rawJson !== lastRawRef.current) lastRawRef.current = rawJson;

  return (
    <>
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
        @keyframes slideInLeft {
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
      `}</style>
      <div className="w-full h-full flex flex-col bg-[#0e0e0e] text-white font-sans smooth-scroll">
      {/* Top Bar */}
      <div
        className="h-12 bg-[#111111] flex items-center px-4 flex-shrink-0 relative"
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
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-white font-medium text-sm">Dark Mode</span>
                    <span className="text-[#666] text-xs mt-0.5">Toggle theme appearance</span>
                  </div>
                  <button
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className="w-12 h-6 rounded-full relative transition-colors"
                    style={{ backgroundColor: isDarkMode ? '#35c3e7' : '#2a2a2a' }}
                  >
                    <div
                      className="absolute w-5 h-5 bg-white rounded-full top-0.5 transition-all duration-300 ease-out shadow-sm"
                      style={{ transform: isDarkMode ? 'translateX(26px)' : 'translateX(2px)' }}
                    />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="w-px h-5 bg-[#2a2a2a] mx-1" />

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
        <div className="w-14 bg-[#111111] flex flex-col items-center py-3 gap-1 flex-shrink-0" style={{ boxShadow: 'inset -1px 0 2px rgba(0,0,0,0.3)' }}>
          {NAV_TABS.map((tab) => (
            <div key={tab.id} className="relative group">
              <button
                onClick={() => setActivePage(tab.id)}
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

        {/* Secondary Sidebar (conditional) */}
        {(activePage === 'comps' || activePage === 'items' || activePage === 'units' || activePage === 'traits' || activePage === 'augments') && (
          <div className="w-52 bg-[#111111] flex-shrink-0 p-4 flex flex-col gap-3 filter-sidebar-enter" style={{ boxShadow: 'inset -1px 0 2px rgba(0,0,0,0.3)' }}>
            <div className="text-[11px] uppercase tracking-widest text-[#444] mb-1">Filters</div>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-8 rounded-lg bg-[#1a1a1a] animate-pulse" style={{ boxShadow: 'inset 1px 1px 2px rgba(0,0,0,0.4), inset -1px -1px 2px rgba(255,255,255,0.03)' }} />
            ))}
          </div>
        )}

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto min-h-0 h-full bg-[#0e0e0e] px-8 py-6 custom-scrollbar">
          {activePage === 'in-game' ? (
            <div className="grid grid-cols-1 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (

                <div
                  key={i}
                  className="bg-[#1a1a1a] rounded-xl flex flex-col items-start gap-2 min-h-[200px]" style={{ boxShadow: 'inset 1px 1px 2px rgba(0,0,0,0.4), inset -1px -1px 2px rgba(255,255,255,0.03)', padding: '16px' }}
                >
                  <div className="w-16 h-16 rounded-full bg-[#222] flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-white text-sm font-semibold mb-0.5">Player {i + 1}</div>
                    <div className="text-[#555] text-xs">Rank {i + 1}</div>
                  </div>
                </div>

              ))}
            </div>
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
            <ItemsSkeleton />
          ) : activePage === 'team-builder' ? (
            <TeamBuilder />
          ) : activePage === 'match-history' ? (
            <MatchHistory />
          ) : activePage === 'units' ? (
            <Units />
          ) : (
            <div className="flex items-center justify-center h-full">
              <span className="text-white text-sm capitalize">{activePage.replace('-', ' ')}</span>
            </div>
          )}
        </div>

        {/* Right Sidebar (fixed) */}
        <div className="w-80 bg-[#111111] flex-shrink-0 px-6 py-4 flex flex-col gap-4 items-center overflow-y-auto" style={{ boxShadow: 'inset 1px 0 2px rgba(0,0,0,0.3)' }}>
          {/* Ad Space */}
          <div className="bg-[#1a1a1a] rounded-xl flex items-center justify-center" style={{ width: '260px', height: '96px', padding: '16px' }}>
            <span className="text-[#555] text-xs uppercase tracking-widest">Advertisement</span>
          </div>

          {/* Tip Box */}
          <div className="bg-[#1a1a1a] rounded-xl flex flex-col" style={{ width: '260px', padding: '16px' }}>
            <div className="text-[11px] uppercase tracking-widest text-[#35c3e7] mb-2">Tip</div>
            <div className="text-white text-sm leading-relaxed">
              Position your units in a way that maximizes trait synergies for optimal performance.
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-[#1a1a1a] rounded-xl flex flex-col" style={{ width: '260px', padding: '16px' }}>
            <div className="text-[11px] uppercase tracking-widest text-[#35c3e7] mb-2">Info</div>
            <div className="text-white text-sm leading-relaxed">
              Check the meta comps page for the latest team compositions that are performing well in the current patch.
            </div>
          </div>

          {/* Stats Box */}
          <div className="bg-[#1a1a1a] rounded-xl flex flex-col" style={{ width: '260px', padding: '16px' }}>
            <div className="text-[11px] uppercase tracking-widest text-[#35c3e7] mb-2">Stats</div>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#555]">Win Rate</span>
                <span className="text-white font-semibold">52%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#555]">Pick Rate</span>
                <span className="text-white font-semibold">18%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#555]">Top 4 Rate</span>
                <span className="text-white font-semibold">65%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}