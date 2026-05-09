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

## Contact (fill in before submitting)

- **Developer / studio:** Vincent (GitHub: [elecb3](https://github.com/elecb3))
- **Email:** [your email — use the same address as your Riot Developer Portal account if possible]
- **Support / bugs:** https://github.com/elecb3/TFTAllyMain/issues
- **Repository:** https://github.com/elecb3/TFTAllyMain

---

## Riot requirement: production keys need a real product site

Per Riot Developer Relations ([Production key applications](https://support-developer.riotgames.com/hc/en-us/articles/22801383038867-Production-Key-Applications)):

- They need a **website** to see what the product does and to host **Privacy Policy** and **Terms of Service**.
- A **GitHub repo alone** is not accepted in place of a functioning site.
- Plan: enable **GitHub Pages** (or any domain you control) for this repo so reviewers get:
  - **Landing:** `index.html` (what TFT Ally is, attribution, link to GitHub)
  - **Privacy:** `privacy.html` (in `public/`, shipped to site root)
  - **Terms:** `terms.html` (same)

Replace every `https://YOUR_USER.github.io/TFTAllyMain/...` below with your live Pages URLs before pasting into the portal.

---

## Developer Portal — copy/paste kit (typical fields)

Use **Register product** (or equivalent) on [developer.riotgames.com](https://developer.riotgames.com). Wording varies; map sections to whatever the form shows.

### Product type

**Larger-scale product** — public distribution (Overwolf Appstore), not a personal script.

### Product / website URL (primary)

`https://YOUR_USER.github.io/TFTAllyMain/`  
(or your custom domain)

### Privacy policy URL

`https://YOUR_USER.github.io/TFTAllyMain/privacy.html`

### Terms of service URL

`https://YOUR_USER.github.io/TFTAllyMain/terms.html`

### Short description (~1–2 sentences)

TFT Ally is an Overwolf desktop companion for Teamfight Tactics: meta guides, match history, and a toggleable overlay. It uses Riot’s **public** TFT and related APIs only; the Riot API key stays on **Supabase Edge Functions**, never in the client.

### Longer “what does your product do?” (paste or trim)

TFT Ally helps TFT players learn the meta and review performance using data from Riot’s official APIs. Players can browse composition tiers, item recipes, unit and augment references, search summoners for match history, and optionally look up whether a summoner is in an active TFT/League game (spectator API). The Windows app is built with React and TypeScript on Overwolf. All Riot HTTP calls go through **serverless Supabase Edge Functions**; the distributed app only holds the Supabase project URL and anon key. Rate limiting (about 20 requests/second per region) and caching reduce load on Riot’s services. The product does not automate gameplay, modify game files, or expose non-public game state.

### How is the API key used? (security — emphasize this)

The **production Riot API key exists only as a Supabase secret** (`RIOT_API_KEY`). Each Edge Function reads that secret server-side and calls Riot’s HTTPS APIs. The Overwolf/web client **never** receives the Riot key. Shipped builds must **not** set `VITE_ALLOW_CLIENT_RIOT_KEY`; that flag exists only for local development with a personal key in `localStorage`.

### User flows reviewers can verify

1. Open app → Settings → About: Riot attribution and links to Privacy / Terms / policies.
2. Match history → search by summoner + region → list loads from Edge Functions.
3. Optional: “In game” / spectator flow → when the player is not in a game, the backend returns no active game (not a generic failure).

### Riot HTTP APIs used (via Edge Functions)

| Edge function | Riot endpoints (conceptually) |
|---------------|-------------------------------|
| `tft-summoner` | Account v1 by Riot ID; TFT Summoner v1 by PUUID |
| `tft-player-card` | Same as summoner path for card display |
| `tft-league` | TFT League v1 by PUUID |
| `tft-match-ids` | TFT Match v1 match IDs by PUUID |
| `tft-match-detail` | TFT Match v1 match by ID |
| `tft-match-history` | TFT Summoner v1 by name; Match v1 IDs + match detail (batched) |
| `tft-status` | TFT Status v1 platform data |
| `tft-spectator` | League Spectator v5 active game by PUUID (404 → no game) |

### Monetization (if the form asks)

None at initial release; future cosmetic-only options would not gate core features.

### What to attach (if the portal allows uploads)

- Screenshot: desktop home or match history with real data.
- Screenshot: Settings → About showing attribution + policy links.
- Icon from `public/` / Overwolf assets as required.

---

## Pre-submission checklist (Riot + Overwolf)

1. **Production builds** — Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Do **not** set `VITE_ALLOW_CLIENT_RIOT_KEY` in any build you ship. The app must call Riot only via Supabase Edge Functions with `RIOT_API_KEY` stored as a Supabase secret.
2. **Supabase** — Deploy all TFT edge functions; verify `RIOT_API_KEY` is set (`supabase secrets list`). Smoke-test summoner, match IDs, and match detail from the desktop app.
3. **Public site (Riot production key)** — Host **landing** (`index.html`), **Privacy** (`privacy.html`), and **Terms** (`terms.html`) on GitHub Pages or your domain. Riot expects a product site with both policies, not only a GitHub repo. Optional env: `VITE_PRIVACY_POLICY_URL`, `VITE_TERMS_OF_SERVICE_URL` for absolute URLs in the app. Overwolf store: paste the same policy URLs.
4. **Attribution** — Keep “TFT Ally isn’t endorsed by Riot” language where required (store page / about), per Riot developer policies.
5. **Product registration** — Submit for a **production** API key only after the app only uses the key server-side; attach screenshots and the architecture blurb above.

### Store / listing attribution (paste as-is)

> **TFT Ally** isn't endorsed by Riot Games and doesn't reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties. Riot Games, and all associated properties are trademarks or registered trademarks of Riot Games, Inc.

*(Same block appears in-app under Settings → About and on the static landing page.)*
