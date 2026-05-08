# Ally Coach v2 — SaaS-Level TFT Intelligence Platform Master Plan

> \*\*FOR CLAUDE CODE / AGENTIC WORKERS\*\*
>
> REQUIRED WORKFLOW:
>
> - Use subagent-driven execution.
> - Every task must be implemented incrementally.
> - Every feature must include:
>   - tests
>   - telemetry hooks
>   - performance instrumentation
>   - typed contracts
>   - error boundaries
> - NEVER implement massive features in one step.
> - ALWAYS commit after each completed milestone.
> - ALWAYS benchmark OCR/inference latency.
> - ALWAYS validate overlay FPS after UI changes.
> - ALWAYS optimize for production-grade maintainability.
>
> Recommended Claude Code MCP stack:
>
> - Serena MCP
> - Context7 MCP
> - Sequential Thinking MCP
> - Playwright MCP
> - Supabase MCP
> - filesystem MCP
> - git MCP
> - terminal MCP
> - postgres MCP
> - browser MCP

\---

# Product Vision

Build a production-grade TFT coaching platform comparable to:

* Mobalytics TFT Companion
* Blitz TFT Overlay
* MetaTFT Desktop App

But optimized around:

* real-time strategic coaching
* board-aware intelligence
* dynamic pivoting
* live opponent scouting
* adaptive recommendations
* low-latency overlays
* AI-assisted development workflows

The application must function as:

```txt
A live strategic co-pilot for TFT.
```

NOT:

* a static tier list website
* a simple comp helper
* a passive stats viewer

The system must:

1. Reconstruct game state in real time.
2. Infer strategic context.
3. Generate adaptive recommendations.
4. Continuously react to gameplay changes.
5. Learn from telemetry and replay data.

\---

# Core Architecture

```txt
Desktop Runtime
│
├── Overlay Layer
├── OCR / CV Engine
├── Event Bus
├── Game State Reconstruction
├── Strategic Intelligence Engine
├── Recommendation Engine
├── Telemetry Layer
├── Replay Storage
└── Local Cache
```

Backend:

```txt
Supabase
├── Auth
├── Match Storage
├── Replay Storage
├── Meta Data
├── Telemetry
└── Edge Functions

Redis
├── Recommendation Cache
├── Meta Cache
└── Worker Queues
```

\---

# Recommended Tech Stack

## Frontend

```txt
React
TypeScript
Vite
TailwindCSS
shadcn/ui
Framer Motion
TanStack Query
Zustand
```

\---

## Desktop Runtime

### Primary Runtime

```txt
Overwolf
```

### Why Overwolf

* native game overlay ecosystem
* TFT companion ecosystem compatibility
* easier game-window integration
* faster MVP delivery
* built-in overlay tooling
* lower anti-cheat risk profile
* established player expectations

### Long-Term Strategy

Optimize aggressively within the Overwolf ecosystem before considering any custom runtime migration.

\---

## Overlay System

```txt
Overwolf overlay APIs
transparent click-through windows
GPU accelerated rendering
```

\---

## OCR / Computer Vision

```txt
OpenCV
ONNX Runtime
Tesseract.js (prototype only)
sharp
screenshot-desktop
```

\---

## Backend

```txt
Supabase
Postgres
Redis
Edge Functions
```

\---

## Observability

```txt
PostHog
Sentry
OpenTelemetry
```

\---

# Recommended Repository Structure

```txt
apps/
├── desktop/
├── overlay/
└── backend/

packages/
├── shared-types/
├── ui/
├── vision-core/
├── recommendation-engine/
└── telemetry/

src/
├── app/
├── components/
├── overlay/
├── services/
├── vision/
├── engine/
├── integrations/
├── telemetry/
├── workers/
├── hooks/
├── stores/
├── lib/
└── tests/
```

\---

# Development Standards

## Global Rules

