import { describe, it, expect, beforeEach, vi } from "vitest";
import { firstValueFrom, take } from "rxjs";
import {
  captureStatus$,
  emitAllyEvent,
  gameStatePartial$,
  getAllyEventReplaySnapshot,
  pipelineError$,
  pipelineGepStatus$,
  setAllyTelemetrySink,
  __clearAllyEventReplayForTests,
} from "./index";

describe("eventBus", () => {
  beforeEach(() => {
    __clearAllyEventReplayForTests();
    setAllyTelemetrySink(null);
  });

  it("streams partial game state", async () => {
    const pending = firstValueFrom(gameStatePartial$().pipe(take(1)));
    emitAllyEvent({
      kind: "game_state_partial",
      state: { gold: 42 },
      timestampMs: 10,
    });
    const state = await pending;
    expect(state.gold).toBe(42);
  });

  it("appends to replay snapshot", () => {
    emitAllyEvent({
      kind: "game_state_partial",
      state: { gold: 7 },
      timestampMs: 1,
    });
    const snap = getAllyEventReplaySnapshot();
    expect(snap).toHaveLength(1);
    const first = snap[0];
    expect(first.kind).toBe("game_state_partial");
    if (first.kind === "game_state_partial") {
      expect(first.state.gold).toBe(7);
    }
  });

  it("invokes telemetry sink when set", () => {
    const sink = vi.fn();
    setAllyTelemetrySink(sink);
    emitAllyEvent({
      kind: "game_state_partial",
      state: {},
      timestampMs: 2,
    });
    expect(sink).toHaveBeenCalledTimes(1);
    expect(sink.mock.calls[0][0].kind).toBe("game_state_partial");
  });

  it("streams pipeline GEP status", async () => {
    const pending = firstValueFrom(pipelineGepStatus$().pipe(take(1)));
    emitAllyEvent({
      kind: "pipeline_gep_status",
      gepReady: true,
      lastError: null,
      timestampMs: 3,
    });
    const ev = await pending;
    expect(ev.gepReady).toBe(true);
  });

  it("streams pipeline errors", async () => {
    const pending = firstValueFrom(pipelineError$().pipe(take(1)));
    emitAllyEvent({
      kind: "pipeline_error",
      code: "x",
      message: "y",
      timestampMs: 4,
    });
    const ev = await pending;
    expect(ev.code).toBe("x");
  });

  it("streams capture status", async () => {
    const pending = firstValueFrom(captureStatus$().pipe(take(1)));
    emitAllyEvent({
      kind: "capture_status",
      running: true,
      framesThisSession: 9,
      timestampMs: 5,
    });
    const ev = await pending;
    expect(ev.framesThisSession).toBe(9);
  });
});
