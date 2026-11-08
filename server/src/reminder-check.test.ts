import { describe, expect, it } from 'vitest';
import { SCHEMA_VERSION } from '../../src/core/db/version.ts';
import { handleApi } from './api.ts';
import { habit, habitCheck, project, T10_00, T10_05, task } from './fixtures.ts';
import { openServerTestDatabase } from './testing.ts';

const TOKEN = 'secret-token';

async function setup() {
  const driver = await openServerTestDatabase();
  const call = (path: string, body: unknown, init: { token?: string | null; version?: string } = {}) => {
    const headers = new Headers({ 'Orbit-Schema-Version': init.version ?? String(SCHEMA_VERSION) });
    if (init.token !== null) headers.set('Authorization', `Bearer ${init.token ?? TOKEN}`);
    return handleApi(new Request(`https://orbit.test${path}`, { method: 'POST', headers, body: JSON.stringify(body) }), {
      driver,
      deviceTokens: `phone=${TOKEN}`,
    });
  };
  const push = (rows: unknown) => call('/api/push', { rows });
  const needed = async (target: unknown) => ((await (await call('/api/reminder-check', target)).json()) as { needed: boolean }).needed;
  return { call, push, needed };
}

describe('reminder check', () => {
  it('is not needed for a habit checked on that date', async () => {
    const { push, needed } = await setup();
    await push({ habits: [habit('h1', T10_00)], habit_checks: [habitCheck('c1', T10_00, 'h1', '2026-11-09')] });
    expect(await needed({ kind: 'habit', id: 'h1', date: '2026-11-09' })).toBe(false);
  });

  it('is needed for a habit not checked on that date, or whose check was removed', async () => {
    const { push, needed } = await setup();
    await push({ habits: [habit('h1', T10_00)], habit_checks: [habitCheck('c1', T10_00, 'h1', '2026-11-08')] });
    expect(await needed({ kind: 'habit', id: 'h1', date: '2026-11-09' })).toBe(true);
    await push({ habit_checks: [habitCheck('c2', T10_05, 'h1', '2026-11-09', { deleted_at: T10_05 })] });
    expect(await needed({ kind: 'habit', id: 'h1', date: '2026-11-09' })).toBe(true);
  });

  it('is not needed for an inactive or deleted habit', async () => {
    const { push, needed } = await setup();
    await push({ habits: [habit('h1', T10_00, { active: 0 }), habit('h2', T10_00, { deleted_at: T10_00 })] });
    expect(await needed({ kind: 'habit', id: 'h1', date: '2026-11-09' })).toBe(false);
    expect(await needed({ kind: 'habit', id: 'h2', date: '2026-11-09' })).toBe(false);
  });

  it('is needed for an open task, not for a done or deleted one', async () => {
    const { push, needed } = await setup();
    await push({
      tasks: [task('t1', T10_00), task('t2', T10_00, null, { status: 'done' }), task('t3', T10_00, null, { deleted_at: T10_00 })],
    });
    expect(await needed({ kind: 'task', id: 't1' })).toBe(true);
    expect(await needed({ kind: 'task', id: 't2' })).toBe(false);
    expect(await needed({ kind: 'task', id: 't3' })).toBe(false);
  });

  it('is needed for an active project, not for a completed one', async () => {
    const { push, needed } = await setup();
    await push({ projects: [project('p1', T10_00), project('p2', T10_00, 'Done', { status: 'completed' })] });
    expect(await needed({ kind: 'project', id: 'p1' })).toBe(true);
    expect(await needed({ kind: 'project', id: 'p2' })).toBe(false);
  });

  it('is needed for something the server does not know', async () => {
    const { needed } = await setup();
    expect(await needed({ kind: 'task', id: 'unknown' })).toBe(true);
    expect(await needed({ kind: 'habit', id: 'unknown', date: '2026-11-09' })).toBe(true);
  });

  it('refuses a missing token, another schema version and a bad body', async () => {
    const { call } = await setup();
    expect((await call('/api/reminder-check', { kind: 'task', id: 't1' }, { token: null })).status).toBe(401);
    expect((await call('/api/reminder-check', { kind: 'task', id: 't1' }, { version: '1' })).status).toBe(409);
    expect((await call('/api/reminder-check', { kind: 'habit', id: 'h1' })).status).toBe(400);
    expect((await call('/api/reminder-check', { kind: 'goal', id: 'g1' })).status).toBe(400);
  });
});
