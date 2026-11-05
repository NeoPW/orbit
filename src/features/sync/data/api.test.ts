import { describe, expect, it } from 'vitest';
import { getStatus, pullRows, pushRows, SyncError } from './api.ts';
import { createTestServer } from './testing.ts';

async function reasonOf(promise: Promise<unknown>) {
  const error = await promise.then(
    () => undefined,
    (e: unknown) => e,
  );
  expect(error).toBeInstanceOf(SyncError);
  return (error as SyncError).reason;
}

describe('sync api', () => {
  it('reads the status with a valid token', async () => {
    const server = await createTestServer();
    expect(await getStatus(server.connection())).toMatchObject({ hasData: false });
  });

  it('maps a thrown fetch to offline', async () => {
    const server = await createTestServer();
    server.offline = true;
    expect(await reasonOf(getStatus(server.connection()))).toBe('offline');
  });

  it('maps 401 to token', async () => {
    const server = await createTestServer();
    expect(await reasonOf(pullRows(server.connection('wrong'), 0))).toBe('token');
  });

  it('maps 409 to version', async () => {
    const server = await createTestServer();
    const connection = { ...server.connection(), fetch: (async (input: URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      headers.set('Orbit-Schema-Version', '999');
      return server.fetch(input, { ...init, headers });
    }) as typeof fetch };
    expect(await reasonOf(pushRows(connection, {}))).toBe('version');
  });

  it('maps any other failure to server', async () => {
    const server = await createTestServer();
    const connection = { ...server.connection(), fetch: (async () => new Response('x', { status: 500 })) as typeof fetch };
    expect(await reasonOf(getStatus(connection))).toBe('server');
  });
});
