import { useState } from 'react';

/**
 * Simple filter sidebar for the Comps tab.
 * Currently supports tier filtering (All, S, A, B, C, D).
 * Uses design tokens for background, borders, and text.
 */
export function CompFilters({ tier, setTier }: { tier: string; setTier: (t: string) => void }) {
  const tiers = ['All', 'S', 'A', 'B', 'C', 'D'];
  return (
    <div className="w-48 bg-ally-card border border-ally-border rounded-lg p-4 mr-4 shrink-0">
      <div className="text-caption uppercase text-ally-muted mb-2">Tier</div>
      <select
        value={tier}
        onChange={(e) => setTier(e.target.value)}
        className="w-full bg-ally-bg border border-ally-border rounded p-1 text-sm text-ally-text focus-visible:ring-2 focus-visible:ring-ally-accent"
      >
        {tiers.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
    </div>
  );
}
