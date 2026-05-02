---
name: TFT Ally
description: Overwolf overlay for Teamfight Tactics – dark, tactical HUD.
colors:
  primary: "#00d4ff"          # Vivid Cyan – accent for primary actions
  primary-dark: "#0099cc"    # Darker shade used on hover/pressed states
  primary-light: "#33e0ff"   # Lighter accent for glows and highlights
  neutral-bg: "#181818"    # Deep Charcoal – page background
  neutral-surface: "#1f1f1f" # Dark Card – panels and containers
  text: "#ffffff"          # Pure White – primary text
  text-dim: "#e0e0e0"      # Dim White – secondary text
  muted: "#a1a1a1"          # Muted Gray – hint text and borders
  border: "#2a2a2a"        # Dark Border – subtle dividers
  border-bright: "#35c3e7" # Bright Border – active border states
  hover: "#252525"          # Hover Dark – card hover background
  success: "#10b981"        # Success Green – success states
  warning: "#f59e0b"        # Warning Amber – caution states
  error: "#ef4444"          # Error Red – error states
typography:
  display:
    fontFamily: "Rajdhani, sans-serif"
    fontWeight: 700
    fontSize: "clamp(1.5rem, 4vw, 2.5rem)"
    lineHeight: 1.2
    letterSpacing: "0.02em"
  body:
    fontFamily: "Inter, sans-serif"
    fontWeight: 400
    fontSize: "clamp(0.875rem, 1.2vw, 1rem)"
    lineHeight: 1.5
    letterSpacing: "0"
rounded:
  sm: "12px"   # card radius
  md: "9999px" # pill radius (full rounding)
---

# Design System: TFT Ally

## 1. Overview

**Creative North Star: "The Tactical Command Center"**

The UI is built for quick, glanceable information during fast‑paced games. It embraces a dark, high‑contrast backdrop to keep the focus on critical data while using a vivid cyan accent to highlight actions and important states. The design rejects glassmorphism, gradient text, and heavy decorative borders, preferring a clean, functional aesthetic that feels like a professional command console.

**Key Characteristics:**
- Dark, low‑light background for reduced eye strain.
- Vivid cyan accent limited to ≤10% of any screen.
- Sharp, angular shapes with modest rounding for panels.
- Clear hierarchy via size and weight, no unnecessary ornamentation.

## 2. Colors

The palette is deliberately restrained: a deep charcoal background with bright cyan accents. Neutral tones support readability, while success, warning, and error colors provide clear status signals.

### Primary
- **Vivid Cyan** (#00d4ff): Used for primary buttons, highlights, and interactive elements.
- **Dark Cyan** (#0099cc): Hover/pressed states for primary controls.
- **Light Cyan** (#33e0ff): Subtle glows and focus outlines.

### Neutral
- **Deep Charcoal** (#181818): Page background.
- **Dark Card** (#1f1f1f): Panel and container surfaces.
- **Pure White** (#ffffff): Primary text.
- **Dim White** (#e0e0e0): Secondary text, placeholders.
- **Muted Gray** (#a1a1a1): Hint text, disabled state.
- **Dark Border** (#2a2a2a): Subtle dividers.
- **Bright Border** (#35c3e7): Active border for focused elements.

### Status
- **Success Green** (#10b981)
- **Warning Amber** (#f59e0b)
- **Error Red** (#ef4444)

## 3. Typography

**Display Font:** Rajdhani – geometric, high‑contrast, suited for headings and HUD titles.
**Body Font:** Inter – clean, highly readable for UI text.

### Hierarchy
- **Display** (weight 700, clamp(1.5rem,4vw,2.5rem)): Used for large titles and section headers.
- **Body** (weight 400, clamp(0.875rem,1.2vw,1rem)): Default UI copy and details.

## 4. Elevation

The design uses subtle shadows only on interactive elements (buttons) to convey depth; most surfaces rely on tonal contrast rather than heavy elevation. This maintains a flat, focus‑friendly layout.

### Shadow Vocabulary
- **Accent Shadow** (`0 0 12px rgba(0, 212, 255, 0.25)`): Applied to primary buttons on hover.
- **Card Shadow** (`0 2px 8px rgba(0, 0, 0, 0.4)`): Used for floating panels.

## 5. Components

### Buttons
- **Shape:** Rounded corners (`12px`).
- **Primary:** Background `{colors.primary}`; text `{colors.text}`; padding `16px 48px`; hover background `{colors.primary-dark}` with accent shadow.
- **Ghost:** Transparent background; border `{colors.border-bright}`; text `{colors.text}`.

### Cards / Containers
- **Corner Style:** `12px` radius.
- **Background:** `{colors.neutral-surface}`.
- **Shadow:** Card shadow as defined.
- **Border:** Optional `{colors.border}`.

### Inputs / Fields
- **Background:** `{colors.neutral-bg}`.
- **Text:** `{colors.text}`.
- **Border:** `{colors.border}`; focus outline `{colors.primary}`.

## 6. Do's and Don'ts

### Do:
- **Do** use the primary accent (`#00d4ff`) sparingly – no more than 10% of visible UI.
- **Do** keep text on a high‑contrast surface (white on dark backgrounds).
- **Do** reserve the bright border (`#35c3e7`) for focused elements only.

### Don't:
- **Don't** use gradient text or large colored sidebars.
- **Don't** add border‑left accent stripes greater than 1px.
- **Don't** employ glassmorphism or heavy translucency effects.
- **Don't** rely on drop shadows for primary hierarchy; use size and weight instead.
