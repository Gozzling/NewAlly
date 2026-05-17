## 2025-05-17 - [Accessibility: Icon-only Buttons & Dynamic Regions]
**Learning:** Icon-only buttons (common in HUD/Command Center designs) are invisible to screen readers without explicit `aria-label` attributes. Additionally, rotating status messages (like QuickTips) need `aria-live` and `role="status"` to be announced when they change.
**Action:** Always audit icon-only buttons for `aria-label` and ensure decorative SVGs are marked with `aria-hidden="true"`. Apply `aria-live="polite"` to rotating UI text components.
