import type { SqlDriver, SqlQuery } from '../../src/platform/db/driver.ts';
import { HttpError } from './errors.ts';
import { TABLES, type TableInfo } from './tables.ts';

export const MAX_PUSH_ROWS = 500;

/** A row as stored on the device: database column names, stored values. */
export type WireRow = Record<string, string | number | boolean | null>;
export type PushRows = Record<string, WireRow[]>;

const TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

function bad(message: string): never {
  throw new HttpError(400, message);
}

function validateRow(table: string, info: TableInfo, row: unknown, index: number): WireRow {
  const where = `${table}[${index}]`;
  if (typeof row !== 'object' || row === null || Array.isArray(row)) bad(`${where} is not an object`);
  const keys = Object.keys(row);
  for (const key of keys) if (!info.columns.includes(key)) bad(`${where} has unknown column ${key}`);
  for (const column of info.columns) if (!keys.includes(column)) bad(`${where} lacks column ${column}`);
  const wire = row as Record<string, unknown>;
  for (const column of keys) {
    const value = wire[column];
    const ok = value === null || ['string', 'number', 'boolean'].includes(typeof value);
    if (!ok) bad(`${where}.${column} is not a plain value`);
    if (value === null && info.required.includes(column)) bad(`${where}.${column} must not be empty`);
  }
  for (const column of ['created_at', 'updated_at']) {
    const value = wire[column];
    if (typeof value !== 'string' || !TIMESTAMP.test(value)) bad(`${where}.${column} is not a UTC timestamp`);
  }
  return wire as WireRow;
}

/** Checks a push body completely before anything is stored. */
export function validatePush(body: unknown): PushRows {
  if (typeof body !== 'object' || body === null) bad('The body must be an object');
  const rows = (body as { rows?: unknown }).rows;
  if (typeof rows !== 'object' || rows === null || Array.isArray(rows)) bad('The body needs "rows"');
  const result: PushRows = {};
  let total = 0;
  for (const [table, list] of Object.entries(rows)) {
    if (!(table in TABLES)) bad(`Unknown table ${table}`);
    if (!Array.isArray(list)) bad(`${table} must be a list`);
    total += list.length;
    result[table] = list as WireRow[];
  }
  if (total > MAX_PUSH_ROWS) throw new HttpError(413, `A push may hold at most ${MAX_PUSH_ROWS} rows`);
  for (const [table, list] of Object.entries(result)) {
    const info = TABLES[table as keyof typeof TABLES];
    result[table] = list.map((row, i) => validateRow(table, info, row, i));
  }
  return result;
}

/** One upsert over all rows of a table: stored when new or strictly newer. */
function upsert(table: string, info: TableInfo, rows: WireRow[], offset: number): SqlQuery {
  const columns = info.columns;
  const list = [...columns, 'server_seq'].join(', ');
  const select = columns.map((c) => `value ->> '$.${c}'`).join(', ');
  const updates = [...columns.filter((c) => c !== 'id'), 'server_seq'].map((c) => `${c} = excluded.${c}`).join(', ');
  const sql =
    `INSERT INTO ${table} (${list}) ` +
    `SELECT ${select}, (SELECT seq FROM sync_state WHERE id = 1) + ? + key + 1 ` +
    `FROM json_each(?) WHERE true ` +
    `ON CONFLICT (id) DO UPDATE SET ${updates} ` +
    `WHERE excluded.updated_at > ${table}.updated_at RETURNING id`;
  return { sql, params: [offset, JSON.stringify(rows)], method: 'all' };
}

/** Stores a push in one transaction and returns how many rows were stored. */
export async function push(driver: SqlDriver, body: unknown): Promise<{ stored: number }> {
  const rows = validatePush(body);
  const queries: SqlQuery[] = [{ sql: 'INSERT OR IGNORE INTO sync_state (id, seq) VALUES (1, 0)', params: [], method: 'run' }];
  const upsertIndexes: number[] = [];
  let offset = 0;
  for (const [table, list] of Object.entries(rows)) {
    if (list.length === 0) continue;
    upsertIndexes.push(queries.length);
    queries.push(upsert(table, TABLES[table as keyof typeof TABLES], list, offset));
    offset += list.length;
  }
  if (offset === 0) return { stored: 0 };
  queries.push({ sql: 'UPDATE sync_state SET seq = seq + ? WHERE id = 1', params: [offset], method: 'run' });
  let results;
  try {
    results = await driver.batch(queries);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/constraint|datatype/i.test(message)) bad(`A row was not accepted: ${message}`);
    throw error;
  }
  return { stored: upsertIndexes.reduce((sum, i) => sum + (results[i]?.rows.length ?? 0), 0) };
}
