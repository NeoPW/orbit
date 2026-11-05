import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { area, project } from '../../../../server/src/fixtures.ts';
import { push } from '../../../../server/src/push.ts';
import { createFields, deleteFields } from '../../../core/db/records.ts';
import { areas, projects, settings } from '../../../core/db/schema.ts';
import { seedDefaultAreas } from '../../../core/db/seed.ts';
import { SyncError } from './api.ts';
import { checkServer, disconnect, normalizeServerUrl, saveConnection } from './connect.ts';
import { runSync } from './engine.ts';
import { readState } from './state.ts';
import { createDevice, createTestServer, TEST_TOKEN } from './testing.ts';

const T10 = '2026-11-05T10:00:00.000Z';
const clock = () => new Date('2026-11-05T12:00:00.000Z');

async function refusedWith(promise: Promise<unknown>) {
  const error = await promise.then(
    () => undefined,
    (e: unknown) => e,
  );
  expect(error).toBeInstanceOf(SyncError);
  return (error as SyncError).reason;
}

describe('connecting a device', () => {
  it('uploads all local data, deleted records included, to an empty server', async () => {
    const server = await createTestServer();
    const { db, driver } = await createDevice({ seed: true });
    const gone = (await db.select().from(areas))[0]!;
    await db.update(areas).set(deleteFields(clock)).where(eq(areas.id, gone.id));
    const check = await checkServer('https://orbit.test', TEST_TOKEN, { fetch: server.fetch });
    expect(check.hasData).toBe(false);
    await saveConnection(driver, { url: check.url, token: TEST_TOKEN }, 'upload', clock);
    expect(await runSync(driver, { fetch: server.fetch, now: clock })).toEqual({ status: 'ok' });
    const stored = (await server.driver.query('SELECT id, deleted_at FROM areas', [], 'all')).rows;
    expect(stored).toHaveLength(4);
    expect(stored.find((r) => r[0] === gone.id)?.[1]).not.toBeNull();
  });

  it('replaces local data with the server data after confirmation, uploading nothing', async () => {
    const server = await createTestServer();
    const { db, driver } = await createDevice({ seed: true });
    await db.insert(projects).values({ ...createFields(clock), title: 'Local only' });
    await db.insert(settings).values({ key: 'lead_time_days', value: '3' });
    await push(server.driver, { rows: { areas: [area('server-area', T10, 'From server')], projects: [project('p1', T10, 'Server project')] } });

    const check = await checkServer('https://orbit.test', TEST_TOKEN, { fetch: server.fetch });
    expect(check.hasData).toBe(true);
    await saveConnection(driver, { url: check.url, token: TEST_TOKEN }, 'replace', clock);
    await runSync(driver, { fetch: server.fetch, now: clock });

    expect((await db.select().from(projects)).filter((p) => !p.deletedAt).map((p) => p.title)).toEqual(['Server project']);
    expect((await db.select().from(areas)).filter((a) => !a.deletedAt).map((a) => a.name)).toEqual(['From server']);
    expect(server.pushed).toEqual([]);
    expect((await db.select().from(settings).where(eq(settings.key, 'lead_time_days')))[0]?.value).toBe('3');
    // The default areas are not created again on the next start.
    await seedDefaultAreas(db, clock);
    expect((await db.select().from(areas)).filter((a) => !a.deletedAt)).toHaveLength(1);
  });

  it('leaves the device unconnected and unchanged when not confirmed', async () => {
    const server = await createTestServer();
    const { db, driver } = await createDevice();
    await db.insert(projects).values({ ...createFields(clock), title: 'Mine' });
    await push(server.driver, { rows: { areas: [area('a1', T10)] } });
    const check = await checkServer('https://orbit.test', TEST_TOKEN, { fetch: server.fetch });
    expect(check.hasData).toBe(true); // the user cancels: saveConnection is never called
    expect((await readState(driver)).url).toBeNull();
    expect((await db.select().from(projects)).map((p) => p.title)).toEqual(['Mine']);
  });

  it('reports a refused token and an unreachable server without saving anything', async () => {
    const server = await createTestServer();
    const { driver } = await createDevice();
    expect(await refusedWith(checkServer('https://orbit.test', 'wrong', { fetch: server.fetch }))).toBe('token');
    server.offline = true;
    expect(await refusedWith(checkServer('https://orbit.test', TEST_TOKEN, { fetch: server.fetch }))).toBe('offline');
    expect(await refusedWith(checkServer('not a url at all %%', TEST_TOKEN, { fetch: server.fetch }))).toBe('offline');
    expect(await readState(driver)).toMatchObject({ url: null, token: null });
  });

  it('disconnects, keeps the data and asks for confirmation when connecting again', async () => {
    const server = await createTestServer();
    const { db, driver } = await createDevice();
    await db.insert(projects).values({ ...createFields(clock), title: 'Kept' });
    await saveConnection(driver, { url: 'https://orbit.test', token: TEST_TOKEN }, 'upload', clock);
    await runSync(driver, { fetch: server.fetch, now: clock });
    await disconnect(driver);
    expect(await readState(driver)).toMatchObject({ url: null, token: null, cursor: 0, lastSuccess: null });
    expect((await db.select().from(projects)).map((p) => p.title)).toEqual(['Kept']);
    expect(await runSync(driver, { fetch: server.fetch })).toEqual({ status: 'not-connected' });
    const again = await checkServer('https://orbit.test', TEST_TOKEN, { fetch: server.fetch });
    expect(again.hasData).toBe(true);
  });
});

describe('server addresses', () => {
  it('adds https, drops paths and trailing slashes, and rejects non-addresses', () => {
    expect(normalizeServerUrl('orbit.example.workers.dev')).toBe('https://orbit.example.workers.dev');
    expect(normalizeServerUrl(' https://orbit.example.dev/ ')).toBe('https://orbit.example.dev');
    expect(normalizeServerUrl('http://localhost:8787/api')).toBe('http://localhost:8787');
    expect(normalizeServerUrl('')).toBeNull();
    expect(normalizeServerUrl('ftp://example.com')).toBeNull();
  });
});
