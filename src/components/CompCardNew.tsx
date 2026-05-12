// New streamlined comp card adhering to minimal editorial design
import React, { useState } from 'react';
import { Pin, PinOff, FilePlus, Monitor } from 'lucide-react';

import type { MetaComp } from '@/types/tft';

interface CompCardNewProps {
  comp: MetaComp & {
    tier?: string;
    winRate?: number;
    top4Rate?: number;
    pickRate?: number;
    avgPlace?: number;
  };
  isPinned?: boolean;
  onPinToggle?: (compName: string) => void;
  onImport?: (comp: MetaComp) => void;
  onOverlayToggle?: (comp: MetaComp) => void;
}

/**
 * CompCardNew provides a streamlined view of a meta composition.
 * Memoized to ensure list performance remains high even with dozens of active cards.
 */
export const CompCardNew = React.memo(function CompCardNew({ comp, isPinned, onPinToggle, onImport, onOverlayToggle }: CompCardNewProps) {
  const [expanded, setExpanded] = useState(false);
  const tier = comp.tier ?? 'B';
    // Tier badge uses neutral styling per app color tokens


  // Simple board placement – just list units in a miniature grid
  const placementGrid = (
    <div className="grid grid-cols-4 gap-1 mt-2">
      {comp.requiredUnits.map((unit, i) => (
<div
                    key={unit}
                    className="w-8 h-8 rounded-full bg-ally-bg border border-ally-border flex items-center justify-center text-xs text-ally-text"
                  >
                    {unit}
                  </div>
      ))}
    </div>
  );

  return (
<div className={
   `relative bg-ally-card border border-ally-border rounded-lg overflow-hidden ${
     {
       S: 'border-l-4 border-l-ally-accent',
       A: 'border-l-4 border-l-ally-accent/70',
       B: 'border-l-4 border-l-ally-accent/50',
       C: 'border-l-4 border-l-ally-accent/30',
       D: 'border-l-4 border-l-ally-accent/10',
     }[tier] || ''
   }`
}>

        <div role="button" tabIndex={0}
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center p-3 text-left hover:bg-ally-hover transition-colors cursor-pointer"
        >
        <span className={
  `px-2 py-0.5 rounded text-xs font-bold ${
    {
      S: 'bg-ally-accent/30 text-ally-text border border-ally-accent',
      A: 'bg-ally-accent/20 text-ally-text border border-ally-accent',
      B: 'bg-ally-accent/15 text-ally-text border border-ally-accent',
      C: 'bg-ally-accent/10 text-ally-text border border-ally-accent',
      D: 'bg-ally-accent/5 text-ally-text border border-ally-accent',
    }[tier] || 'bg-ally-bg text-ally-muted border border-ally-border'
  }`
}>
          {tier}
        </span>
        <div className="ml-3 flex-1 min-w-0">
          <div className="text-sm font-semibold text-white truncate">{comp.compName}</div>
          <div className="flex flex-wrap gap-2 mt-1">
            {comp.requiredUnits.map((u) => (
              <div key={u} className="w-8 h-8 rounded-full bg-ally-bg border border-ally-border flex items-center justify-center text-xs text-ally-text">
                {u}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 mt-2 text-xs text-ally-muted">
            {comp.winRate !== undefined && (
              <span>{comp.winRate}% WR</span>
            )}
            {comp.top4Rate !== undefined && (
              <span>{comp.top4Rate}% Top‑4</span>
            )}
            {comp.pickRate !== undefined && (
              <span>{comp.pickRate}% Pick</span>
            )}
            {comp.avgPlace !== undefined && (
              <span>Avg Place {comp.avgPlace}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div role="button" tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              onPinToggle?.(comp.compName);
            }}
            aria-label={isPinned ? "Unpin comp" : "Pin comp"}
            className="text-ally-accent hover:text-ally-accent"
          >
            {isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
          </div>
          <div role="button" tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              onImport?.(comp);
            }}
            aria-label="Import to team builder"
            className="text-ally-accent hover:text-ally-accent"
          >
            <FilePlus className="w-4 h-4" />
          </div>
          <div role="button" tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              onOverlayToggle?.(comp);
            }}
            aria-label="Display on overlay"
            className="text-ally-accent hover:text-ally-accent"
          >
            <Monitor className="w-4 h-4" />
          </div>
        </div>
        <span className="text-ally-muted">{expanded ? '−' : '+'}</span>
      </div>
      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t border-ally-border">
          <div className="text-xs uppercase tracking-widest text-ally-muted mb-1">Carries</div>
          {comp.carries.map((carry) => (
            <div key={carry.name} className="mb-2">
              <div className="text-sm font-medium text-white">{carry.name}</div>
              <div className="flex flex-wrap gap-1 mt-1">
                {carry.bisItems.map((item) => (
                  <span key={item} className="px-1.5 py-0.5 bg-ally-bg border border-ally-border text-xs text-ally-muted">{item}</span>
                ))}
              </div>
            </div>
          ))}
          <div className="mt-3">
            <div className="text-xs uppercase tracking-widest text-ally-muted mb-1">Placement</div>
            {placementGrid}
          </div>
        </div>
      )}
    </div>
  );
})
