## 2025-05-15 - Memoization of Heavy UI Cards
**Learning:** Even when documentation or memory suggests components are memoized, they might not be in the actual source code. Heavy components like `CompCard` and `StatCard` that are rendered in lists (e.g., in `Dashboard.tsx`) cause significant performance degradation during state updates (like typing in a search box) if not wrapped in `React.memo`. Furthermore, `React.memo` is only effective if all props, including event handlers, maintain stable references using `useCallback`.
**Action:** Always verify memoization in the source code for list items. When applying `React.memo`, ensure parent components use `useCallback` for all passed functions.

## 2025-06-15 - (N)$ Array Searches in Nested History Loops
**Learning:** In match history aggregation, helper functions like `canonicalUnitName` and `traitCountsFromUnitNames` are often called inside loops that iterate over dozens of matches. When these helpers use `array.find()` on large rosters (champions, traits), the overall complexity becomes (M \cdot U \cdot (C + T))$, which scales poorly.
**Action:** Always pre-compute lookup Maps for static data rosters at the entry point of aggregation functions and pass them down to helpers. This reduces complexity to (M \cdot U)$ and provides a measurable speedup (~92% in this case).

## 2025-05-18 - Nested Component Recreation and O(N) Lookups in Hex Grids
**Learning:** Defining sub-components like `HexGlyph` inside a parent component's body forces recreation on every render, defeating `React.memo`. Additionally, performing (N)$ lookups like `indexOf(pos)` inside a render loop for a fixed grid is an anti-pattern when the index is already available in the mapping function.
**Action:** Always hoist sub-components to the top level and pass necessary indices or stabilized data as props. Avoid `indexOf` calls within components rendered in a list or grid.
