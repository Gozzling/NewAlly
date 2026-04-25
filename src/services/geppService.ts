/// <reference types="@overwolf/types" />

/**
 * Service to simplify listening to Overwolf Game Events Processor (GEP) events.
 * Provides typed callbacks for info updates and new events.
 */
export class GeppService {
  private requiredFeatures: string[] = [];
  private infoCallbacks: Map<string, ((info: any) => void)[]> = new Map();
  private eventCallbacks: Map<string, ((event: any) => void)[]> = new Map();
  private disposed = false;
  private retries = 0;
  private readonly maxRetries = 10;
  private readonly retryDelay = 2000;

  /**
   * Register required features and start listening.
   * @param features Array of GEP feature names (e.g., ['board', 'shop', 'active_player'])
   */
  register(features: string[]): void {
    if (this.disposed) return;
    this.requiredFeatures = [...new Set([...this.requiredFeatures, ...features])];
    this._tryRegister();
  }

  /**
   * Subscribe to info updates for a specific feature.
   * @param feature GEP feature name
   * @param callback Function called when the feature info updates
   * @returns Unsubscribe function
   */
  onInfoUpdate(feature: string, callback: (info: any) => void): () => void {
    if (this.disposed) return () => {};
    if (!this.infoCallbacks.has(feature)) {
      this.infoCallbacks.set(feature, []);
    }
    this.infoCallbacks.get(feature)!.push(callback);
    // Ensure feature is registered
    this.register([feature]);
    return () => {
      const list = this.infoCallbacks.get(feature);
      if (list) {
        const idx = list.indexOf(callback);
        if (idx >= 0) list.splice(idx, 1);
      }
    };
  }

  /**
   * Subscribe to new events (e.g., match_start, match_end).
   * @param eventName Event name
   * @param callback Function called when the event occurs
   * @returns Unsubscribe function
   */
  onNewEvent(eventName: string, callback: (event: any) => void): () => void {
    if (this.disposed) return () => {};
    if (!this.eventCallbacks.has(eventName)) {
      this.eventCallbacks.set(eventName, []);
    }
    this.eventCallbacks.get(eventName)!.push(callback);
    return () => {
      const list = this.eventCallbacks.get(eventName);
      if (list) {
        const idx = list.indexOf(callback);
        if (idx >= 0) list.splice(idx, 1);
      }
    };
  }

  /** Dispose all listeners and cleanup */
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    // Note: We cannot easily unregister GEP features; Overwolf doesn't provide an unregister.
    // However, removing callbacks prevents memory leaks.
    this.infoCallbacks.clear();
    this.eventCallbacks.clear();
  }

  // ----- Private methods -----

  private _tryRegister(): void {
    overwolf.games.events.setRequiredFeatures(this.requiredFeatures, (result: any) => {
      if (this.disposed) return;
      if (result.status !== 'success') {
        if (this.retries < this.maxRetries) {
          console.warn('[GEPP] GEP retry', ++this.retries, '/', this.maxRetries);
          setTimeout(() => this._tryRegister(), this.retryDelay);
        } else {
          console.error('[GEPP] GEP registration failed:', result.error);
        }
        return;
      }
      this.retries = 0;
      console.log('[GEPP] GEP registered:', this.requiredFeatures);
    });
  }

  // These are called by the background controller (or any consumer) to dispatch to listeners
  /** @internal */
  _dispatchInfoUpdate(feature: string, info: any): void {
    const callbacks = this.infoCallbacks.get(feature);
    if (callbacks) {
      callbacks.forEach((cb) => {
        try {
          cb(info);
        } catch (e) {
          console.error('[GEPP] Error in info update callback for', feature, e);
        }
      });
    }
  }

  /** @internal */
  _dispatchNewEvent(eventName: string, event: any): void {
    const callbacks = this.eventCallbacks.get(eventName);
    if (callbacks) {
      callbacks.forEach((cb) => {
        try {
          cb(event);
        } catch (e) {
          console.error('[GEPP] Error in event callback for', eventName, e);
        }
      });
    }
  }
}