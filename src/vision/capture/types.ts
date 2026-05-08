/**
 * Phase 3 — screen capture pipeline contracts (no native capture impl yet).
 * Target: capture latency < 20ms (master plan).
 */

export interface CaptureRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CapturedFrame {
  /** Monotonic ms when the frame was produced (performance.now() in runtime). */
  capturedAtMs: number;
  /** Logical size after any downscale (for OCR budgeting). */
  width: number;
  height: number;
  /**
   * Raw pixel buffer RGBA, row-major. Empty when using placeholder / stub pipeline.
   */
  data: Uint8ClampedArray;
}

export interface ScreenCaptureConfig {
  /** Max frames per second (best-effort throttle). */
  maxFps: number;
  /** Optional sub-rectangle in screen space. */
  region: CaptureRegion | null;
}

export const DEFAULT_CAPTURE_CONFIG: ScreenCaptureConfig = {
  maxFps: 12,
  region: null,
};
