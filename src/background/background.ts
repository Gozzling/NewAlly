import { initBackgroundController } from "@/services/backgroundController";

/**
 * Background entry point — TFT Overlay background controller.
 *
 * Delegates all logic to services/backgroundController.ts so that
 * game-event handling and IPC live in the services/ folder and the
 * background page stays a thin bootstrapper.
 */

window.addEventListener("load", () => {
  void initBackgroundController();
});
