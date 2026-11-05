import { TABLE_NAMES } from '../../../core/db/sync-tables.ts';
import type { SqlDriver, SqlQuery } from '../../../platform/db/driver.ts';
import { getStatus, SyncError } from './api.ts';
import { clearStateQuery, stateQueries } from './state.ts';

/** `example.com` and `https://example.com/` both become `https://example.com`; null when it is no address. */
export function normalizeServerUrl(input: string): string | null {
  const text = input.trim();
  if (text === '') return null;
  try {
    const url = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(text) ? text : `https://${text}`);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    return url.origin;
  } catch {
    return null;
  }
}

export interface CheckResult {
  url: string;
  hasData: boolean;
}

/**
 * Asks the server whether the token is accepted and whether it already holds
 * data. Saves nothing. Throws a `SyncError`: `token` when refused, `offline`
 * when the server cannot be reached (or the address is no address).
 */
export async function checkServer(
  address: string,
  token: string,
  options: { fetch?: typeof fetch } = {},
): Promise<CheckResult> {
  const url = normalizeServerUrl(address);
  if (!url) throw new SyncError('offline', 'That is not a server address');
  const { hasData } = await getStatus({ url, token: token.trim(), fetch: options.fetch });
  return { url, hasData };
}

const fresh: Parameters<typeof stateQueries>[0] = { cursor: 0, pushedUntil: null, lastSuccess: null, lastFailure: null };

/**
 * Connects the device after `checkServer`.
 * - `upload` (the server is empty): everything local is uploaded by the next sync.
 * - `replace` (the server has data, confirmed): in one transaction, all synced rows are
 *   deleted and the connection is saved; the next sync downloads everything. Local
 *   settings stay, so the default areas are not created again.
 */
export async function saveConnection(
  driver: SqlDriver,
  connection: { url: string; token: string },
  mode: 'upload' | 'replace',
  now: () => Date = () => new Date(),
): Promise<void> {
  const queries: SqlQuery[] = [];
  if (mode === 'replace') {
    for (const table of TABLE_NAMES) queries.push({ sql: `DELETE FROM ${table}`, params: [], method: 'run' });
  }
  queries.push(
    ...stateQueries({
      url: connection.url,
      token: connection.token.trim(),
      ...fresh,
      // After a replace nothing local is waiting for upload; pulled rows are older than this.
      pushedUntil: mode === 'replace' ? now().toISOString() : null,
    }),
  );
  await driver.batch(queries);
}

/** Stops syncing and forgets the token; all local data stays. */
export async function disconnect(driver: SqlDriver): Promise<void> {
  await driver.batch([clearStateQuery]);
}