* Strict TypeScript mode enabled.
* No `any` types allowed.
* All services must be isolated.
* All recommendation outputs must include confidence scoring.
* All OCR parsing must include confidence values.
* Every overlay module must be independently toggleable.
* Every feature must include telemetry instrumentation.
* Every system must support patch version isolation.

\---

## Coding Rules

### Every service must:

* be stateless when possible
* expose typed interfaces
* include unit tests
* include performance benchmarks
* include failure handling

### Every OCR parser must:

* expose confidence scores
* support temporal smoothing
* support frame averaging
* handle partial failures gracefully

### Every recommendation engine must:

* explain reasoning
* expose confidence
* expose risk level
* support replay debugging

\---

# OVERWOLF ARCHITECTURE PRINCIPLES

## Core Runtime Philosophy

The application is built natively around the Overwolf platform.

DO NOT:

* migrate to Overwolf
* introduce competing desktop runtimes
* split runtime architectures
* duplicate overlay systems unnecessarily

The focus must be:

```txt
Maximum performance and stability within the Overwolf ecosystem.
```

\---

## Overwolf System Design

### Core Systems

```txt
Overwolf Runtime
│
├── React Frontend
├── Overlay Windows
├── Background Services
├── OCR Workers
├── Recommendation Engine
├── Telemetry Layer
└── Replay Systems
```

\---

## Overwolf Window Strategy

### In-Game Overlay Window

Responsibilities:

* live recommendations
* scouting overlays
* positioning alerts
* compact strategic guidance

\---

### Desktop Window

Responsibilities:

* replay analysis
* onboarding
* settings
* telemetry review
* profile systems

\---

### Background Controller Window

Responsibilities:

* OCR orchestration
* event pipelines
* recommendation scheduling
* telemetry batching

\---

## Overwolf Performance Rules

### Minimize Chromium Overhead

Rules:

* aggressively virtualize UI
* avoid unnecessary rerenders
* isolate OCR workers
* batch overlay updates
* throttle animation systems

\---

## Overwolf Optimization Targets

### CPU

```txt
<5% average CPU usage
```

### Memory

```txt
<350MB RAM usage
```

### Overlay Responsiveness

```txt
<16ms overlay update time
```

\---

# PHASE 1 — Desktop Infrastructure Foundation

## Goal

Create the desktop runtime and overlay system.

\---

## Task 1 — Create Overwolf Application Runtime

### Requirements

* hardware acceleration
* auto updates
* tray support
* crash recovery
* startup optimization
* multi-monitor support

### Folder

```txt
apps/desktop/
```

### Deliverables

* Overwolf application shell
* Overwolf window architecture
* IPC layer
* secure context isolation
* Overwolf lifecycle integration

### Tests

* startup tests
* IPC tests
* crash recovery tests

### Commit

```bash
git commit -m "feat: initialize desktop runtime"
```

\---

## Task 2 — Create Overlay Rendering System

### Requirements

* transparent overlay
* click-through support
* always-on-top behavior
* game window anchoring
* overlay repositioning
* DPI scaling support

### Libraries

```txt
electron-overlay-window
```

### Deliverables

```txt
src/overlay/
```

Components:

* OverlayWindowManager
* OverlayRenderer
* PositionTracker
* ResolutionManager

### Tests

* overlay rendering tests
* focus behavior tests
* resize tests
* FPS benchmarking

### Performance Targets

```txt
60 FPS minimum
```

\---

## Task 3 — Create Event Bus Architecture

### Install

```bash
npm install rxjs
```

### Architecture

```txt
Capture Events
→ OCR Events
→ State Events
→ Recommendation Events
→ UI Events
```

### Deliverables

```txt
src/engine/events/
```

Modules:

* eventBus.ts
* eventRegistry.ts
* eventReplay.ts
* telemetryBridge.ts

### Tests

* event throughput
* event ordering
* replay consistency

\---

## Task 4 — Shared Types Package

### Deliverables

```txt
packages/shared-types/
```

