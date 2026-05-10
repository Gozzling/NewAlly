/**
 * Single source for the live TFT set / static-meta label used by coaching, data cache keys, and UI.
 * Patch details live in {@link SET_17_PATCH} / `dataFetchService`; bump there when Riot ships a new set.
 */

import { SET_17_PATCH } from "@/services/dataFetchService";

export type { PatchInfo } from "@/services/dataFetchService";

export { SET_17_PATCH };

/** Riot `tft_set_number` for match-v5 filtering and coach history fetch. */
export const CURRENT_TFT_SET_NUMBER = SET_17_PATCH.setNumber;

/**
 * Passed to `recommendationsFromGameState` / recommendation engine as the static meta revision tag.
 * Derived from the active set so it stays aligned with {@link CURRENT_TFT_SET_NUMBER}.
 */
export const STATIC_META_VERSION = `set${SET_17_PATCH.setNumber}`;
