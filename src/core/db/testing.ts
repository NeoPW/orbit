import { createNodeDriver } from '../../platform/db/node.ts';
import { openDatabase, type OpenOptions } from './database.ts';

/** A migrated in-memory database for tests (no default areas unless `seed: true`). */
export async function openTestDatabase(options: OpenOptions = {}) {
  const driver = createNodeDriver();
  const result = await openDatabase(driver, 'memory', { seed: false, ...options });
  if (result.status !== 'ready') {
    throw new Error(result.status === 'error' ? result.message : 'unexpected state');
  }
  return { ...result, driver };
}
