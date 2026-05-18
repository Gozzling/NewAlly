# TFT Ally — Agent Instructions

## Project
Overwolf Native app for Teamfight Tactics. 3 windows: background (controller), overlay (in-game), desktop (main UI).

## Stack
- React + TypeScript
- Vite
- Tailwind CSS (see tailwind.config.ts for all tokens)
- Zustand (shared state between windows; includes `pipeline` for GEP / background errors from IPC)
- RxJS (`src/engine/events` — typed event bus, replay buffer, telemetry sink)
- Vitest + jsdom (unit tests)
- `@ally/shared-types` (`file:./packages/shared-types`) — canonical IPC + `AllyRecommendation` shapes

## Color tokens — always use these, never raw hex values
| Token               | Value     | Usage                        |
|---------------------|-----------|------------------------------|
| `ally-bg`           | #181818   | Page/window backgrounds      |
| `ally-card`         | #1f1f1f   | Cards, panels, modals        |
| `ally-accent`       | #35c3e7   | Buttons, highlights, icons   |
| `ally-text`         | #ffffff   | Primary text                 |
| `ally-muted`        | #a1a1a1   | Secondary/hint text          |
| `ally-border`       | #2a2a2a   | Borders, dividers            |
| `ally-hover`        | #252525   | Hover states                 |

## Game Data & Architecture
- **Single Source of Truth**: All game data (units, traits, items, augments) is managed by `src/store/useAppStore.ts` in the `gameData` state.
- **Loading Flow**: `GameDataHydrator` calls `loadGameData()` on desktop/overlay startup. Priority: seed hydrate (`src/data/fallback-seed.json`) → CDN (`cdnDataService.fetchLatest`) → IndexedDB (1h TTL) → seed on failure. Regenerate seed: `npm run sync-all`.
- **UI data access**: Use `useTFTData()` / `useTFTGameData()` — all guides and overlays read unified Zustand `gameData`, not `src/data/*.ts` directly.
- **Icon Resolution**: Use `UnitPortrait` component or `resolveIconUrl` helpers from `src/utils/iconResolver.ts`. This ensures correct fallbacks from CDN to local assets.
- **Pages**: UI pages should NEVER import from `src/data/*.ts`. They must consume data from the store hooks.

## Current TFT set + coach history
- **Set number & static meta version**: `src/meta/tftCurrentSet.ts` (`CURRENT_TFT_SET_NUMBER`, `STATIC_META_VERSION`). Prefer importing from there instead of hard-coding set IDs in UI or the recommendation engine.
- **Coach cache (desktop + overlay)**: TTL ~1h, key prefix `tft-ally::coach-mh:` in `localStorage` (see `useCoachMatchHistory.ts`). Overlay and desktop are different renderers; the overlay also reads this cache and listens for `storage` because Zustand is not shared across windows.
- **IPC**: `IpcCoachMatchHistoryMessage` (`kind: "coach_match_history"`) on `TFT_LIVE_CHANNEL` mirrors a fresh `PlayerMatchHistorySummary` to overlay/lobby after desktop fetch or when explicitly broadcast.

## Folder structure
```
packages/
└── shared-types/     ← @ally/shared-types — IPC payloads, recommendation contracts (import in app + future workers)

src/
├── windows/
│   ├── desktop/      ← main app UI (out-of-game)
│   └── overlay/      ← in-game HUD
├── engine/
│   ├── events/       ← Ally event bus (RxJS), IPC guards/factories (types from @ally/shared-types)
│   └── recommendations/ ← Capture-agnostic coaching engine (static meta + GEP signals + match history)
├── vision/
│   └── capture/      ← Screen capture pipeline (stub → native / Overwolf hooks)
├── components/       ← shared UI components
├── hooks/            ← custom hooks, API integration
├── services/         ← game events, Overwolf API calls, `backgroundVisionCapture` (match lifecycle)
├── store/            ← Zustand stores
└── styles/           ← global CSS, Tailwind base
```

## Rules
- All styling via Tailwind utility classes. No inline styles. No CSS Modules.
- Use `ally-*` color tokens exclusively. Never use raw hex or arbitrary Tailwind values for brand colors.
- Components go in `src/components/`. Keep them dumb — no direct service or store imports unless necessary.
- `src/services/` handles all Overwolf API calls and game event listeners. Do not touch this from UI components directly — use hooks or store.
- `src/store/` is the shared state layer between windows. Use Zustand.
- `manifest.json` — do not modify without explicit instruction.
- Dark mode is default. Light mode support is a future setting — do not build for it now.
- Fonts: `font-display` (Rajdhani) for headings and logo. `font-sans` (Inter) for all body/UI text.

## Do not
- Add new dependencies without listing them here
- Modify anything in `src/services/` when working on UI tasks
- Use `!important` or override Tailwind base styles
- Create new windows or modify the manifest
