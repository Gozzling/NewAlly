import { Subject } from "rxjs";
import { filter, map } from "rxjs/operators";
import type { AllyAppEvent } from "./allyEvents";
import {
  isGameStatePartialEvent,
  isPipelineGepStatusEvent,
  isPipelineErrorEvent,
  isCaptureStatusEvent,
} from "./eventRegistry";
import { EventReplayBuffer } from "./eventReplay";
import { notifyTelemetry } from "./telemetryBridge";

const bus = new Subject<AllyAppEvent>();
const replay = new EventReplayBuffer(256);

export function emitAllyEvent(event: AllyAppEvent): void {
  replay.record(event);
  notifyTelemetry(event);
  bus.next(event);
}

export function allyEvents$() {
  return bus.asObservable();
}

export function gameStatePartial$() {
  return bus.asObservable().pipe(
    filter(isGameStatePartialEvent),
    map((e) => e.state),
  );
}

export function pipelineGepStatus$() {
  return bus.asObservable().pipe(filter(isPipelineGepStatusEvent));
}

export function pipelineError$() {
  return bus.asObservable().pipe(filter(isPipelineErrorEvent));
}

export function captureStatus$() {
  return bus.asObservable().pipe(filter(isCaptureStatusEvent));
}

/** Last N events for devtools / replay debugger (read-only). */
export function getAllyEventReplaySnapshot(): readonly AllyAppEvent[] {
  return replay.snapshot();
}

/** @internal */
export function __clearAllyEventReplayForTests(): void {
  replay.clear();
}
