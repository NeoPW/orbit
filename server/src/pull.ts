import type { SqlDriver } from '../../src/platform/db/driver.ts';
import { HttpError } from './errors.ts';
import type { WireRow } from './push.ts';
import { TABLE_NAMES, TABLES } from '../../src/core/db/sync-tables.ts';

export const PULL_PAGE_SIZE = 1000;

export interface PullResult {
  rows: Record<string, WireRow[]>;
  cursor: number;
  more: boolean;
}

/** Reads the `cursor` query value: a whole number, 0 (the beginning) when absent. */
export function parseCursor(value: string | null): number {
  if (value === null || value === '') return 0;
  if (!/^\d+$/.test(value)) throw new HttpError(400, 'cursor must be a whole number');
  return Number(value);
}

/** Rows stored after `cursor`, oldest first, at most one page, from all tables. */
export async function pull(driver: SqlDriver, cursor: number): Promise<PullResult> {
  const results = await driver.batch(
    TABLE_NAMES.map((table) => ({
      sql: `SELECT ${TABLES[table].columns.join(', ')}, server_seq FROM ${table} WHERE server_seq > ? ORDER BY server_seq LIMIT ${PULL_PAGE_SIZE + 1}`,
      params: [cursor],
      method: 'all' as const,
    })),
  );
  const found = results.flatMap((result, i) => {
    const table = TABLE_NAMES[i]!;
    return result.rows.map((values) => ({ table, seq: Number(values.at(-1)), values }));
  });
  found.sort((a, b) => a.seq - b.seq);
  const page = found.slice(0, PULL_PAGE_SIZE);
  const rows: Record<string, WireRow[]> = {};
  for (const { table, values } of page) {
    const row: WireRow = {};
    TABLES[table].columns.forEach((column, i) => {
      row[column] = values[i] as WireRow[string];
    });
    (rows[table] ??= []).push(row);
  }
  return { rows, cursor: page.at(-1)?.seq ?? cursor, more: found.length > PULL_PAGE_SIZE };
}
