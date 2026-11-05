import { isTauri } from '@tauri-apps/api/core';

/** Where the app runs: the Tauri desktop app or a browser tab. */
export type Platform = 'desktop' | 'browser';

export function detectPlatform(): Platform {
  return isTauri() ? 'desktop' : 'browser';
}

/**
 * Decided once at startup. Desktop-only modules are loaded with a dynamic
 * import() behind `platform === 'desktop'`, so the browser build never
 * touches Tauri APIs.
 */
export const platform: Platform = detectPlatform();
