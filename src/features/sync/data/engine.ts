import type { SqlDriver } from '../../../platform/db/driver.ts';
import { SyncError, type ServerConnection } from './api.ts';
import { pullChanges } from './pull.ts';
import { pushChanges } from './push.ts';
import { readState, writeState } from './state.ts';
import type { FailureReason } from './types.ts';

export type SyncResult = { status: 'ok' } | { status: 'failed'; reason: FailureReason } | { status: 'not-connected' };

export interface EngineOptions {
  now?: () => Date;
  /** Replaceable in tests. */
  fetch?: typeof fetch;
}

/**
 * One sync cycle: upload local changes, then download and apply the server's.
 * Never throws: the outcome is saved in the sync state (last success, or the
 * last failure with its reason) and returned. Nothing is lost by a failure; the
 * next trigger simply tries again.
 */
export async function runSync(driver: SqlDriver, options: EngineOptions = {}): Promise<SyncResult> {
  const now = options.now ?? (() => new Date());
  const state = await readState(driver);
  if (!state.url || !state.token) return { status: 'not-connected' };
  const connection: ServerConnection = { url: state.url, token: state.token, fetch: options.fetch };
  try {
    await pushChanges(driver, connection, now);
    await pullChanges(driver, connection);
    await writeState(driver, { lastSuccess: now().toISOString(), lastFailure: null });
    return { status: 'ok' };
  } catch (error) {
    const reason: FailureReason = error instanceof SyncError ? error.reason : 'server';
    await writeState(driver, { lastFailure: { at: now().toISOString(), reason } });
    return { status: 'failed', reason };
  }
}
