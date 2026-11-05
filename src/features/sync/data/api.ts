import { SCHEMA_VERSION } from '../../../core/db/version.ts';
import type { FailureReason, RowsByTable } from './types.ts';

export class SyncError extends Error {
  readonly reason: FailureReason;

  constructor(reason: FailureReason, message?: string) {
    super(message ?? reason);
    this.reason = reason;
  }
}

export interface ServerConnection {
  /** The server's address, for example `https://orbit.example.workers.dev`. */
  url: string;
  token: string;
  /** Replaceable in tests. */
  fetch?: typeof fetch;
}

export interface StatusResponse {
  hasData: boolean;
  schemaVersion: number;
}

export interface PullResponse {
  rows: RowsByTable;
  cursor: number;
  more: boolean;
}

const TIMEOUT_MS = 30_000;

async function request<T>(
  connection: ServerConnection,
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<T> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${connection.token}`,
    'Orbit-Schema-Version': String(SCHEMA_VERSION),
  };
  if (init.body !== undefined) headers['Content-Type'] = 'application/json';
  let response: Response;
  try {
    response = await (connection.fetch ?? fetch)(new URL(path, connection.url), {
      method: init.method ?? 'GET',
      headers,
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    throw new SyncError('offline');
  }
  if (response.status === 401) throw new SyncError('token');
  if (response.status === 409) throw new SyncError('version');
  if (!response.ok) throw new SyncError('server', `The server answered ${response.status}`);
  try {
    return (await response.json()) as T;
  } catch {
    throw new SyncError('server', 'The server did not answer with JSON');
  }
}

export const getStatus = (c: ServerConnection) => request<StatusResponse>(c, '/api/status');

export const pushRows = (c: ServerConnection, rows: RowsByTable) =>
  request<{ stored: number }>(c, '/api/push', { method: 'POST', body: { rows } });

export const pullRows = (c: ServerConnection, cursor: number) =>
  request<PullResponse>(c, `/api/pull?cursor=${cursor}`);
