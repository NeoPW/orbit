import { handleApi } from '../../../../server/src/api.ts';
import { openServerTestDatabase } from '../../../../server/src/testing.ts';
import { openTestDatabase } from '../../../core/db/testing.ts';
import type { ServerConnection } from './api.ts';

export const TEST_TOKEN = 'device-token';

/**
 * A sync server on Node (the real request handler over a test database) and a
 * `fetch` that talks to it. `offline` makes every request fail like a lost
 * connection; `beforeRequest` can throw to fail a particular request.
 */
export async function createTestServer() {
  const driver = await openServerTestDatabase();
  const server = {
    driver,
    offline: false,
    requests: [] as { method: string; path: string }[],
    /** Number of rows in each push request received. */
    pushed: [] as number[],
    beforeRequest: undefined as ((request: Request) => void) | undefined,
    tokens: `test=${TEST_TOKEN}`,
    fetch: (async (input: URL | string, init?: RequestInit) => {
      if (server.offline) throw new TypeError('fetch failed');
      const request = new Request(input, init);
      server.requests.push({ method: request.method, path: new URL(request.url).pathname + new URL(request.url).search });
      server.beforeRequest?.(request);
      if (request.method === 'POST' && request.url.endsWith('/api/push')) {
        const body = (await request.clone().json()) as { rows: Record<string, unknown[]> };
        server.pushed.push(Object.values(body.rows).reduce((sum, list) => sum + list.length, 0));
      }
      return handleApi(request, { driver, deviceTokens: server.tokens });
    }) as typeof fetch,
    connection(token = TEST_TOKEN): ServerConnection {
      return { url: 'https://orbit.test', token, fetch: server.fetch };
    },
  };
  return server;
}

export type TestServer = Awaited<ReturnType<typeof createTestServer>>;

/** A device: a migrated in-memory app database (`db` for writes through Drizzle, `driver` for sync). */
export async function createDevice(options: { seed?: boolean } = {}) {
  return openTestDatabase({ seed: options.seed ?? false });
}
