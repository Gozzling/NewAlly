import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createStubCapturePipeline } from "./screenCapturePipeline";

describe("createStubCapturePipeline", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("throttles to maxFps", () => {
    const frames: number[] = [];
    const pipe = createStubCapturePipeline({ maxFps: 10 }, { now: () => Date.now() });
    pipe.subscribe((f) => frames.push(f.capturedAtMs));
    pipe.start();
    vi.advanceTimersByTime(1000);
    expect(frames.length).toBe(10);
    pipe.stop();
  });

  it("unsubscribe stops delivery", () => {
    let n = 0;
    const pipe = createStubCapturePipeline({ maxFps: 60 }, { now: () => 0 });
    const unsub = pipe.subscribe(() => {
      n += 1;
    });
    pipe.start();
    vi.advanceTimersByTime(50);
    unsub();
    vi.advanceTimersByTime(50);
    pipe.stop();
    expect(n).toBe(3);
  });
});
