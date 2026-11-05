import { TABLE_NAMES, TABLES } from '../../../core/db/sync-tables.ts';
import type { SqlDriver } from '../../../platform/db/driver.ts';
import { chunkItems } from '../domain/chunks.ts';
import { pushRows, type ServerConnection } from './api.ts';
import { readState, writeState } from './state.ts';
import type { RowsByTable, WireRow } from './types.ts';

interface Item {
  table: string;
  row: WireRow;
}

function updatedAt(item: Item): string {
  return String(item.row.updated_at);
}

/** Every synced row changed at or after `since` (all rows when `since` is null). */
async function changedRows(driver: SqlDriver, since: string | null): Promise<Item[]> {
  const items: Item[] = [];
  for (const table of TABLE_NAMES) {
    const columns = TABLES[table].columns;
    const { rows } = await driver.query(
      `SELECT ${columns.join(', ')} FROM ${table} WHERE ?1 IS NULL OR updated_at >= ?1`,
      [since],
      'all',
    );
    for (const values of rows) {
      const row: WireRow = {};
      columns.forEach((column, i) => {
        row[column] = values[i] as WireRow[string];
      });
      items.push({ table, row });
    }
  }
  return items.sort((a, b) => updatedAt(a).localeCompare(updatedAt(b)));
}

/**
 * Uploads the rows changed since the last complete upload, part by part.
 * The position saved after each part is the `updated_at` of the first row not
 * yet sent, so an interrupted upload continues with the rest. After the last
 * part it is the time the upload started: later local edits are always newer,
 * and rows pulled from a device with a fast clock cannot hide them.
 */
export async function pushChanges(
  driver: SqlDriver,
  connection: ServerConnection,
  now: () => Date = () => new Date(),
): Promise<{ sent: number }> {
  const startedAt = now().toISOString();
  const state = await readState(driver);
  const chunks = chunkItems(await changedRows(driver, state.pushedUntil));
  let sent = 0;
  for (const [index, chunk] of chunks.entries()) {
    const rows: RowsByTable = {};
    for (const { table, row } of chunk) (rows[table] ??= []).push(row);
    await pushRows(connection, rows);
    sent += chunk.length;
    const next = chunks[index + 1]?.[0];
    const position = next ? updatedAt(next) : startedAt;
    await writeState(driver, { pushedUntil: position < startedAt ? position : startedAt });
  }
  if (chunks.length === 0) await writeState(driver, { pushedUntil: startedAt });
  return { sent };
}
