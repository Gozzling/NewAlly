import type { AllyAppEvent } from "./allyEvents";

export type AllyTelemetrySink = (event: AllyAppEvent) => void;

let sink: AllyTelemetrySink | null = null;

/** Optional hook for PostHog / OpenTelemetry / internal dashboards (Phase 9). */
export function setAllyTelemetrySink(next: AllyTelemetrySink | null): void {
  sink = next;
}

export function notifyTelemetry(event: AllyAppEvent): void {
  sink?.(event);
}
