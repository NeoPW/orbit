import { openPlatformDriver } from '../../platform/db/index.ts';
import { openDatabase, type OpenDatabaseResult } from './database.ts';

let opening: Promise<OpenDatabaseResult> | undefined;

/**
 * Opens the app's database once per page, however often it is called (React
 * StrictMode runs effects twice; a second open in the same tab would find its
 * own tab lock taken).
 */
export function openAppDatabase(): Promise<OpenDatabaseResult> {
  opening ??= (async () => {
    try {
      const platformDriver = await openPlatformDriver();
      if (platformDriver.status === 'other-tab') return platformDriver;
      return await openDatabase(platformDriver.driver, platformDriver.storage);
    } catch (error) {
      return { status: 'error', message: error instanceof Error ? error.message : String(error) };
    }
  })();
  return opening;
}
