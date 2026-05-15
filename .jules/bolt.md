## 2025-05-15 - Memoization of Heavy UI Cards
**Learning:** Even when documentation or memory suggests components are memoized, they might not be in the actual source code. Heavy components like `CompCard` and `StatCard` that are rendered in lists (e.g., in `Dashboard.tsx`) cause significant performance degradation during state updates (like typing in a search box) if not wrapped in `React.memo`. Furthermore, `React.memo` is only effective if all props, including event handlers, maintain stable references using `useCallback`.
**Action:** Always verify memoization in the source code for list items. When applying `React.memo`, ensure parent components use `useCallback` for all passed functions.

## 2025-05-23 - Map-based lookup for match history aggregation
**Learning:** Aggregating large datasets (e.g., match history with up to 2,500 entries) in TFT Ally suffers from quadratic-like complexity when performing O(N) array `.find()` calls for unit/trait metadata inside loops. This significantly blocks the main thread during Team Builder or Coach recommendations. Pre-building Map lookups at the start of aggregation reduces complexity to linear-time.
**Action:** Use Map-based lookups for any roster/metadata cross-referencing inside loops processing more than a handful of items.
