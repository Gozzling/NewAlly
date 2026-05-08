import type { AllyAppEvent } from "./allyEvents";

export function isGameStatePartialEvent(
  e: AllyAppEvent,
): e is AllyAppEvent & { kind: "game_state_partial" } {
  return e.kind === "game_state_partial";
}

export function isPipelineGepStatusEvent(
  e: AllyAppEvent,
): e is AllyAppEvent & { kind: "pipeline_gep_status" } {
  return e.kind === "pipeline_gep_status";
}

export function isPipelineErrorEvent(
  e: AllyAppEvent,
): e is AllyAppEvent & { kind: "pipeline_error" } {
  return e.kind === "pipeline_error";
}

export function isCaptureStatusEvent(
  e: AllyAppEvent,
): e is AllyAppEvent & { kind: "capture_status" } {
  return e.kind === "capture_status";
}
