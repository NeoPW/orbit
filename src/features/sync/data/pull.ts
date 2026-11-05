import { TABLES } from '../../../core/db/sync-tables.ts';
import type { SqlDriver, SqlQuery } from '../../../platform/db/driver.ts';
import { pullRows, type ServerConnection } from './api.ts';
import { readState, stateQueries } from './state.ts';
import type { RowsByTable, WireRow } from './types.ts';

/** One upsert over all rows of a table: inserted when new, replaced only when strictly newer. */
function upsert(table: keyof typeof TABLES, rows: WireRow[]): SqlQuery {
  const columns = TABLES[table].columns;
  const select = columns.map((c) => `value ->> '$.${c}'`).join(', ');
  const updates = columns
    .filter((c) => c !== 'id')
    .map((c) => `${c} = excluded.${c}`)
    .join(', ');
  return {
    sql:
      `INSERT INTO ${table} (${columns.join(', ')}) SELECT ${select} FROM json_each(?) WHERE true ` +
      `ON CONFLICT (id) DO UPDATE SET ${updates} WHERE excluded.updated_at > ${table}.updated_at`,
    params: [JSON.stringify(rows)],
    method: 'run',
  };
}

/** Applies a pulled page and saves its cursor in one transaction: all of it or none. */
export async function applyPage(driver: SqlDriver, rows: RowsByTable, cursor: number): Promise<void> {
  const queries: SqlQuery[] = [];
  for (const [table, list] of Object.entries(rows)) {
    if (list.length > 0) queries.push(upsert(table as keyof typeof TABLES, list));
  }
  queries.push(...stateQueries({ cursor }));
  await driver.batch(queries);
}

/** Downloads every page after the saved cursor and applies it. */
export async function pullChanges(driver: SqlDriver, connection: ServerConnection): Promise<{ received: number }> {
  let received = 0;
  for (;;) {
    const { cursor } = await readState(driver);
    const page = await pullRows(connection, cursor);
    await applyPage(driver, page.rows, page.cursor);
    received += Object.values(page.rows).reduce((sum, list) => sum + list.length, 0);
    if (!page.more) return { received };
  }
}
