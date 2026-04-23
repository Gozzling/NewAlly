// ── Window management service (replaces getMainWindow() shared-object pattern) ──
// All window IDs are held in the Zustand store so every page has a reactive
// source of truth instead of a singleton object.

/// <reference types="@overwolf/types" />

import { useAppStore } from "@/store/useAppStore";
import type { WindowName } from "@/types/overwolf";

export interface WindowResult {
  id: string;
  name: string;
}

/**
 * Promise wrapper around overwolf.windows.obtainDeclaredWindow
 */
export function obtainWindow(name: WindowName): Promise<WindowResult> {
  return new Promise((resolve, reject) => {
    overwolf.windows.obtainDeclaredWindow(name, (result: any) => {
      if (result.success && result.window?.id) {
        useAppStore.getState().setWindowId(name, result.window.id);
        resolve({ id: result.window.id, name });
      } else {
        reject(new Error(`Failed to obtain window "${name}": ${JSON.stringify(result)}`));
      }
    });
  });
}

/**
 * Get a previously-obtained window id from the store (non-reactive).
 */
export function getWindowId(name: WindowName): string | null {
  return useAppStore.getState().windows[name] ?? null;
}

/**
 * Open / restore a declared window.
 */
export async function openWindow(name: WindowName): Promise<string> {
  let id = getWindowId(name);
  if (!id) {
    const res = await obtainWindow(name);
    id = res.id;
  }
  return new Promise((resolve) => {
    overwolf.windows.restore(id!, () => resolve(id!));
  });
}

/**
 * Hide (do not close) a window.
 */
export function hideWindow(name: WindowName): void {
  const id = getWindowId(name);
  if (id) overwolf.windows.hide(id);
}

/**
 * Close a window.
 */
export function closeWindow(name: WindowName): void {
  const id = getWindowId(name);
  if (id) {
    overwolf.windows.close(id);
    useAppStore.getState().setWindowId(name, null);
  }
}

/**
 * Toggle between minimized and restored.
 */
export function toggleWindow(name: WindowName): void {
  const id = getWindowId(name);
  if (!id) return;
  overwolf.windows.getWindowState(id, (stateRes: any) => {
    if (!stateRes?.success) return;
    const isVisible =
      stateRes.window_state_ex === "normal" ||
      stateRes.window_state_ex === "maximized";
    if (isVisible) {
      overwolf.windows.minimize(id);
    } else {
      overwolf.windows.restore(id);
    }
  });
}

/**
 * Close all windows except the named one (handy on shutdown).
 */
export function closeAllWindowsExcept(keep: WindowName): void {
  const all: WindowName[] = ["background", "overlay", "desktop"];
  for (const w of all) {
    if (w !== keep) closeWindow(w);
  }
}
