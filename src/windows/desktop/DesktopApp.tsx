import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { subscribeToStateSnapshots } from '@/services/ipcService';
import { TeamBuilder } from '@/pages/TeamBuilder';
import { PlayerSearch } from '@/pages/PlayerSearch';
import { META_COMPS } from '@/data/metaComps';
import type { MetaComp } from '@/types/tft';

function getCurrentWindowId(): Promise<string> {
  return new Promise((resolve) => {
    overwolf.windows.getCurrentWindow((r: any) => {
      if (r.status === 'success') resolve(r.window.id);
    });
  });
}

function SidebarBox({ children }: { children?: React.ReactNode }) {
  return (
    <div className="bg-ally-card rounded-xl w-[240px] aspect-square flex items-center justify-center overflow-hidden relative sidebar-box">
      {children}
    </div>
  );
}

function StatCard({
  label,
  value,
  valueClass = 'text-white',
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3.5">
      <div className="text-[10px] uppercase tracking-widest text-neutral-600 mb-1.5">
        {label}
      </div>
      <div className={`text-2xl font-bold ${valueClass}`}>{value}</div>
    </div>
  );
}

// Skeleton loader for Items tab
function ItemsSkeleton() {
  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 bg-ally-hover rounded-full animate-pulse" />
        <h1 className="text-lg font-bold text-white animate-pulse">Items Guide</h1>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
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
          readOnly
        >
          <option value="all">All Tags</option>
          <option value="offense">Offense</option>
          <option value="defense">Defense</option>
          <option value="AP">Ability Power</option>
          <option value="tank">Tank</option>
          <option value="sustain">Sustain</option>
          <option value="mana">Mana</option>
          <option value="hybrid">Hybrid</option>
        </select>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Item card skeletons */}
        {[1, 2, 3, 4, 5, 6, 7, 8].map((_, index) => (
          <div key={index} className="bg-ally-card border border-ally-border rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-24 h-4 bg-ally-hover rounded animate-pulse" />
              <span className="w-12 h-3 bg-ally-hover rounded animate-pulse" />
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[1, 2, 3].map((_, tagIndex) => (
                <span key={tagIndex} className="flex items-center gap-1 px-1.5 py-0.5 bg-ally-hover rounded text-[10px] text-neutral-400 animate-pulse">
                  <div className="w-3 h-3 bg-ally-bg rounded" />
                  <span className="w-4 h-1 bg-ally-hover rounded animate-pulse" />
                </span>
              ))}
            </div>
            <div className="w-20 h-2 bg-ally-hover rounded animate-pulse" />
            <div className="w-24 h-2 bg-ally-hover rounded animate-pulse" />
            <div className="text-[11px] text-neutral-500">
              <span className="w-20 h-2 bg-ally-hover rounded animate-pulse inline-block" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CompCard({ comp, tier = 'A' }: { comp: MetaComp; tier?: string }) {
  const getTierColor = (tier: string) => {
    switch (tier.toUpperCase()) {
      case 'S': return 'bg-red-500';
      case 'A': return 'bg-orange-500';
      case 'B': return 'bg-yellow-500';
      case 'C': return 'bg-green-500';
      case 'D': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="bg-ally-card rounded-lg p-4 border border-ally-border hover:border-ally-accent transition-colors">
      <div className="flex gap-4">
        {/* Tier indicator */}
        <div className={`w-12 h-12 rounded-lg flex-shrink-0 ${getTierColor(tier)} flex items-center justify-center text-white font-bold text-xl`}>
          {tier}
        </div>
        
        {/* Comp info */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          <div className="flex items-center justify-between">
            <div className="text-white text-lg font-semibold">
              {comp.compName}
            </div>
            <div className="text-ally-muted text-xs">
              {comp.requiredUnits.length} units
            </div>
          </div>
          
          {/* Units horizontal row */}
          <div className="flex gap-2 flex-wrap">
            {comp.requiredUnits.map((unit) => (
              <div key={unit} className="bg-ally-hover rounded-lg p-2 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-ally-bg flex-shrink-0" />
                <div className="text-xs text-ally-text">{unit}</div>
              </div>
            ))}
          </div>
          
          {/* Carries section */}
          <div className="border-t border-ally-border pt-3">
            <div className="text-[10px] uppercase tracking-widest text-ally-muted mb-2">
              Carries
            </div>
            {comp.carries.map((carry) => (
              <div key={carry.name} className="flex items-center gap-3 mb-2 last:mb-0">
                <div className="w-8 h-8 rounded-full bg-ally-hover flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-sm text-white">{carry.name}</div>
                  <div className="flex gap-1 mt-1">
                    {carry.bisItems.map((item) => (
                      <div key={item} className="w-4 h-4 rounded bg-ally-bg" title={item} />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Stats */}
          <div className="flex gap-6 text-sm">
            <div className="text-ally-muted">
              <span className="text-white font-semibold">52%</span> win rate
            </div>
            <div className="text-ally-muted">
              <span className="text-white font-semibold">18%</span> pick rate
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const TABS = [
  'In Game',
  'Comps',
  'Items',
  'Units',
  'Traits',
  'Augments',
  'Team Builder',
  'Match History',
];

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

export function DesktopApp() {
  const state = useAppStore((s: any) => s.gameState);
  const lastRawRef = useRef<string>('');
  const [activePage, setActivePage] = useState<string>('In Game');
  const [searchTerm, setSearchTerm] = useState('');
  const [typingText, setTypingText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentTerm, setCurrentTerm] = useState('');
  const [isPaused, setIsPaused] = useState(false);

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
    <div className="w-full h-full flex flex-col bg-ally-bg text-white font-sans">
      <style>{`
@keyframes breathe {
  0%,100% { transform: scale(1); opacity: 0.05; }
  50% { transform: scale(1.005); opacity: 1; }
}
.sidebar-box {
  animation: breathe 5s infinite;
}
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
.sidebar-box::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0) 100%);
  background-size: 200% 100%;
  animation: shimmer 3s infinite;
}
`}</style>
      {/* Bar 1 — Titlebar */}
      <div
        className="w-full h-8 flex-shrink-0 bg-ally-card flex items-center justify-center relative"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <div
          className="absolute left-0 flex items-center px-4"
          style={
            {
              WebkitAppRegion: 'no-drag',
              marginLeft: '20px',
            } as React.CSSProperties
          }
        >
          <svg viewBox="0 0 220 66" fill="none" className="h-4 w-auto">
            <path
              d="M35.75 0L67 62.5H49.5L37 30L17 62.5H2"
              stroke="#35c3e7"
              strokeWidth="8"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            <line
              x1="12"
              y1="43.75"
              x2="49.5"
              y2="43.75"
              stroke="#35c3e7"
              strokeWidth="7"
            />
            <path
              d="M82 4L82 62.5L112 62.5"
              stroke="white"
              strokeWidth="7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <line
              x1="76"
              y1="36"
              x2="95"
              y2="28"
              stroke="#35c3e7"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <path
              d="M128 4L128 62.5L158 62.5"
              stroke="white"
              strokeWidth="7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <line
              x1="122"
              y1="36"
              x2="141"
              y2="28"
              stroke="#35c3e7"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <path
              d="M172 4L194 33L216 4"
              stroke="white"
              strokeWidth="7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M194 33L194 62.5"
              stroke="white"
              strokeWidth="7"
              strokeLinecap="round"
            />
            <line
              x1="188"
              y1="48"
              x2="207"
              y2="40"
              stroke="#35c3e7"
              strokeWidth="5"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <div style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <div className="relative w-80">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ally-muted"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              placeholder={typingText || 'Search…'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-ally-bg border border-ally-border rounded-full pr-4 py-0.5 text-ally-text placeholder:text-ally-muted focus:outline-none focus:ring-2 focus:ring-ally-accent"
              style={{ paddingLeft: '32px' } as React.CSSProperties}
            />
          </div>
        </div>
        <div
          className="absolute right-0 flex items-center gap-2 px-4"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            className="h-4 w-4 text-white"
            fill="currentColor"
          >
            <path d="M13.545 2.907a13.2 13.2 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.2 12.2 0 0 0-3.658 0 8 8 0 0 0-.412-.833.05.05 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.04.04 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032q.003.022.021.037a13.3 13.3 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019q.463-.63.818-1.329a.05.05 0 0 0-.01-.059l-.018-.011a9 9 0 0 1-1.248-.595.05.05 0 0 1-.02-.066l.015-.019q.127-.095.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.05.05 0 0 1 .053.007q.121.1.248.195a.05.05 0 0 1-.004.085 8 8 0 0 1-1.249.594.05.05 0 0 0-.03.03.05.05 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.2 13.2 0 0 0 4.001-2.02.05.05 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.03.03 0 0 0-.02-.019m-8.198 7.307c-.789 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612m5.316 0c-.788 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.451.73 1.438 1.613 0 .888-.631 1.612-1.438 1.612" />
          </svg>
          <div className="w-px h-4 bg-white mx-1" />
          <button
            onClick={handleMinimize}
            className="w-5 h-5 text-white rounded text-[11px] hover:bg-ally-hover hover:text-white transition-colors flex items-center justify-center"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <button
            onClick={handleMaximize}
            className="w-5 h-5 text-white rounded hover:bg-ally-hover hover:text-white flex items-center justify-center transition-colors"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h18v18H3V3z" />
            </svg>
          </button>
          <button
            onClick={handleClose}
            className="w-5 h-5 text-white rounded hover:bg-red-900 hover:text-white transition-colors flex items-center justify-center"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Bar 2 — Nav tabs */}
      <div className="w-full h-8 flex-shrink-0 bg-ally-card flex items-center justify-center gap-4">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActivePage(tab)}
            className={`px-2 h-full text-[13px] whitespace-nowrap transition-colors ${activePage === tab ? 'text-white border-b-2' : 'text-white hover:text-white border-b-2 border-transparent hover:border-[#35c3e7]'}`}
            style={activePage === tab ? { borderBottomColor: '#35c3e7' } as React.CSSProperties : undefined}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Page area */}
      <div className="w-full flex-1 flex flex-row bg-ally-bg px-8 py-6 gap-6 items-start overflow-y-auto">
        {activePage === 'In Game' ? (
          <>
            <aside className="flex flex-1 flex-col items-end gap-6 px-6 mr-4" style={{ transform: 'translateY(30px)' } as React.CSSProperties}>
              <SidebarBox />
              <SidebarBox />
              <SidebarBox />
            </aside>
            <section className="w-full max-w-[1000px] flex flex-col">
              <div className="text-[11px] uppercase tracking-widest text-white mb-4 text-center">
                (Mockups)
              </div>
              <div className="grid grid-cols-2 gap-3 -mt-[100px]">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-ally-card rounded-xl p-4 flex flex-col items-start gap-2 min-h-[200px]"
                  >
                    <div className="w-16 h-16 rounded-full bg-ally-hover flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-white text-sm font-semibold mb-0.5">
                        Player {i + 1}
                      </div>
                      <div className="text-ally-muted text-xs">
                        Rank {i + 1}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
            <aside className="hidden lg:flex flex-1 flex-col items-start gap-6 px-6" style={{ transform: 'translateY(30px)' } as React.CSSProperties}>
              <SidebarBox />
              <SidebarBox />
              <SidebarBox />
            </aside>
          </>
        ) : activePage === 'Comps' ? (
          <>
            <aside className="flex flex-1 flex-col items-end gap-6 px-6 mr-4" style={{ transform: 'translateY(30px)' } as React.CSSProperties}>
              <SidebarBox />
              <SidebarBox />
              <SidebarBox />
            </aside>
            <section className="w-full max-w-[1000px] flex flex-col">
              <div className="text-[11px] uppercase tracking-widest text-white mb-4 text-center">
                Meta Comps
              </div>
              
              {/* Comps grid */}
              <div className="flex flex-col gap-2">
                {META_COMPS.map((comp, index) => {
                  const tier = index < 2 ? 'S' : index < 6 ? 'A' : index < 8 ? 'B' : index < 9 ? 'C' : 'D';
                  return (
                    <CompCard 
                      key={comp.compName} 
                      comp={comp} 
                      tier={tier} 
                    />
                  );
                })}
              </div>
            </section>
            <aside className="hidden lg:flex flex-1 flex-col items-start gap-6 px-6" style={{ transform: 'translateY(30px)' } as React.CSSProperties}>
              <SidebarBox />
              <SidebarBox />
              <SidebarBox />
            </aside>
          </>
        ) : activePage === 'Items' ? (
          <>
            <aside className="flex flex-1 flex-col items-end gap-6 px-6 mr-4" style={{ transform: 'translateY(30px)' } as React.CSSProperties}>
              <SidebarBox />
              <SidebarBox />
              <SidebarBox />
            </aside>
            <section className="w-full max-w-[1000px] flex flex-col">
              <div className="text-[11px] uppercase tracking-widest text-white mb-4 text-center">
                Meta Items
              </div>
              
              {/* Items grid */}
              <div className="grid grid-cols-4 gap-3">
                {Array.from({ length: 16 }).map((_, i) => (
                  <div key={i} className="bg-ally-card rounded-lg p-3 border border-ally-border hover:border-ally-accent transition-colors">
                    <div className="flex flex-col gap-2">
                      {/* Item icon */}
                      <div className="w-12 h-12 rounded-lg bg-ally-hover mx-auto flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-ally-bg" />
                      </div>
                      
                      {/* Item name */}
                      <div className="text-white text-sm font-semibold text-center">
                        Item {i + 1}
                      </div>
                      
                      {/* Win rate */}
                      <div className="text-center">
                        <div className="text-ally-muted text-[10px]">Win Rate</div>
                        <div className="text-white font-bold text-sm">
                          {45 + (i % 10)}%
                        </div>
                      </div>
                      
                      {/* Best champions */}
                      <div className="border-t border-ally-border pt-2">
                        <div className="text-[9px] uppercase tracking-widest text-ally-muted mb-1 text-center">
                          Best Champions
                        </div>
                        <div className="flex gap-1 justify-center flex-wrap">
                          {Array.from({ length: 3 }).map((_, j) => (
                            <div key={j} className="w-6 h-6 rounded-full bg-ally-hover" />
                          ))}
                        </div>
                      </div>
                      
                      {/* Pick rate */}
                      <div className="text-center text-[10px]">
                        <span className="text-ally-muted">Pick Rate:</span>{' '}
                        <span className="text-white font-semibold">{5 + (i % 15)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
            <aside className="hidden lg:flex flex-1 flex-col items-start gap-6 px-6" style={{ transform: 'translateY(30px)' } as React.CSSProperties}>
              <SidebarBox />
              <SidebarBox />
              <SidebarBox />
            </aside>
          </>
        ) : activePage === 'Units' ? (
          <>
            <aside className="flex flex-1 flex-col items-end gap-6 px-6 mr-4" style={{ transform: 'translateY(30px)' } as React.CSSProperties}>
              <SidebarBox />
              <SidebarBox />
              <SidebarBox />
            </aside>
            <section className="w-full max-w-[1000px] flex flex-col">
              <div className="text-[11px] uppercase tracking-widest text-white mb-4 text-center">
                Meta Units
              </div>
              
              {/* Units grid */}
              <div className="grid grid-cols-4 gap-3">
                {Array.from({ length: 16 }).map((_, i) => (
                  <div key={i} className="bg-ally-card rounded-lg p-3 border border-ally-border hover:border-ally-accent transition-colors">
                    <div className="flex flex-col gap-2">
                      {/* Unit icon */}
                      <div className="w-12 h-12 rounded-lg bg-ally-hover mx-auto flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-ally-bg" />
                      </div>
                      
                      {/* Unit name */}
                      <div className="text-white text-sm font-semibold text-center">
                        Unit {i + 1}
                      </div>
                      
                      {/* Cost */}
                      <div className="text-center">
                        <div className="text-ally-muted text-[10px]">Cost</div>
                        <div className="text-white font-bold text-sm">
                          {1 + (i % 5)}g
                        </div>
                      </div>
                      
                      {/* Win rate */}
                      <div className="text-center">
                        <div className="text-ally-muted text-[10px]">Win Rate</div>
                        <div className="text-white font-bold text-sm">
                          {45 + (i % 10)}%
                        </div>
                      </div>
                      
                      {/* Best items */}
                      <div className="border-t border-ally-border pt-2">
                        <div className="text-[9px] uppercase tracking-widest text-ally-muted mb-1 text-center">
                          Best Items
                        </div>
                        <div className="flex gap-1 justify-center flex-wrap">
                          {Array.from({ length: 3 }).map((_, j) => (
                            <div key={j} className="w-4 h-4 rounded bg-ally-bg" />
                          ))}
                        </div>
                      </div>
                      
                      {/* Traits */}
                      <div className="border-t border-ally-border pt-2">
                        <div className="text-[9px] uppercase tracking-widest text-ally-muted mb-1 text-center">
                          Traits
                        </div>
                        <div className="flex gap-1 justify-center flex-wrap">
                          {Array.from({ length: 2 }).map((_, j) => (
                            <div key={j} className="text-[8px] text-white bg-ally-hover rounded px-1 py-0.5">
                              Trait {j + 1}
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Pick rate */}
                      <div className="text-center text-[10px]">
                        <span className="text-ally-muted">Pick Rate:</span>{' '}
                        <span className="text-white font-semibold">{5 + (i % 15)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
            <aside className="hidden lg:flex flex-1 flex-col items-start gap-6 px-6" style={{ transform: 'translateY(30px)' } as React.CSSProperties}>
              <SidebarBox />
              <SidebarBox />
              <SidebarBox />
            </aside>
          </>
        ) : activePage === 'Traits' ? (
          <>
            <aside className="flex flex-1 flex-col items-end gap-6 px-6 mr-4" style={{ transform: 'translateY(30px)' } as React.CSSProperties}>
              <SidebarBox />
              <SidebarBox />
              <SidebarBox />
            </aside>
            <section className="w-full max-w-[1000px] flex flex-col">
              <div className="text-[11px] uppercase tracking-widest text-white mb-4 text-center">
                Meta Traits
              </div>
              
              {/* Traits grid */}
              <div className="grid grid-cols-4 gap-3">
                {Array.from({ length: 16 }).map((_, i) => (
                  <div key={i} className="bg-ally-card rounded-lg p-3 border border-ally-border hover:border-ally-accent transition-colors">
                    <div className="flex flex-col gap-2">
                      {/* Trait icon */}
                      <div className="w-12 h-12 rounded-lg bg-ally-hover mx-auto flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-ally-bg" />
                      </div>
                      
                      {/* Trait name */}
                      <div className="text-white text-sm font-semibold text-center">
                        Trait {i + 1}
                      </div>
                      
                      {/* Tier */}
                      <div className="text-center">
                        <div className="text-ally-muted text-[10px]">Tier</div>
                        <div className="text-white font-bold text-sm">
                          {['Bronze', 'Silver', 'Gold', 'Prismatic'][i % 4]}
                        </div>
                      </div>
                      
                      {/* Win rate */}
                      <div className="text-center">
                        <div className="text-ally-muted text-[10px]">Win Rate</div>
                        <div className="text-white font-bold text-sm">
                          {45 + (i % 10)}%
                        </div>
                      </div>
                      
                      {/* Best units */}
                      <div className="border-t border-ally-border pt-2">
                        <div className="text-[9px] uppercase tracking-widest text-ally-muted mb-1 text-center">
                          Best Units
                        </div>
                        <div className="flex gap-1 justify-center flex-wrap">
                          {Array.from({ length: 3 }).map((_, j) => (
                            <div key={j} className="w-4 h-4 rounded bg-ally-hover" />
                          ))}
                        </div>
                      </div>
                      
                      {/* Synergies */}
                      <div className="border-t border-ally-border pt-2">
                        <div className="text-[9px] uppercase tracking-widest text-ally-muted mb-1 text-center">
                          Synergies
                        </div>
                        <div className="flex gap-1 justify-center flex-wrap">
                          {Array.from({ length: 2 }).map((_, j) => (
                            <div key={j} className="text-[8px] text-white bg-ally-hover rounded px-1 py-0.5">
                              Synergy {j + 1}
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Pick rate */}
                      <div className="text-center text-[10px]">
                        <span className="text-ally-muted">Pick Rate:</span>{' '}
                        <span className="text-white font-semibold">{5 + (i % 15)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
            <aside className="hidden lg:flex flex-1 flex-col items-start gap-6 px-6" style={{ transform: 'translateY(30px)' } as React.CSSProperties}>
              <SidebarBox />
              <SidebarBox />
              <SidebarBox />
            </aside>
          </>
        ) : activePage === 'Augments' ? (
          <>
            <aside className="flex flex-1 flex-col items-end gap-6 px-6 mr-4" style={{ transform: 'translateY(30px)' } as React.CSSProperties}>
              <SidebarBox />
              <SidebarBox />
              <SidebarBox />
            </aside>
            <section className="w-full max-w-[1000px] flex flex-col">
              <div className="text-[11px] uppercase tracking-widest text-white mb-4 text-center">
                Meta Augments
              </div>
              
              {/* Augments grid */}
              <div className="grid grid-cols-4 gap-3">
                {Array.from({ length: 16 }).map((_, i) => (
                  <div key={i} className="bg-ally-card rounded-lg p-3 border border-ally-border hover:border-ally-accent transition-colors">
                    <div className="flex flex-col gap-2">
                      {/* Augment icon */}
                      <div className="w-12 h-12 rounded-lg bg-ally-hover mx-auto flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-ally-bg" />
                      </div>
                      
                      {/* Augment name */}
                      <div className="text-white text-sm font-semibold text-center">
                        Augment {i + 1}
                      </div>
                      
                      {/* Tier */}
                      <div className="text-center">
                        <div className="text-ally-muted text-[10px]">Tier</div>
                        <div className="text-white font-bold text-sm">
                          {['Prismatic', 'Gold', 'Silver', 'Bronze'][i % 4]}
                        </div>
                      </div>
                      
                      {/* Win rate */}
                      <div className="text-center">
                        <div className="text-ally-muted text-[10px]">Win Rate</div>
                        <div className="text-white font-bold text-sm">
                          {45 + (i % 10)}%
                        </div>
                      </div>
                      
                      {/* Best comps */}
                      <div className="border-t border-ally-border pt-2">
                        <div className="text-[9px] uppercase tracking-widest text-ally-muted mb-1 text-center">
                          Best Comps
                        </div>
                        <div className="flex gap-1 justify-center flex-wrap">
                          {Array.from({ length: 2 }).map((_, j) => (
                            <div key={j} className="text-[8px] text-white bg-ally-hover rounded px-1 py-0.5">
                              Comp {j + 1}
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Synergies */}
                      <div className="border-t border-ally-border pt-2">
                        <div className="text-[9px] uppercase tracking-widest text-ally-muted mb-1 text-center">
                          Synergies
                        </div>
                        <div className="flex gap-1 justify-center flex-wrap">
                          {Array.from({ length: 2 }).map((_, j) => (
                            <div key={j} className="text-[8px] text-white bg-ally-hover rounded px-1 py-0.5">
                              Synergy {j + 1}
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Pick rate */}
                      <div className="text-center text-[10px]">
                        <span className="text-ally-muted">Pick Rate:</span>{' '}
                        <span className="text-white font-semibold">{5 + (i % 15)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
            <aside className="hidden lg:flex flex-1 flex-col items-start gap-6 px-6" style={{ transform: 'translateY(30px)' } as React.CSSProperties}>
              <SidebarBox />
              <SidebarBox />
              <SidebarBox />
            </aside>
          </>
        ) : activePage === 'Match History' ? (
          <>
            <aside className="flex flex-1 flex-col items-end gap-6 px-6 mr-4" style={{ transform: 'translateY(30px)' } as React.CSSProperties}>
              <SidebarBox />
              <SidebarBox />
              <SidebarBox />
            </aside>
            <section className="w-full max-w-[1000px] flex flex-col">
              <div className="text-[11px] uppercase tracking-widest text-white mb-4 text-center">
                Match History
              </div>
              
              {/* User profile header */}
              <div className="bg-ally-card rounded-lg p-6 mb-4 border border-ally-border">
                <div className="flex items-center gap-6">
                  {/* Avatar */}
                  <div className="w-20 h-20 rounded-full bg-ally-hover flex-shrink-0" />
                  
                  {/* User info */}
                  <div className="flex-1">
                    <div className="text-white text-xl font-bold mb-1">
                      Player Name
                    </div>
                    <div className="text-ally-muted text-sm mb-3">
                      Summoner Level 100
                    </div>
                    <div className="flex gap-4 text-sm">
                      <div className="text-ally-muted">
                        <span className="text-white font-semibold">Diamond II</span> Rank
                      </div>
                      <div className="text-ally-muted">
                        <span className="text-white font-semibold">52%</span> Win Rate
                      </div>
                      <div className="text-ally-muted">
                        <span className="text-white font-semibold">1,234</span> Games
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Stats grid */}
              <div className="grid grid-cols-4 gap-3 mb-4">
                {[
                  { label: 'Top 4 Rate', value: '48%' },
                  { label: 'Avg Placement', value: '#3.2' },
                  { label: 'Win Rate', value: '12%' },
                  { label: 'Play Time', value: '250h' },
                ].map((stat, i) => (
                  <div key={i} className="bg-ally-card rounded-lg p-3 border border-ally-border">
                    <div className="text-ally-muted text-[10px] uppercase tracking-widest mb-1">
                      {stat.label}
                    </div>
                    <div className="text-white font-bold text-lg">
                      {stat.value}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Recent matches */}
              <div className="bg-ally-card rounded-lg p-4 border border-ally-border">
                <div className="text-[10px] uppercase tracking-widest text-ally-muted mb-3">
                  Recent Matches
                </div>
                <div className="flex flex-col gap-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="bg-ally-hover rounded-lg p-3 flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm ${i < 2 ? 'bg-green-500' : i < 3 ? 'bg-yellow-500' : 'bg-red-500'}`}>
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <div className="text-white text-sm font-semibold">
                          Match {i + 1}
                        </div>
                        <div className="text-ally-muted text-xs">
                          {['S', 'A', 'B', 'C', 'D'][i]} Tier Comp
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white text-sm font-semibold">
                          {['1st', '2nd', '3rd', '4th', '5th'][i]}
                        </div>
                        <div className="text-ally-muted text-xs">
                          {10 + i * 5} mins ago
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
            <aside className="hidden lg:flex flex-1 flex-col items-start gap-6 px-6" style={{ transform: 'translateY(30px)' } as React.CSSProperties}>
              <SidebarBox />
              <SidebarBox />
              <SidebarBox />
            </aside>
          </>
        ) : (
          <>
            <aside className="flex flex-1 flex-col items-end gap-6 px-6 mr-4" style={{ transform: 'translateY(30px)' } as React.CSSProperties}>
              <SidebarBox />
              <SidebarBox />
              <SidebarBox />
            </aside>
            <section className="w-full max-w-[1000px] flex flex-col">
              {activePage === 'Team Builder' ? <TeamBuilder /> : (
                <div className="flex items-center justify-center h-full">
                  <span className="text-white text-sm">{activePage}</span>
                </div>
              )}
            </section>
            <aside className="hidden lg:flex flex-1 flex-col items-start gap-6 px-6" style={{ transform: 'translateY(30px)' } as React.CSSProperties}>
              <SidebarBox />
              <SidebarBox />
              <SidebarBox />
            </aside>
          </>
        )}
      </div>
    </div>
  );
}
