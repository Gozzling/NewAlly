import type { AllyAppEvent } from "./allyEvents";

/** Ring buffer of recent events for debugging / future replay tooling. */
export class EventReplayBuffer {
  private readonly items: AllyAppEvent[] = [];

  constructor(private readonly maxSize: number) {
    if (maxSize < 1) {
      throw new Error("EventReplayBuffer maxSize must be >= 1");
    }
  }

  record(event: AllyAppEvent): void {
    this.items.push(event);
    while (this.items.length > this.maxSize) {
      this.items.shift();
    }
  }

  snapshot(): readonly AllyAppEvent[] {
    return Object.freeze([...this.items]);
  }

  clear(): void {
    this.items.length = 0;
  }
}
