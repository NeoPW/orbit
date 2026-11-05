import type { QueryMethod, SqlDriver, SqlQuery, SqlResult } from '../../src/platform/db/driver.ts';

/** SqlDriver on D1. Batch results come back as row objects; their values are in select order. */
export function createD1Driver(db: D1Database): SqlDriver {
  const prepare = ({ sql, params }: SqlQuery) => db.prepare(sql).bind(...params);

  return {
    async query(sql: string, params: unknown[], method: QueryMethod): Promise<SqlResult> {
      const statement = prepare({ sql, params, method });
      if (method === 'run') {
        await statement.run();
        return { rows: [] };
      }
      const rows = await statement.raw<unknown[]>();
      return { rows: method === 'get' ? rows.slice(0, 1) : rows };
    },
    async batch(queries: SqlQuery[]): Promise<SqlResult[]> {
      const results = await db.batch(queries.map(prepare));
      return results.map((result, i) => {
        const rows = (result.results as Record<string, unknown>[]).map((row) => Object.values(row));
        return { rows: queries[i]?.method === 'run' ? [] : rows };
      });
    },
    close: () => Promise.resolve(),
  };
}
