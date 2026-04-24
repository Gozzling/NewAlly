# Riot Developer Portal — Product Registration Draft

## Product Name
**TFT Ally** (TFT Companion)

## Product Type
Larger scale product — intended for public distribution via Overwolf Appstore

## Product Description

TFT Ally is a desktop companion application for Teamfight Tactics (TFT) built on the Overwolf platform. It provides players with real-time, data-driven insights to help them learn the game, track their progress, and make informed strategic decisions — all using publicly available data from the Riot Games API.

### Core Features

1. **Meta Composition Tracker** — Aggregates and displays current meta trends, showing which team compositions are performing well across ranked ladder tiers (S/A/B/C tier lists). Helps players understand the evolving meta and discover new comps to try.

2. **Player Scouting & Match History** — Allows players to search any summoner by name and region, view their recent 20-match history, analyze their most-played compositions, top-4 rate, average placement, and augment preferences. Useful for pre-game lobby scouting and self-improvement.

3. **In-Game Overlay** — A lightweight, toggleable overlay that displays during TFT matches, showing: live game status, active meta recommendations, and an item cheat sheet. The overlay is manually toggled by the player (Ctrl+T hotkey) and does not interfere with gameplay.

4. **Analytics Dashboard** — Visualizes player performance over time with charts: win rate by composition, placement trends across matches, and augment pick frequency heatmaps. Helps players identify strengths and weaknesses in their gameplay.

5. **Item Cheat Sheet** — Quick-reference guide for item recipes and component combinations, filterable by category (AD/AP/Tank/Utility). Reduces the learning curve for new and returning players.

### How It Helps Players Improve

- **Data Literacy**: Players learn which comps and items work in the current meta by seeing aggregated statistics rather than relying on anecdotal experience.
- **Self-Reflection**: Match history and analytics help players identify patterns in their gameplay (e.g., consistently forcing the same weak comp, poor itemization).
- **Reduced Information Overload**: New players often struggle to remember item recipes and comp requirements. The cheat sheet and tracker reduce cognitive load so players can focus on decision-making.
- **No Automation**: The app never makes decisions for the player, modifies game files, or provides real-time hidden information. All data is either public (Riot API) or player-entered.

### Data Sources

- **Riot Games API**: Summoner lookup, ranked league entries, match history (TFT Summoner v1, TFT League v1, TFT Match v1 endpoints)
- **Overwolf Game Events API**: Match start/end detection, in-game state (used solely to show/hide the overlay at appropriate times)
- **No third-party data scraping**: All match data comes directly from Riot's official API

### Technical Architecture

- **Platform**: Overwolf (desktop overlay framework)
- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Supabase Edge Functions (serverless proxies for Riot API calls, keeping the API key secure)
- **Rate Limiting**: 20 req/sec per-region sliding window; client-side caching with TTL to minimize API load

### Monetization

None planned for initial release. If monetization is added in the future, it will be purely cosmetic (e.g., premium themes) and will not gate any core functionality. No pay-to-win features, no loot boxes, no real-money trading.

### Compliance Statement

TFT Ally complies with all Riot Games Developer Policies and Overwolf compliance rules:
- Does not automate gameplay or provide decision-making assistance during matches
- Does not expose hidden or unreleased information
- Does not modify game files, memory, or network traffic
- Does not display advertisements inside the game client (Overwolf overlay only)
- Respects Riot API rate limits and caches aggressively to minimize server load
- All features are available to all users equally (no paid advantages)

## Requested API Key Type

**Production API Key**

Rationale: TFT Ally is intended for public distribution via the Overwolf Appstore. A development key (24h expiry) is insufficient for a live product, and a personal key's rate limits (20 req/1s) would be quickly exhausted by even a small user base. The production key rate limits (500 req/10s, 30,000 req/10min per region) are appropriate for a companion app with caching.

## App Icon / Screenshot

[Attach icon.png from public/ folder]

## Contact

Developer: Vincent (elecb3)
Email: [your email]
Discord: [your discord]
