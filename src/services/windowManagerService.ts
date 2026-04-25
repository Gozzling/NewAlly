import { openWindow, closeWindow, getWindowId } from './overwolfWindowService';
import type { WindowName } from '@/types/overwolf';

/**
 * Higher-level window management service with additional features.
 */
export class WindowManagerService {
  /**
   * Open / restore a declared window with optional options.
   * @param name Window name (background, overlay, desktop, lobby)
   * @param options Optional settings (not currently used, kept for extensibility)
   * @returns Promise resolving with window ID
   */
  async openWindow(name: WindowName, options?: any): Promise<string> {
    let id = getWindowId(name);
    if (!id) {
      await openWindow(name);
      id = getWindowId(name);
      if (!id) throw new Error(`Failed to obtain window ID for ${name}`);
    }
    // Overwolf doesn't have direct options for open; we can extend later if needed.
    return id;
  }

  /** Close a window. */
  closeWindow(name: WindowName): void {
    closeWindow(name);
  }

  /** Minimize a window. */
  minimizeWindow(name: WindowName): void {
    const id = getWindowId(name);
    if (id) {
      overwolf.windows.minimize(id);
    }
  }

  /** Focus (bring to front) a window. */
  focusWindow(name: WindowName): void {
    const id = getWindowId(name);
    if (id) {
      overwolf.windows.restore(id); // restore brings to front
    }
  }

  /**
   * Listen for game state updates from the background controller.
   * @param callback Called with the latest game state
   * @returns Unsubscribe function
   */
  listenForGameStateChanges(callback: (state: any) => void): () => void {
    // Use the existing IPC mechanism: overwolf.windows.onMessageReceived
    const ow = (typeof window !== 'undefined' ? (window as any).overwolf : undefined) as
      | undefined
      | {
          windows: {
            onMessageReceived: {
              addListener: (cb: (msg: any) => void) => void;
              removeListener: (cb: (msg: any) => void) => void;
            };
          };
        };

    if (!ow?.windows?.onMessageReceived) {
      return () => {};
    }

    const handleMessage = (msg: any) => {
      const payload = msg?.content ?? msg;
      if (!payload || typeof payload !== 'object') return;
      if (payload.kind === 'state' && payload.state) {
        try {
          callback(payload.state);
        } catch (e) {
          console.error('[WindowManager] Error in game state callback:', e);
        }
      }
    };

    ow.windows.onMessageReceived.addListener(handleMessage);
    return () => ow.windows.onMessageReceived.removeListener(handleMessage);
  }
}

/** Singleton instance for convenience */
export const windowManager = new WindowManagerService();