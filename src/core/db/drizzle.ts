import { drizzle } from 'drizzle-orm/sqlite-proxy';
import type { SqlDriver, SqlResult } from '../../platform/db/driver.ts';

/** Drizzle expects `get` results as the row itself, not as a list of rows. */
function forDrizzle(result: SqlResult, method: string): { rows: unknown[] } {
  // A `get` without a row must be undefined for Drizzle to return undefined.
  return { rows: method === 'get' ? (result.rows[0] as unknown[]) : result.rows };
}

/** Wraps any driver in Drizzle's sqlite-proxy, with `db.batch()` running in one transaction. */
export function createDb(driver: SqlDriver) {
  return drizzle(
    async (sql, params, method) => forDrizzle(await driver.query(sql, params, method), method),
    async (queries) => {
      const results = await driver.batch(queries);
      return results.map((result, i) => forDrizzle(result, queries[i]?.method ?? 'all'));
    },
  );
}

export type Db = ReturnType<typeof createDb>;