Core Types:

* GameState
* BoardState
* ShopState
* Recommendation
* UnitData
* ItemData
* AugmentData
* OpponentBoard
* EconState

### Rules

* all systems must consume shared contracts
* no duplicated interfaces

\---

# PHASE 2 — Riot + LCU Integration

## Goal

Integrate directly with the League client.

\---

## Task 1 — LCU Authentication Layer

### Deliverables

```txt
src/integrations/lcu/
```

Files:

* auth.ts
* websocket.ts
* lockfile.ts
* gameflow.ts
* session.ts

### Responsibilities

* lockfile detection
* websocket authentication
* game session tracking
* reconnect handling

### Tests

* auth reconnect tests
* websocket lifecycle tests

\---

## Task 2 — Match Tracking System

### Track

* lobby creation
* queue entry
* loading screen
* active match
* post-game state

### Deliverables

```txt
src/integrations/gameflow/
```

\---

## Task 3 — Riot Match API Integration

### Responsibilities

* historical match retrieval
* placement tracking
* augment statistics
* comp statistics
* player progression

### Cache Layer

Use Redis caching aggressively.

### Tests

* rate-limit handling
* cache consistency
* replay synchronization

\---

# PHASE 3 — OCR + COMPUTER VISION ENGINE

## Goal

Reconstruct the game state from live gameplay.

THIS IS THE MOST IMPORTANT PHASE.

\---

## Task 1 — Screen Capture Pipeline

### Deliverables

```txt
src/vision/capture/
```

Features:

* monitor targeting
* GPU acceleration
* game-window detection
* frame throttling
* dynamic resolution handling

### Performance Targets

```txt
Capture latency < 20ms
```

\---

## Task 2 — Board Detection Engine

### Detect

* units
* star levels
* board positions
* active traits

### Deliverables

```txt
src/vision/board/
```

### Outputs

```ts
confidence: number
```

### Tests

* screenshot snapshot tests
* partial occlusion tests
* confidence stability tests

\---

## Task 3 — Shop Detection Engine

### Detect

* shop champions
* costs
* rerolls
* chosen mechanics (future-proof)

### Deliverables

```txt
src/vision/shop/
```

\---

## Task 4 — Item Detection Engine

### Detect

* item components
* completed items
* anvils
* removers
* support items

### Deliverables

```txt
src/vision/items/
```

\---

## Task 5 — Augment Detection Engine

### Detect

* augment options
* augment rarity
* selected augment

### Deliverables

```txt
src/vision/augments/
```

\---

## Task 6 — Economy Parsing

### Parse

* gold
* XP
* level
* HP
* streaks
* round stage

### Deliverables

```txt
src/vision/economy/
```

\---

## OCR Validation Requirements

### Golden Snapshot Testing

```txt
screenshots
→ parsed output
→ expected state
```

### Failure Tracking

Track:

* OCR confidence
* parse instability
* dropped frames
* resolution mismatch

\---

# PHASE 4 — GAME STATE RECONSTRUCTION ENGINE

## Goal

Transform raw OCR data into strategic understanding.

\---

## Task 1 — GameState Engine

### Architecture

```txt
Raw OCR
→ normalization
→ confidence filtering
→ temporal smoothing
→ strategic context
```

### Deliverables

```txt
src/engine/gamestate/
```

\---

## Task 2 — Confidence System

### Requirements

Every parsed entity:

```ts
confidence: number
```

Every recommendation:

```ts
risk: 'low' | 'medium' | 'high'
```

\---

## Task 3 — Temporal Smoothing

### Prevent

* recommendation flickering
* OCR instability
* false transitions

### Techniques

* frame consensus
* weighted averaging
* debounce windows

\---

## Task 4 — Replay Serialization

### Store

* board transitions
* econ transitions
* augment timing
* rolldown windows

### Deliverables

```txt
src/engine/replay/
```

\---

