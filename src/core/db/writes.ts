import type { QueryMethod, SqlDriver, SqlQuery, SqlResult } from '../../platform/db/driver.ts';
import { SYNCED_TABLES } from './schema.ts';

const WRITE = /^\s*(?:insert\s+(?:or\s+\w+\s+)?into|update(?:\s+or\s+\w+)?|delete\s+from)\s+["`]?(\w+)["`]?/i;

/** True when the statement writes to a synced table (never for `settings`). */
export function writesSyncedTable(sql: string): boolean {
  const table = WRITE.exec(sql)?.[1];
  return table !== undefined && table in SYNCED_TABLES;
}

/**
 * Wraps a driver so `onWrite` is called after a successful statement or batch
 * that wrote to a synced table. A failed write does not notify.
 */
export function withWriteNotification(driver: SqlDriver, onWrite: () => void): SqlDriver {
  return {
    async query(sql: string, params: unknown[], method: QueryMethod): Promise<SqlResult> {
      const result = await driver.query(sql, params, method);
      if (writesSyncedTable(sql)) onWrite();
      return result;
    },
    async batch(queries: SqlQuery[]): Promise<SqlResult[]> {
      const results = await driver.batch(queries);
      if (queries.some((q) => writesSyncedTable(q.sql))) onWrite();
      return results;
    },
    close: () => driver.close(),
  };
}
