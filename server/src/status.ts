import type { SqlDriver } from '../../src/platform/db/driver.ts';
import { SCHEMA_VERSION } from '../../src/core/db/version.ts';

/** Whether the server holds any rows (deleted ones included) and the schema version it expects. */
export async function status(driver: SqlDriver): Promise<{ hasData: boolean; schemaVersion: number }> {
  const { rows } = await driver.query('SELECT seq FROM sync_state WHERE id = 1', [], 'get');
  return { hasData: Number(rows[0]?.[0] ?? 0) > 0, schemaVersion: SCHEMA_VERSION };
}
