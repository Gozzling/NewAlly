import type { CapturedFrame, ScreenCaptureConfig } from "./types";
import { DEFAULT_CAPTURE_CONFIG } from "./types";

export interface ScreenCapturePipeline {
  readonly config: ScreenCaptureConfig;
  /** Subscribe to frames; returns unsubscribe. */
  subscribe(onFrame: (frame: CapturedFrame) => void): () => void;
  /** Start producing frames (noop for stub). */
  start(): void;
  /** Stop producing frames. */
  stop(): void;
}

/**
 * Stub pipeline: emits zero-byte frames on a timer for wiring tests and FPS throttling checks.
 * Replace with Overwolf / desktop capture when integrating native APIs.
 */
export function createStubCapturePipeline(
  config: Partial<ScreenCaptureConfig> = {},
  clock: { now: () => number } = typeof performance !== "undefined"
    ? performance
    : { now: () => Date.now() },
): ScreenCapturePipeline {
  const full: ScreenCaptureConfig = { ...DEFAULT_CAPTURE_CONFIG, ...config };
  let subs: Array<(frame: CapturedFrame) => void> = [];
  let timer: ReturnType<typeof setInterval> | null = null;
  const intervalMs = Math.max(1, Math.floor(1000 / full.maxFps));

  return {
    config: full,
    subscribe(onFrame) {
      subs.push(onFrame);
      return () => {
        subs = subs.filter((s) => s !== onFrame);
      };
    },
    start() {
      if (timer !== null) return;
      timer = setInterval(() => {
        const frame: CapturedFrame = {
          capturedAtMs: clock.now(),
          width: 1,
          height: 1,
          data: new Uint8ClampedArray(0),
        };
        subs.forEach((s) => {
          try {
            s(frame);
          } catch {
            /* subscriber error — isolated */
          }
        });
      }, intervalMs);
    },
    stop() {
      if (timer !== null) {
        clearInterval(timer);
        timer = null;
      }
    },
  };
}
