# Palette's UX Journal

## 2025-05-14 - Multi-stage Dismissal Pattern
**Learning:** For complex inputs like search with suggestions, users expect a hierarchical dismissal pattern. A single press of Escape should close the "transient" UI (suggestions list), while a second press should clear the "persistent" state (the input text). This prevents accidental data loss when the user only intended to close the dropdown.
**Action:** Always implement tiered Escape key logic in combobox/autocomplete components: `suggestions open ? close suggestions : value exists ? clear value : null`.
