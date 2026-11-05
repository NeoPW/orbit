import { invoke } from '@tauri-apps/api/core';
import type { SqlDriver, SqlResult } from './driver.ts';

/** SQLite in the desktop app: `orbit.db` in the app data directory, via the Rust commands in src-tauri/src/db.rs. */
export function createDesktopDriver(): SqlDriver {
  return {
    query: (sql, params, method) => invoke<SqlResult>('db_query', { sql, params, method }),
    batch: (queries) => invoke<SqlResult[]>('db_batch', { queries }),
    close: async () => {},
  };
}
