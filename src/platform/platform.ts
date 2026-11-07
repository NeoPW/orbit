import { isTauri } from '@tauri-apps/api/core';

/** Where the app runs: the Tauri desktop app, the Tauri Android app or a browser tab. */
export type Platform = 'desktop' | 'android' | 'browser';

/** Both Tauri apps report `isTauri()`; the Android WebView says "Android" in its user agent. */
export function detectPlatform(userAgent: string = typeof navigator === 'undefined' ? '' : navigator.userAgent): Platform {
  if (!isTauri()) return 'browser';
  return /\bAndroid\b/.test(userAgent) ? 'android' : 'desktop';
}

/**
 * Decided once at startup. Desktop-only modules are loaded with a dynamic
 * import() behind `platform === 'desktop'`, so the browser build never
 * touches Tauri APIs.
 */
export const platform: Platform = detectPlatform();

/** True in a Tauri app (desktop or Android): native SQLite in the app's data directory. */
export const isNativeApp: boolean = platform !== 'browser';
