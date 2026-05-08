import { describe, it, expect } from "vitest";
import { EventReplayBuffer } from "./eventReplay";
import type { AllyAppEvent } from "./allyEvents";

function evt(overrides: { timestampMs?: number } = {}): AllyAppEvent {
  return {
    kind: "game_state_partial",
    state: { gold: 1 },
    timestampMs: overrides.timestampMs ?? 0,
  };
}

describe("EventReplayBuffer", () => {
  it("drops oldest when over maxSize", () => {
    const buf = new EventReplayBuffer(2);
    buf.record(evt({ timestampMs: 1 }));
    buf.record(evt({ timestampMs: 2 }));
    buf.record(evt({ timestampMs: 3 }));
    const s = buf.snapshot();
    expect(s).toHaveLength(2);
    expect(s[0].timestampMs).toBe(2);
    expect(s[1].timestampMs).toBe(3);
  });

  it("clear removes all", () => {
    const buf = new EventReplayBuffer(10);
    buf.record(evt());
    buf.clear();
    expect(buf.snapshot()).toHaveLength(0);
  });

  it("rejects maxSize < 1", () => {
    expect(() => new EventReplayBuffer(0)).toThrow();
  });
});
