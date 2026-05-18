export function CompFilters({ tier, setTier }: { tier: string; setTier: (t: string) => void }) {
  const tiers = ['All', 'S', 'A', 'B', 'C', 'D'];
  return (
    <div
      className="flex-shrink-0"
      style={{
        background: '#111111',
        borderRight: '1px solid #2a2a2a',
        padding: '16px',
        width: '200px',
        zIndex: 1,
        position: 'relative',
        animation: 'sidebarEnter 0.3s cubic-bezier(0.25, 1, 0.5, 1) 0.1s both',
      }}
    >
      {/* Tier Filter */}
      <div>
        <div style={{ fontSize: '10px', color: '#333', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px', marginTop: '16px' }}>
          Tier
        </div>
        <div className="flex flex-wrap gap-2">
          {tiers.map((t) => (
            <button
              key={t}
              onClick={() => setTier(t)}
              style={{
                padding: '3px 10px',
                borderRadius: '4px',
                fontSize: '11px',
                border: tier === t ? '1px solid #35c3e740' : '1px solid #2a2a2a',
                background: tier === t ? '#35c3e710' : 'transparent',
                color: tier === t ? '#35c3e7' : '#555',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