# PHASE 5 — STRATEGIC INTELLIGENCE ENGINE

## Goal

Generate adaptive coaching recommendations.

\---

# Subsystem 1 — Comp Detection Engine

## Requirements

DO NOT use naive comp matching.

Use weighted strategic scoring.

### Scoring Inputs

```txt
unitWeight
traitWeight
augmentWeight
itemWeight
tempoWeight
contestWeight
```

### Deliverables

```txt
src/engine/comp-detection/
```

### Outputs

* current comp
* pivot candidates
* comp confidence
* contested score

\---

# Subsystem 2 — Economy Engine

## Support

* reroll comps
* fast-8
* fast-9
* donkey rolling
* stabilization windows
* econ breakpoints

### Deliverables

```txt
src/engine/economy/
```

\---

# Subsystem 3 — Itemization Engine

## Recommend

* slam timing
* BIS alternatives
* flexible item paths
* anti-contest itemization

### Deliverables

```txt
src/engine/itemization/
```

\---

# Subsystem 4 — Pivot Engine

## Detect

* contested lines
* failed rerolls
* low-roll scenarios
* weak transitions

## Recommend

* alternate carries
* emergency pivots
* stabilization paths

### Deliverables

```txt
src/engine/pivot/
```

\---

# Subsystem 5 — Opponent Scout Engine

## Track

* enemy boards
* positioning
* contest frequency
* damage spikes
* carry threats

### Deliverables

```txt
src/engine/scouting/
```

\---

# Subsystem 6 — Augment Intelligence Engine

## Rank augments by

* current board
* econ state
* carry trajectory
* placement probability
* trait synergy

### Deliverables

```txt
src/engine/augments/
```

\---

# PHASE 6 — RECOMMENDATION ENGINE

## Goal

Generate contextual recommendations.

\---

## Recommendation Rules

Every recommendation must include:

```ts
{
  confidence: number,
  risk: 'low' | 'medium' | 'high',
  reasoning: string,
  urgency: 'low' | 'medium' | 'high'
}
```

\---

## Recommendation Categories

### Economy

* level now
* save
* rolldown
* stabilize

### Board

* positioning
* frontline changes
* carry swaps

### Items

* slam now
* hold components
* pivot itemization

### Augments

* best augment
* safest augment
* greed augment

### Scouting

* contested warnings
* positioning alerts
* threat predictions

\---

# PHASE 6.1 — CONTEXTUAL RECOMMENDATION PRIORITIZATION

## Goal

Prevent recommendation overload and maximize strategic clarity.

\---

## Recommendation Priority Engine

Every recommendation must be ranked by:

```txt
urgency
confidence
expected impact
execution difficulty
player state
```

\---

## Priority Categories

### Critical

Examples:

* rolldown now
* pivot immediately
* reposition carry
* slam item now

Display:

* large overlay card
* optional sound cue
* persistent until resolved

\---

### Important

Examples:

* scout contested player
* hold econ breakpoint
* prep transition

Display:

* side overlay
* compact notification

\---

### Informational

Examples:

* future pivot path
* optional itemization
* low-confidence branch

Display:

* expandable recommendations

\---

## Recommendation Cooldown System

Prevent:

* recommendation spam
* UI flickering
* contradictory advice

Use:

```txt
Overwolf packaging
semantic-release
```

