## 2025-05-15 - Memoization of Heavy UI Cards
**Learning:** Even when documentation or memory suggests components are memoized, they might not be in the actual source code. Heavy components like `CompCard` and `StatCard` that are rendered in lists (e.g., in `Dashboard.tsx`) cause significant performance degradation during state updates (like typing in a search box) if not wrapped in `React.memo`. Furthermore, `React.memo` is only effective if all props, including event handlers, maintain stable references using `useCallback`.
**Action:** Always verify memoization in the source code for list items. When applying `React.memo`, ensure parent components use `useCallback` for all passed functions.

## 2025-05-20 - Map Lookups for Match History Aggregation
**Learning:** In match history processing, $O(N)$ array searches using `.find()` inside match/unit loops create significant performance bottlenecks even with moderately sized rosters (~60 units). Replacing these with $O(1)$ Map lookups reduced aggregation time by ~60% (from ~280ms to ~115ms for 100 matches).
**Action:** Use Map-based lookups for any roster-wide searches performed within loops over match history or unit lists.
