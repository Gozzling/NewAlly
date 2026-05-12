## 2025-05-12 - [Component Memoization and Prop Stabilization]
**Learning:** In list-heavy pages (like Meta Comps), generating dynamic properties (even mock data with `Math.random()`) within the `.map()` loop during render invalidates `React.memo` and causes full re-renders of the entire list. Moving this generation into a `useMemo` block alongside the list sorting/filtering stabilizes the props and allows `React.memo` to work effectively.
**Action:** Always check if list item props are stable before adding `React.memo`. Move any per-item data transformation or random value generation into the parent's `useMemo` block that prepares the list.
>>>>>>> REPLACE
