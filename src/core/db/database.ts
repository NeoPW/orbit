import type { SqlDriver } from '../../platform/db/driver.ts';
import { createDb, type Db } from './drizzle.ts';
import { migrate, type Migration } from './migrate.ts';
import type { Clock } from './records.ts';
import { seedDefaultAreas } from './seed.ts';

export type Storage = 'file' | 'opfs' | 'memory';

export type OpenDatabaseResult =
  | { status: 'ready'; db: Db; storage: Storage; schemaVersion: number }
  | { status: 'other-tab' }
  | { status: 'error'; message: string };

export interface OpenOptions {
  /** Defaults to the bundled `drizzle/*.sql`. */
  migrations?: Migration[];
  clock?: Clock;
  /** Seed the default areas into a newly created database. Default true. */
  seed?: boolean;
}

/**
 * Migrates the database behind `driver` and seeds the default areas once
 * (see seed.ts). The driver comes from the platform (`other-tab` is
 * reported by the browser driver before it gets here).
 */
export async function openDatabase(
  driver: SqlDriver,
  storage: Storage,
  options: OpenOptions = {},
): Promise<OpenDatabaseResult> {
  try {
    const { schemaVersion } = await migrate(driver, options.migrations);
    const db = createDb(driver);
    if (options.seed !== false) {
      await seedDefaultAreas(db, options.clock ?? (() => new Date()));
    }
    return { status: 'ready', db, storage, schemaVersion };
  } catch (error) {
    return { status: 'error', message: error instanceof Error ? error.message : String(error) };
  }
}
