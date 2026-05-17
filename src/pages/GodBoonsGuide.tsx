import { useMemo, useState } from 'react'
import { GameIcon } from '@/components/GameIcon'
import { SearchInputWithSuggestions } from '@/components/SearchInputWithSuggestions'
import { TFTStaticDataBanner } from '@/components/TFTStaticDataBanner'
import { useTypewriterPlaceholder } from '@/hooks/useTypewriterPlaceholder'
import { useTFTData } from '@/hooks/useTFTData'
import { buildGodBoonGuideEntries, type GodBoonGuideEntry } from '@/lib/tftStaticMappers'
import { augmentIconUrl } from '@/utils/augmentDisplay'

const C = {
  bg: '#0e0e0e',
  surface: '#111111',
  border: '#2a2a2a',
  accent: '#35c3e7',
  accentDim: 'rgba(53, 195, 231, 0.15)',
  text: '#ffffff',
  muted: '#9ca3af',
  content: '#0e0e0e',
  divine: '#c084fc',
  divineDim: 'rgba(192, 132, 252, 0.12)',
  divineBorder: 'rgba(192, 132, 252, 0.35)',
}

interface GodBoonsGuideProps {
  query: string
  setQuery: (value: string) => void
  godFilter: string
  setGodFilter: (value: string) => void
}

type GodGroup = {
  godKey: string
  godName: string
  primary: GodBoonGuideEntry | null
  variants: GodBoonGuideEntry[]
}

function groupByGod(boons: GodBoonGuideEntry[]): GodGroup[] {
  const map = new Map<string, GodGroup>()
  for (const boon of boons) {
    let group = map.get(boon.godKey)
    if (!group) {
      group = { godKey: boon.godKey, godName: boon.godName, primary: null, variants: [] }
      map.set(boon.godKey, group)
    }
    if (boon.isPrimary) group.primary = boon
    else group.variants.push(boon)
  }
  return [...map.values()].sort((a, b) => a.godName.localeCompare(b.godName))
}

