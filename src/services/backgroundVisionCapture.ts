import {
  createIpcCaptureStatusMessage,
  type IpcTftPayload,
} from "@/engine/events/ipcWire";
import {
  createStubCapturePipeline,
  type ScreenCapturePipeline,
} from "@/vision/capture/screenCapturePipeline";

const PROGRESS_MS = 2000;

/**
 * Stub vision capture for a TFT match: exercises FPS throttling and broadcasts
 * status to renderers for Settings / future OCR wiring.
 */
export function createMatchVisionCapture(broadcast: (payload: IpcTftPayload) => void) {
  let pipe: ScreenCapturePipeline | null = null;
  let unsub: (() => void) | null = null;
  let frames = 0;
  let progressTimer: ReturnType<typeof setInterval> | null = null;

  function clearProgressTimer(): void {
    if (progressTimer !== null) {
      clearInterval(progressTimer);
      progressTimer = null;
    }
  }

  function stop(): void {
    clearProgressTimer();
    const total = frames;
    unsub?.();
    unsub = null;
    pipe?.stop();
    pipe = null;
    broadcast(createIpcCaptureStatusMessage(false, total));
    frames = 0;
  }

  function start(): void {
    if (pipe !== null) return;
    frames = 0;
    pipe = createStubCapturePipeline({ maxFps: 12 });
    unsub = pipe.subscribe(() => {
      frames += 1;
    });
    pipe.start();
    broadcast(createIpcCaptureStatusMessage(true, 0));
    progressTimer = setInterval(() => {
      broadcast(createIpcCaptureStatusMessage(true, frames));
    }, PROGRESS_MS);
  }

  return { start, stop };
}
