import type { Storage } from '../../core/db/database.ts';
import { isNativeApp } from '../platform.ts';
import type { SqlDriver } from './driver.ts';

export type PlatformDriver =
  | { status: 'ready'; driver: SqlDriver; storage: Storage }
  | { status: 'other-tab' };

/**
 * Picks the SQL driver for the running platform. Each driver is loaded with a
 * dynamic import, so the browser build never loads Tauri code and the Tauri apps
 * (desktop and Android) never load the WASM worker.
 */
export async function openPlatformDriver(): Promise<PlatformDriver> {
  if (isNativeApp) {
    const { createDesktopDriver } = await import('./desktop.ts');
    return { status: 'ready', driver: createDesktopDriver(), storage: 'file' };
  }
  const { openBrowserDriver } = await import('./browser.ts');
  return openBrowserDriver();
}