export function GodBoonsGuide({ query, setQuery, godFilter, setGodFilter }: GodBoonsGuideProps) {
  const tft = useTFTData()
  const boons = useMemo(() => buildGodBoonGuideEntries(tft), [tft])
  const [selected, setSelected] = useState<GodBoonGuideEntry | null>(null)

  const godOptions = useMemo(() => {
    const keys = new Map<string, string>()
    for (const b of boons) keys.set(b.godKey, b.godName)
    return [...keys.entries()].sort((a, b) => a[1].localeCompare(b[1]))
  }, [boons])

  const placeholderWords = useMemo(
    () => boons.filter((b) => b.isPrimary).map((b) => b.godName),
    [boons],
  )

  const { placeholderAnimated } = useTypewriterPlaceholder(
    placeholderWords.length > 0 ? placeholderWords : ['Ahri', 'Kayle', 'Yasuo'],
    query.length > 0,
  )

  const groups = useMemo(() => {
    let list = groupByGod(boons)
    if (godFilter !== 'all') {
      list = list.filter((g) => g.godKey === godFilter)
    }
    if (query) {
      const q = query.toLowerCase()
      list = list
        .map((g) => {
          const matchGod = g.godName.toLowerCase().includes(q)
          const primaryOk =
            g.primary &&
            (g.primary.name.toLowerCase().includes(q) ||
              g.primary.description.toLowerCase().includes(q))
          const variants = g.variants.filter(
            (v) =>
              v.name.toLowerCase().includes(q) || v.description.toLowerCase().includes(q),
          )
          if (!matchGod && !primaryOk && variants.length === 0) return null
          return {
            ...g,
            primary: primaryOk || matchGod ? g.primary : null,
            variants: matchGod ? g.variants : variants,
          }
        })
        .filter((g): g is GodGroup => g !== null)
    }
    return list
  }, [boons, query, godFilter])

  const totalVisible = groups.reduce(
    (n, g) => n + (g.primary ? 1 : 0) + g.variants.length,
    0,
  )

  if (selected) {
    return <GodBoonDetail boon={selected} onBack={() => setSelected(null)} />
  }

  return (
    <div className="flex h-screen" style={{ animation: 'pageEnter 0.4s cubic-bezier(0.25, 1, 0.5, 1)' }}>
      <div
        className="flex-shrink-0 flex flex-col"
        style={{
          background: '#111111',
          borderRight: '1px solid #2a2a2a',
          padding: '16px',
          width: '200px',
          flexShrink: 0,
          zIndex: 1,
        }}
      >
        <SearchInputWithSuggestions
          value={query}
          onChange={setQuery}
          placeholder={placeholderAnimated || 'Search gods & boons…'}
          kinds={['augment']}
          wrapperClassName="w-full mb-6"
          listZIndex={80}
          inputClassName="w-full"
          inputStyle={{
            width: '100%',
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: '6px',
            padding: '7px 10px',
            fontSize: '12px',
            color: 'white',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />

        <div>
          <div
            style={{
              fontSize: '10px',
              color: '#333',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}
          >
            Space God
          </div>
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => setGodFilter('all')}
              style={{
                padding: '5px 10px',
                borderRadius: '4px',
                fontSize: '11px',
                textAlign: 'left',
                border:
                  godFilter === 'all' ? `1px solid ${C.divineBorder}` : '1px solid transparent',
                background: godFilter === 'all' ? C.divineDim : 'transparent',
                color: godFilter === 'all' ? C.divine : '#555',
                cursor: 'pointer',
              }}
            >
              All gods
            </button>
            {godOptions.map(([key, name]) => (
              <button
                key={key}
                type="button"
                onClick={() => setGodFilter(key)}
                style={{
                  padding: '5px 10px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  textAlign: 'left',
                  border:
                    godFilter === key ? `1px solid ${C.divineBorder}` : '1px solid transparent',
                  background: godFilter === key ? C.divineDim : 'transparent',
                  color: godFilter === key ? C.divine : '#555',
                  cursor: 'pointer',
                }}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-6 text-[10px] leading-relaxed text-ally-muted">
          God boons are chosen during the Space Gods encounter — not Hextech augments.
        </p>
      </div>

      <div
        className="flex-1 overflow-y-auto"
        style={{ background: C.content, padding: '16px' }}
      >
        <TFTStaticDataBanner meta={tft.meta} count={totalVisible} label="god boons" />
        <div className="flex flex-col gap-4">
          {groups.map((group, gi) => (
            <section key={group.godKey}>
              <h3
                className="mb-2 font-display text-sm font-semibold tracking-wide text-ally-accent"
                style={{ color: C.divine }}
              >
                {group.godName}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {group.primary ? (
                  <BoonCard
                    boon={group.primary}
                    index={gi}
                    badge="Primary"
                    onClick={() => setSelected(group.primary!)}
                  />
                ) : null}
                {group.variants.map((boon, vi) => (
                  <BoonCard
                    key={boon.id}
                    boon={boon}
                    index={gi + vi}
                    badge="Variant"
                    onClick={() => setSelected(boon)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes pageEnter { from { opacity: 0; } to { opacity: 1; } }
        @keyframes cardEnter {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  )
}

function BoonCard({
  boon,
  index,
  badge,
  onClick,
}: {
  boon: GodBoonGuideEntry
  index: number
  badge: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative text-left"
      style={{
        background: C.surface,
        border: `1px solid ${C.divineBorder}`,
        borderRadius: '8px',
        padding: '12px',
        cursor: 'pointer',
        animation: `cardEnter 0.4s cubic-bezier(0.25, 1, 0.5, 1) ${index * 40}ms both`,
      }}
    >
      <div
        className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold"
        style={{
          color: C.divine,
          background: C.divineDim,
          border: `1px solid ${C.divineBorder}`,
        }}
      >
        {badge}
      </div>
      <div className="flex items-center gap-3 mb-2 pr-16">
        <GameIcon
          src={boon.iconUrl}
          fallbackSrc={augmentIconUrl(boon.name)}
          width={40}
          height={40}
          style={{ borderRadius: 6, objectFit: 'cover', flexShrink: 0 }}
        />
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'white' }}>{boon.name}</div>
      </div>
      <p style={{ fontSize: '11px', color: '#555', lineHeight: 1.4 }}>{boon.description}</p>
    </button>
  )
}

function GodBoonDetail({ boon, onBack }: { boon: GodBoonGuideEntry; onBack: () => void }) {
  return (
    <div
      className="h-full overflow-y-auto"
      style={{ background: C.content, padding: '16px' }}
    >
      <button
        type="button"
        onClick={onBack}
        className="mb-4 text-[13px] text-ally-muted hover:text-ally-accent"
      >
        ← God boons
      </button>
      <div className="flex items-center gap-4 mb-6">
        <GameIcon
          src={boon.iconUrl}
          fallbackSrc={augmentIconUrl(boon.name)}
          width={56}
          height={56}
          style={{ borderRadius: 8, objectFit: 'cover', border: `1px solid ${C.border}` }}
        />
        <div>
          <p className="text-[10px] uppercase tracking-widest text-ally-muted mb-1">
            {boon.godName}
          </p>
          <h2 className="font-display text-xl font-bold text-ally-text">{boon.name}</h2>
        </div>
      </div>
      <div
        className="rounded-lg border border-ally-border bg-ally-card p-4 text-sm text-ally-muted leading-relaxed"
      >
        {boon.description}
      </div>
    </div>
  )
}
