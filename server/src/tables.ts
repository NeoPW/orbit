import { getTableColumns } from 'drizzle-orm';
import { SYNCED_TABLES, type SyncedTableName } from '../../src/core/db/schema.ts';

export interface TableInfo {
  /** SQL column names in the app's order. */
  columns: string[];
  /** Columns that are NOT NULL. Rows travel as stored, so no value mapping is needed. */
  required: string[];
}

export const TABLE_NAMES = Object.keys(SYNCED_TABLES) as SyncedTableName[];

function build(): Record<SyncedTableName, TableInfo> {
  const result = {} as Record<SyncedTableName, TableInfo>;
  for (const name of TABLE_NAMES) {
    const cols = Object.values(getTableColumns(SYNCED_TABLES[name]));
    result[name] = { columns: cols.map((c) => c.name), required: cols.filter((c) => c.notNull).map((c) => c.name) };
  }
  return result;
}

/** Synced tables and their column names, derived from the app schema. */
export const TABLES = build();
