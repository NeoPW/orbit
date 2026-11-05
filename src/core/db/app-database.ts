import { openPlatformDriver } from '../../platform/db/index.ts';
import { openDatabase, type OpenDatabaseResult } from './database.ts';
import { withWriteNotification } from './writes.ts';

export type AppDatabaseResult =
  | (Extract<OpenDatabaseResult, { status: 'ready' }> & {
      /** Calls `listener` after each write to a synced table made through `db`; returns an unsubscribe function. */
      onWrite: (listener: () => void) => () => void;
    })
  | Exclude<OpenDatabaseResult, { status: 'ready' }>;

let opening: Promise<AppDatabaseResult> | undefined;

/**
 * Opens the app's database once per page, however often it is called (React
 * StrictMode runs effects twice; a second open in the same tab would find its
 * own tab lock taken).
 */
export function openAppDatabase(): Promise<AppDatabaseResult> {
  opening ??= (async () => {
    try {
      const platformDriver = await openPlatformDriver();
      if (platformDriver.status === 'other-tab') return platformDriver;
      const listeners = new Set<() => void>();
      const wrapped = withWriteNotification(platformDriver.driver, () => listeners.forEach((l) => l()));
      const result = await openDatabase(wrapped, platformDriver.storage);
      if (result.status !== 'ready') return result;
      // `db` writes through the notifying driver; sync gets the raw driver so its own writes stay silent.
      return {
        ...result,
        driver: platformDriver.driver,
        onWrite: (listener) => {
          listeners.add(listener);
          return () => listeners.delete(listener);
        },
      };
    } catch (error) {
      return { status: 'error', message: error instanceof Error ? error.message : String(error) };
    }
  })();
  return opening;
}