```

---

# MONETIZATION PLAN

## Free Tier

- basic overlays
- comp detection
- item recommendations
- econ suggestions

---

## Premium Tier

- scouting intelligence
- advanced pivots
- replay analysis
- AI explanations
- personalized coaching
- placement analytics

---

# DEPLOYMENT ARCHITECTURE

## Desktop Distribution

```txt
Overwolf app distribution
CDN asset delivery
delta patching
```

\---

## Backend Deployment

```txt
Supabase
Redis
Cloudflare
Edge Functions
```

\---

# RECOMMENDED BUILD ORDER

## DO NOT START WITH RECOMMENDATION LOGIC.

Start with:

1. Desktop shell
2. Overlay rendering
3. OCR pipeline
4. Game-state reconstruction
5. Strategic engine
6. Recommendation engine
7. Meta ingestion
8. ML enhancements

\---

# CRITICAL ENGINEERING INSIGHT

```txt
TFT overlays are not frontend problems.
They are inference-engine problems.
```

Most competitors fail because:

* OCR is unstable
* game-state reconstruction is weak
* recommendations are static
* overlays become noisy
* performance degrades under load

Your moat becomes:

```txt
better game-state understanding
+
better strategic adaptation
+
lower latency
+
continuous learning
```

That is what transforms this project from:

```txt
another TFT helper
```

into:

```txt
a real competitive intelligence platform
```

\---

# FINAL EXECUTION RULES FOR CLAUDE CODE

## Mandatory Workflow

### Every task must:

1. Define interfaces first.
2. Write failing tests.
3. Implement minimal working logic.
4. Benchmark performance.
5. Add telemetry.
6. Add error handling.
7. Commit changes.

\---

## Commit Convention

```bash
feat:
fix:
perf:
refactor:
test:
infra:
```

\---

## Performance Rule

Never merge:

* OCR regressions
* FPS regressions
* memory regressions
* recommendation latency regressions

\---

## Strategic Goal

Build:

```txt
A real-time adaptive TFT intelligence system.
```

NOT:

```txt
A static stats overlay.
```

\---

# CLAUDE CODE EXECUTION PLAYBOOK

## Global Agent Rules

### NEVER

* generate massive unreviewed files
* implement multiple architectural systems simultaneously
* skip tests
* skip telemetry
* skip performance validation
* tightly couple overlay and inference logic
* hardcode patch data globally
* mix UI logic with strategic logic

\---

## ALWAYS

* isolate systems into modules
* expose typed interfaces first
* write snapshot tests for OCR
* benchmark every inference system
* use feature flags for risky systems
* implement replay debugging hooks
* keep recommendation logic deterministic where possible

\---

# SUBAGENT STRATEGY

## Recommended Claude Subagents

### Agent 1 — Desktop Runtime Agent

Responsibilities:

* Overwolf shell
* overlay lifecycle
* IPC
* updater system
* crash recovery

\---

### Agent 2 — OCR / Vision Agent

Responsibilities:

* OpenCV pipelines
* ONNX inference
* screenshot parsing
* frame smoothing
* confidence systems

\---

### Agent 3 — Strategic Engine Agent

Responsibilities:

* comp detection
* economy engine
* augment scoring
* scouting logic
* pivot systems

\---

### Agent 4 — Frontend / Overlay Agent

Responsibilities:

* overlay UI
* animations
* responsiveness
* accessibility
* recommendation rendering

\---

### Agent 5 — Backend / Infra Agent

Responsibilities:

* Supabase schema
* replay storage
* telemetry ingestion
* Redis workers
* edge functions

\---

### Agent 6 — QA / Benchmark Agent

Responsibilities:

* replay testing
* OCR snapshot validation
* FPS benchmarking
* regression tracking
* memory profiling

\---

# RECOMMENDED DAILY EXECUTION LOOP

## Morning

### 1\. Pull latest replay telemetry

Analyze:

* OCR failures
* recommendation mismatches
* FPS drops
* crash reports

\---

### 2\. Run benchmark suite

Validate:

* overlay FPS
* OCR latency
* memory usage
* event throughput

\---

### 3\. Prioritize bottlenecks

Always prioritize:

1. OCR accuracy
2. game-state consistency
3. recommendation quality
4. performance stability
5. UX polish

\---

## Development Cycle

### Required order for every feature:

1. define interfaces
2. write failing tests
3. implement minimal version
4. benchmark performance
5. instrument telemetry
6. review architecture
7. commit

\---

# CLAUDE PROMPTING STANDARDS

## Architecture Prompt Template

```txt
You are a senior systems architect.

