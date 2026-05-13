## 2024-05-14 - [Boundary Violation: Environmental Changes]
**Learning:** Modifying `package.json` or adding external dependencies (like ESLint plugins) to fix environment-specific issues (e.g., failing lint in sandbox) is a boundary violation unless explicitly requested. It can also lead to massive `pnpm-lock.yaml` changes which clutter PRs.
**Action:** Stick to source code optimizations and only use existing dependencies. If a tool like `lint` fails due to environment issues, report it or work around it without changing project configuration.

## 2024-05-14 - [React Memoization & Unstable Props]
**Learning:** `React.memo` is ineffective if props are recalculated as new object literals on every render. In this codebase, "mock" or "randomized" stats were being injected during the `.map()` in JSX, breaking memoization for every single card in the list.
**Action:** Stabilize dynamic/randomized data within `useMemo` hooks before passing them to memoized components.
