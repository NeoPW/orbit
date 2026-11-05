import { describe, expect, it } from 'vitest';
import { SCHEMA_VERSION } from '../../src/core/db/version.ts';
import { handleApi } from './api.ts';
import { area, T10_00, T10_05 } from './fixtures.ts';
import { openServerTestDatabase } from './testing.ts';

const TOKEN = 'secret-token';

async function setup() {
  const driver = await openServerTestDatabase();
  const call = (
    path: string,
    init: { method?: string; body?: string; token?: string | null; version?: string | null } = {},
  ) => {
    const headers = new Headers();
    if (init.token !== null) headers.set('Authorization', `Bearer ${init.token ?? TOKEN}`);
    if (init.version !== null) headers.set('Orbit-Schema-Version', init.version ?? String(SCHEMA_VERSION));
    return handleApi(new Request(`https://orbit.test${path}`, { method: init.method ?? 'GET', headers, body: init.body }), {
      driver,
      deviceTokens: `desktop=${TOKEN}`,
    });
  };
  const pushRows = (rows: unknown, version?: string | null) =>
    call('/api/push', { method: 'POST', body: JSON.stringify({ rows }), version });
  return { call, pushRows };
}

describe('api', () => {
  it('reports no data on an empty server', async () => {
    const { call } = await setup();
    const response = await call('/api/status', { version: null });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ hasData: false, schemaVersion: SCHEMA_VERSION });
  });

  it('reports data after a row was pushed and pushed again as deleted', async () => {
    const { call, pushRows } = await setup();
    await pushRows({ areas: [area('a1', T10_00)] });
    await pushRows({ areas: [{ ...area('a1', T10_05), deleted_at: T10_05 }] });
    expect(await (await call('/api/status')).json()).toMatchObject({ hasData: true });
  });

  it('pushes and pulls over HTTP', async () => {
    const { call, pushRows } = await setup();
    expect(await (await pushRows({ areas: [area('a1', T10_00)] })).json()).toEqual({ stored: 1 });
    const pulled = (await (await call('/api/pull?cursor=0')).json()) as { rows: { areas: unknown[] }; more: boolean };
    expect(pulled.rows.areas).toHaveLength(1);
    expect(pulled.more).toBe(false);
  });

  it('refuses a different or missing schema version on push and pull', async () => {
    const { call, pushRows } = await setup();
    expect((await pushRows({ areas: [area('a1', T10_00)] }, String(SCHEMA_VERSION + 1))).status).toBe(409);
    expect((await pushRows({ areas: [area('a1', T10_00)] }, null)).status).toBe(409);
    expect((await call('/api/pull', { version: '0' })).status).toBe(409);
    expect((await call('/api/pull', { version: null })).status).toBe(409);
    const pulled = (await (await call('/api/pull')).json()) as { rows: object };
    expect(pulled.rows).toEqual({});
  });

  it('answers an unknown API path with a JSON 404', async () => {
    const { call } = await setup();
    const response = await call('/api/nope');
    expect(response.status).toBe(404);
    expect(response.headers.get('Content-Type')).toBe('application/json');
  });

  it('refuses a missing or wrong token with 401, with CORS headers', async () => {
    const { call } = await setup();
    for (const token of [null, 'wrong']) {
      const response = await call('/api/pull', { token });
      expect(response.status).toBe(401);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    }
  });

  it('answers a preflight without a token', async () => {
    const { call } = await setup();
    const response = await call('/api/push', { method: 'OPTIONS', token: null });
    expect(response.status).toBe(204);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(response.headers.get('Access-Control-Allow-Headers')).toContain('Authorization');
    expect(response.headers.get('Access-Control-Allow-Headers')).toContain('Orbit-Schema-Version');
  });

  it('refuses a body over 1 MB', async () => {
    const { call } = await setup();
    const response = await call('/api/push', { method: 'POST', body: JSON.stringify({ rows: {}, pad: 'x'.repeat(1_000_001) }) });
    expect(response.status).toBe(413);
  });

  it('refuses an invalid JSON body and a bad cursor with 400', async () => {
    const { call } = await setup();
    expect((await call('/api/push', { method: 'POST', body: '{' })).status).toBe(400);
    expect((await call('/api/pull?cursor=abc')).status).toBe(400);
  });
});
