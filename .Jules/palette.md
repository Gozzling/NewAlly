## 2025-05-15 - [Dashboard Accessibility Polish]
**Learning:** Icon-only buttons in the main navigation and top bar were missing `aria-label`, making them inaccessible to screen readers. Rolling tips also lacked `aria-live`.
**Action:** Always ensure icon-only buttons have descriptive `aria-label` and dynamic content regions use `aria-live="polite"`.
