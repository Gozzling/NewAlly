# Phase 1 – Desktop Runtime (Overwolf‑only, Approach A)

## Manifest (`manifest.json`)
```json
{
  "manifest_version": 1,
  "type": "WebApp",
  "id": "com.tftally.main",
  "name": "TFT Ally",
  "description": "Live strategic co‑pilot for TFT",
  "version": "1.0.0",
  "icon": "icons/icon_256.png",
  "author": "Your Company",
  "platform": "windows",
  "permissions": [
    "GameInfo",
    "FileSystem",
    "Window",
    "Network"
  ],
  "default_window": {
    "id": "desktop",
    "url": "src/windows/desktop/main.html",
    "width": 1280,
    "height": 720,
    "resizable": true,
    "transparent": false
  },
  "window": [
    {
      "id": "overlay",
      "type": "overlay",
      "url": "src/windows/overlay/main.html",
      "fullscreen": true,
      "transparent": true,
      "clickthrough": true,
      "resizable": false
    }
  ],
  "hotkeys": [
    {
      "id": "toggleOverlay",
      "description": "Show/Hide the coaching overlay",
      "key": "Ctrl+Shift+O"
    }
  ]
}
```

## Bootstrap / Entry‑point Code
### Desktop (`src/windows/desktop/main.tsx`)
```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import DesktopApp from "./DesktopApp";
import { initStore } from "@/store";

initStore(); // initialise shared Zustand store

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
root.render(<DesktopApp />);

// Launch overlay after desktop app starts
overwolf.extensions.onAppLaunchTriggered(() => {
  overwolf.windows.obtainDeclaredWindow("overlay", (result) => {
    if (result.success) {
      overwolf.windows.restore("overlay", () => {});
    }
  });
});
```

### Overlay (`src/windows/overlay/main.tsx`)
```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import OverlayApp from "./OverlayApp";
import { connectStoreToOverlay } from "@/store/overlay";

connectStoreToOverlay(); // same in‑process store instance

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
root.render(<OverlayApp />);
```

## Shared Zustand Store (`src/store/index.ts`)
```ts
import { create } from "zustand";
import { devtools } from "zustand/middleware";

export type AppState = {
  gameState: any | null; // replace with concrete type later
  overlayVisible: boolean;
  // …add other slices as needed
};

export const useAppStore = create<AppState>()(
  devtools((set, get) => ({
    gameState: null,
    overlayVisible: true,
    // reducers …
  }))
);

// Helper for the overlay process – currently a no‑op because we share the same JS context
export const connectStoreToOverlay = () => {};
```

## Build & Packaging
* **Vite** – configure two HTML entry points (`desktop/main.html` and `overlay/main.html`).
* **npm scripts** (add to `package.json`):
```json
"scripts": {
  "build:overwolf": "vite build --mode overwolf",
  "pack:overwolf": "powershell -Command \"Compress-Archive -Path dist/*,manifest.json -DestinationPath TFT_Ally.zip\""
}
```
* **Distribution** – upload the generated zip (`TFT_Ally.zip`) via the Overwolf developer portal.

## Security / Anti‑Cheat Alignment
* No native code or DLL injection – pure JS/HTML runs inside Overwolf’s sandbox.
* Overlay is **transparent** and **click‑through**, ensuring the app never sends input to the game.
* Permissions are limited to `GameInfo`, `FileSystem`, `Window`, and `Network` – the minimal set required for game state access, local replay storage, and Riot API calls.
* All network traffic goes over HTTPS; no memory scanning or automation.

## Testing Strategy
| Layer | Tool | Goal |
|-------|------|------|
| Unit | Vitest | Verify store reducers and pure functions |
| Overlay rendering | Overwolf test harness (headless) | Ensure overlay window appears, is transparent, and respects click‑through |
| Performance | Custom benchmark script (`npm run benchmark`) | Confirm render frame budget < 4 ms |
| CI | GitHub Actions (or preferred CI) | Run lint, type‑checking, unit tests, overlay snapshot test on each push |

## Documentation & Commit Flow
1. **Create the spec file** (this document) at `docs/superpowers/specs/2024-05-08-desktop-runtime-design.md`.
2. **Commit** with message `feat: add Overwolf desktop runtime design (Phase 1)`.
3. **Self‑review** – check for placeholders, contradictions, and scope completeness.
4. **User review** – you will verify the spec before we generate the implementation plan.

---
*End of Phase 1 design.*