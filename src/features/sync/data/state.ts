import type { SqlDriver, SqlQuery } from '../../../platform/db/driver.ts';
import type { FailureReason } from './types.ts';

/** Sync bookkeeping lives in the local-only settings table. */
const KEYS = {
  url: 'sync_url',
  token: 'sync_token',
  cursor: 'sync_cursor',
  pushedUntil: 'sync_pushed_until',
  lastSuccess: 'sync_last_success',
  lastFailure: 'sync_last_failure',
} as const;

export interface SyncState {
  url: string | null;
  token: string | null;
  /** Server change number of the last applied pull page. */
  cursor: number;
  /** Local time at which the last complete upload started; rows changed since are still to upload. */
  pushedUntil: string | null;
  lastSuccess: string | null;
  lastFailure: { at: string; reason: FailureReason } | null;
}

export const EMPTY_STATE: SyncState = {
  url: null,
  token: null,
  cursor: 0,
  pushedUntil: null,
  lastSuccess: null,
  lastFailure: null,
};

export async function readState(driver: SqlDriver): Promise<SyncState> {
  const { rows } = await driver.query("SELECT key, value FROM settings WHERE substr(key, 1, 5) = 'sync_'", [], 'all');
  const stored = new Map(rows.map((r) => [String(r[0]), String(r[1])]));
  const failure = stored.get(KEYS.lastFailure);
  return {
    url: stored.get(KEYS.url) ?? null,
    token: stored.get(KEYS.token) ?? null,
    cursor: Number(stored.get(KEYS.cursor) ?? 0),
    pushedUntil: stored.get(KEYS.pushedUntil) ?? null,
    lastSuccess: stored.get(KEYS.lastSuccess) ?? null,
    lastFailure: failure ? (JSON.parse(failure) as SyncState['lastFailure']) : null,
  };
}

/** Queries that save the given fields (`null` removes one), for use alone or inside a bigger batch. */
export function stateQueries(patch: Partial<SyncState>): SqlQuery[] {
  const queries: SqlQuery[] = [];
  for (const [field, value] of Object.entries(patch) as [keyof SyncState, SyncState[keyof SyncState]][]) {
    const key = KEYS[field];
    if (value === null) {
      queries.push({ sql: 'DELETE FROM settings WHERE key = ?', params: [key], method: 'run' });
    } else {
      const text = field === 'lastFailure' ? JSON.stringify(value) : String(value);
      queries.push({
        sql: 'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value',
        params: [key, text],
        method: 'run',
      });
    }
  }
  return queries;
}

export async function writeState(driver: SqlDriver, patch: Partial<SyncState>): Promise<void> {
  const queries = stateQueries(patch);
  if (queries.length > 0) await driver.batch(queries);
}

/** Forgets the connection and all bookkeeping. */
export const clearStateQuery: SqlQuery = {
  sql: "DELETE FROM settings WHERE substr(key, 1, 5) = 'sync_'",
  params: [],
  method: 'run',
};