Requirements:
- optimize for maintainability
- optimize for modularity
- optimize for low latency
- optimize for replay debugging
- use strict TypeScript
- avoid overengineering
- expose typed interfaces
- include tests
- include telemetry
- include performance instrumentation

Output:
1. architecture overview
2. interfaces
3. folder structure
4. implementation steps
5. tests
6. benchmarks
7. failure handling
```

\---

## Feature Prompt Template

```txt
Implement this feature incrementally.

Requirements:
- strict TypeScript
- no any types
- isolated modules
- unit tests
- telemetry hooks
- replay-safe architecture
- performance instrumentation
- production-ready error handling

Workflow:
1. define interfaces
2. write tests
3. implement minimal feature
4. benchmark
5. document tradeoffs
6. generate commit message
```

\---

## OCR Prompt Template

```txt
Build a production-grade OCR parsing module.

Requirements:
- confidence scoring
- temporal smoothing
- frame averaging
- partial failure handling
- snapshot tests
- benchmark suite
- GPU optimization where possible

Output:
- architecture
- parser implementation
- benchmark tests
- replay validation
- telemetry instrumentation
```

\---

## Recommendation Engine Prompt Template

```txt
Build a strategic recommendation engine for TFT.

Requirements:
- contextual recommendations
- confidence scoring
- risk assessment
- replay-safe outputs
- deterministic logic where possible
- explainable reasoning
- low latency

