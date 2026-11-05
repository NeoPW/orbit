import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import type { QueryMethod, SqlDriver, SqlQuery, SqlResult } from './driver.ts';

/** node:sqlite returns BigInt for integers it cannot prove safe; convert those that fit. */
function toValue(value: unknown): unknown {
  if (typeof value === 'bigint') {
    return value >= BigInt(Number.MIN_SAFE_INTEGER) && value <= BigInt(Number.MAX_SAFE_INTEGER)
      ? Number(value)
      : value;
  }
  return value;
}

/** SQL driver on Node's built-in SQLite, for tests. In memory unless a file path is given. */
export function createNodeDriver(path = ':memory:'): SqlDriver {
  const database = new DatabaseSync(path);

  function execute({ sql, params, method }: SqlQuery): SqlResult {
    const statement = database.prepare(sql);
    statement.setReturnArrays(true);
    const input = params.map((p) => (p === undefined ? null : p)) as SQLInputValue[];
    if (method === 'run') {
      statement.run(...input);
      return { rows: [] };
    }
    const rows = (statement.all(...input) as unknown as unknown[][]).map((row) => row.map(toValue));
    return { rows: method === 'get' ? rows.slice(0, 1) : rows };
  }

  return {
    query: (sql: string, params: unknown[], method: QueryMethod) =>
      Promise.resolve().then(() => execute({ sql, params, method })),
    batch: (queries) =>
      Promise.resolve().then(() => {
        database.exec('BEGIN');
        try {
          const results = queries.map(execute);
          database.exec('COMMIT');
          return results;
        } catch (error) {
          database.exec('ROLLBACK');
          throw error;
        }
      }),
    close: () => Promise.resolve().then(() => database.close()),
  };
}
