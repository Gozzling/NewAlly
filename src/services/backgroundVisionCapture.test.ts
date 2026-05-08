import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { IpcTftPayload } from "@/engine/events/ipcWire";
import { createMatchVisionCapture } from "./backgroundVisionCapture";

describe("createMatchVisionCapture", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("broadcasts running start, throttled progress, and final stop", () => {
    const broadcast = vi.fn((_: IpcTftPayload) => {});
    const v = createMatchVisionCapture(broadcast);
    v.start();
    expect(broadcast).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "capture_status",
        running: true,
        framesThisSession: 0,
      }),
    );
    vi.advanceTimersByTime(2500);
    const progress = broadcast.mock.calls.find(
      (c) =>
        c[0].kind === "capture_status" &&
        c[0].running === true &&
        c[0].framesThisSession > 0,
    );
    expect(progress).toBeDefined();
    v.stop();
    const last = broadcast.mock.calls[broadcast.mock.calls.length - 1][0];
    expect(last).toMatchObject({ kind: "capture_status", running: false });
    expect(typeof (last as { framesThisSession: number }).framesThisSession).toBe("number");
  });

  it("start is idempotent while running", () => {
    const broadcast = vi.fn((_: IpcTftPayload) => {});
    const v = createMatchVisionCapture(broadcast);
    v.start();
    const n = broadcast.mock.calls.length;
    v.start();
    expect(broadcast.mock.calls.length).toBe(n);
    v.stop();
  });
});