Include:
- interfaces
- scoring system
- unit tests
- simulation tests
- benchmark suite
```

\---

# DATABASE DESIGN

# Core Tables

## users

```txt
id
riot\_puuid
subscription\_tier
settings
created\_at
```

\---

## matches

```txt
id
user\_id
placement
patch\_version
match\_data
created\_at
```

\---

## replays

```txt
id
match\_id
frame\_data
recommendations
timeline
```

\---

## telemetry\_events

```txt
id
event\_type
payload
timestamp
```

\---

## recommendation\_feedback

```txt
id
recommendation\_id
accepted
ignored
match\_outcome
```

\---

# FEATURE FLAGS SYSTEM

## Requirements

Every major system must support:

* feature toggles
* A/B testing
* staged rollouts
* rollback support

\---

## Feature Flag Categories

### OCR

* advanced parsing
* GPU inference
* temporal smoothing

### Recommendations

* pivot engine
* scouting engine
* augment scoring

### Overlay

* expanded overlay
* animation system
* smart timing system

\---

# REPLAY DEBUGGING SYSTEM

## Goal

Every recommendation must be reproducible.

\---

## Requirements

Store:

* OCR outputs
* confidence values
* game states
* recommendation reasoning
* recommendation timing

\---

## Replay Viewer

Build:

```txt
Internal developer replay debugger
```

Capabilities:

* frame stepping
* recommendation inspection
* OCR confidence overlays
* event timeline playback

\---

# LONG-TERM MOAT STRATEGY

## The Competitive Advantage

Most TFT tools rely on:

* static statistics
* low-context recommendations
* simplistic overlays

The long-term moat is:

```txt
better inference
+
better adaptation
+
better telemetry
+
better replay learning
```

\---

# FINAL PRODUCT PRINCIPLES

## Principle 1

Recommendations must adapt dynamically.

\---

## Principle 2

Overlay clutter destroys usability.

\---

## Principle 3

Confidence systems are mandatory.

\---

## Principle 4

Performance is a feature.

\---

## Principle 5

Replay-driven improvement creates compounding value.

\---

# PHASE 7 — ADVANCED OVERLAY UX SYSTEM

## Goal

Create a low-clutter, high-information overlay experience.

\---

## Overlay Design Philosophy

The overlay must:

* minimize cognitive load
* avoid blocking gameplay
* adapt to game phase
* prioritize urgency
* remain readable under stress

\---

## Overlay Modes

### Minimal Mode

Display only:

* current comp
* econ recommendation
* next level timing
* strongest item slam

\---

### Competitive Mode

Display:

* scouting panel
* contest tracker
* positioning alerts
* pivot opportunities
* augment evaluations

\---

### Coach Mode

Display:

* strategic reasoning
* explanation panels
* recommendation confidence
* future transition planning

\---

## Overlay Rendering Rules

### Frame Budget

```txt
<4ms render budget
```

### Requirements

* GPU accelerated rendering
* adaptive redraw frequency
* animation throttling
* background blur optimization

\---

## Overlay Interaction System

### Features

* hotkey expansion
* draggable modules
* persistent layouts
* contextual hiding
* smart collapse behavior

\---

# PHASE 8 — META INGESTION + DATA PIPELINE

## Goal

Continuously update strategic intelligence from live TFT ecosystem data.

\---

## Data Sources

### Primary

* Riot APIs
* public match datasets
* high-ELO replay ingestion

\---

### Secondary

* MetaTFT trends
* tactics.tools trends
* community statistics

\---

## Worker Architecture

```txt
Ingestion Workers
→ Normalization
→ Patch Isolation
→ Statistical Analysis
→ Recommendation Cache
```

\---

## Meta Processing Systems

### Comp Tiering

Compute:

* average placement
* top-4 rate
* win rate
* pick frequency
* contest frequency

\---

### Item Analytics

Track:

* slam success
* BIS frequency
* flexible alternatives
* item volatility

\---

### Augment Analytics

Track:

* augment synergy
* augment placement curves
* comp compatibility
* econ impact

\---

## Deliverables

```txt
workers/meta/
workers/analytics/
workers/cache/
```

\---

# PHASE 9 — TELEMETRY + LEARNING SYSTEMS

## Goal

Use real-world usage data to continuously improve recommendations.

\---

## Telemetry Events

### Overlay Usage

Track:

* overlay interactions
* panel expansion
* ignored recommendations
* dismissed alerts

\---

### Strategic Decisions

Track:

* accepted pivots
* leveling timing
* item slam timing
* augment choices

\---

### Match Outcomes

Track:

* placement
* econ curve
* HP curve
* transition success
* scouting effectiveness

\---

## Recommendation Evaluation Engine

Measure:

* recommendation accuracy
* recommendation usefulness
* confidence reliability
* recommendation timing quality

\---

## Telemetry Dashboard

Internal developer dashboard showing:

* OCR failure heatmaps
* recommendation success rates
* crash analytics
* FPS regressions
* memory regressions

\---

# PHASE 10 — REPLAY + ANALYSIS PLATFORM

## Goal

Create a replay-driven learning and debugging ecosystem.

\---

## Replay Recording System

Store:

* board states
* OCR outputs
* recommendations
* confidence values
* event streams
* player actions

\---

## Replay Viewer

### Features

* frame stepping
* timeline scrubbing
* recommendation inspection
* OCR confidence overlays
* strategic explanation panels

\---

## Replay Analysis Engine

Automatically identify:

* missed pivots
* econ mistakes
* positioning errors
* inefficient itemization
* scouting failures

\---

## Future Premium Feature

```txt
AI-powered post-game coaching reports
```

\---

# PHASE 11 — AI / ML ENHANCEMENT LAYER

## Goal

Transition from heuristics into adaptive predictive systems.

\---

## ML System 1 — Recommendation Ranking

Train models using:

* replay datasets
* recommendation outcomes
* placement correlations
* board states

\---

## ML System 2 — Pivot Prediction

Predict:

* failed comps
* unstable econ paths
* high-contest risks
* strongest recovery paths

\---

## ML System 3 — Positioning Intelligence

Predict:

* assassin targeting
* Zephyr targets
* carry collapse probability
* frontline survival

\---

## ML System 4 — Outcome Simulation

Estimate:

* expected placement
* top-4 probability
* combat win chance
* expected HP loss

\---

# PHASE 12 — PERFORMANCE OPTIMIZATION

## Goal

Achieve production-grade efficiency.

\---

## Performance Targets

### CPU Usage

```txt
<5% average CPU
```

### Memory Usage

```txt
<400MB RAM
```

### OCR Latency

```txt
<100ms recommendation latency
```

### Overlay FPS

```txt
60 FPS sustained
```

\---

## Optimization Systems

### OCR Optimization

* worker-thread parsing
* GPU inference
* frame skipping
* incremental parsing

\---

### Overlay Optimization

* adaptive rendering
* virtualized panels
* animation throttling
* texture caching

\---

### Backend Optimization

* Redis caching
* replay compression
* edge processing
* telemetry batching

\---

# PHASE 13 — SECURITY + ANTI-CHEAT SAFETY

## Goal

Minimize anti-cheat risk and maintain platform integrity.

\---

## Principles

The app must:

* remain read-only
* never automate gameplay
* never inject gameplay actions
* fully comply with Overwolf app policies
* avoid memory editing
* avoid gameplay automation
* avoid unauthorized hooks

\---

## Safe Integration Strategy

Use:

* OCR
* overlays
* Riot-approved APIs
* LCU state tracking

Avoid:

* memory scanning
* DLL injection
* packet manipulation
* automation systems

\---

## Security Systems

### Overwolf Security

* context isolation
* sandboxing
* secure IPC validation

\---

### Backend Security

* encrypted replay storage
* RLS policies
* API isolation
* telemetry anonymization

\---

# PHASE 14 — CI/CD + RELEASE ENGINEERING

## Goal

Build enterprise-grade deployment workflows.

\---

## CI Pipelines

### Validate

* linting
* type safety
* unit tests
* OCR snapshot tests
* integration tests
* performance benchmarks

\---

## Release Pipelines

### Desktop Releases

Use:

```txt
electron-builder
semantic-release
```

Capabilities:

* delta patching
* staged rollout
* rollback support
* crash rollback

\---

## Deployment Targets

### Desktop

* Windows via Overwolf ecosystem

### Backend

* Supabase
* Cloudflare
* Redis workers

\---

# PHASE 15 — MONETIZATION + GROWTH SYSTEMS

## Goal

Build scalable recurring revenue.

\---

## Free Tier

Include:

* basic overlays
* comp detection
* item recommendations
* econ suggestions

\---

## Premium Tier

Include:

* advanced scouting
* adaptive pivots
* replay analysis
* AI explanations
* personalized coaching
* advanced analytics

\---

## Creator Features

Future systems:

* shareable replay reports
* coaching exports
* stream overlay mode
* educational replay playback

\---

# PHASE 16 — LONG-TERM MOAT DEVELOPMENT

## Goal

Build defensible competitive advantages.

\---

## Primary Moats

### 1\. Better Game-State Reconstruction

Superior OCR + inference quality.

\---

### 2\. Better Strategic Adaptation

Recommendations evolve dynamically.

\---

### 3\. Replay Learning Ecosystem

Replay-driven improvement loops.

\---

### 4\. Telemetry Feedback Loops

Continuous recommendation refinement.

\---

### 5\. Low-Latency Performance

Fast overlays create trust.

\---

# FINAL EXECUTION PRIORITIES

## Priority Order

### Tier 1

* OCR stability
* game-state reconstruction
* overlay performance

\---

### Tier 2

* recommendation quality
* scouting systems
* pivot logic

\---

### Tier 3

* ML systems
* replay coaching
* advanced analytics

\---

# FINAL PRODUCT PHILOSOPHY

## Core Insight

```txt
The strongest TFT companion apps are inference engines disguised as overlays.
```

The real product is:

* game-state understanding
* strategic adaptation
* low-latency intelligence
* replay-driven learning

The overlay is only the delivery mechanism.

\---

# END OF MASTER PLAN

