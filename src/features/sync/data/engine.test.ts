import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { createFields, naturalId, TIMER_ID, updateFields, deleteFields } from '../../../core/db/records.ts';
import { goals, habitChecks, projects, settings, timers } from '../../../core/db/schema.ts';
import { runSync } from './engine.ts';
import { readState, writeState } from './state.ts';
import { createDevice, createTestServer, type TestServer } from './testing.ts';

type Device = Awaited<ReturnType<typeof createDevice>>;

/** One clock shared by all devices, one second per call. */
function ticking(start = Date.UTC(2026, 10, 5, 10, 0, 0)) {
  let t = start;
  return () => new Date((t += 1000));
}

async function connected(): Promise<Device> {
  const device = await createDevice();
  await writeState(device.driver, { url: 'https://orbit.test', token: 'device-token' });
  return device;
}

const sync = (device: Device, server: TestServer, now: () => Date) => runSync(device.driver, { fetch: server.fetch, now });

const newProject = (title: string, clock: () => Date) => ({ ...createFields(clock), title });
const titles = async (device: Device) => (await device.db.select().from(projects)).map((p) => p.title);

describe('sync engine', () => {
  it('does nothing when not connected', async () => {
    const device = await createDevice();
    expect(await runSync(device.driver)).toEqual({ status: 'not-connected' });
  });

  it('brings a rename from one device to the other', async () => {
    const server = await createTestServer();
    const clock = ticking();
    const phone = await connected();
    const browser = await connected();
    const project = newProject('Old', clock);
    await phone.db.insert(projects).values(project);
    await sync(phone, server, clock);
    await sync(browser, server, clock);
    expect(await titles(browser)).toEqual(['Old']);
    await phone.db.update(projects).set({ title: 'New', ...updateFields(clock) }).where(eq(projects.id, project.id));
    await sync(phone, server, clock);
    await sync(browser, server, clock);
    expect(await titles(browser)).toEqual(['New']);
  });

  it('propagates a delete', async () => {
    const server = await createTestServer();
    const clock = ticking();
    const phone = await connected();
    const browser = await connected();
    const project = newProject('Doomed', clock);
    await phone.db.insert(projects).values(project);
    await sync(phone, server, clock);
    await sync(browser, server, clock);
    await browser.db.update(projects).set(deleteFields(clock)).where(eq(projects.id, project.id));
    await sync(browser, server, clock);
    await sync(phone, server, clock);
    expect((await phone.db.select().from(projects))[0]?.deletedAt).not.toBeNull();
  });

  it('keeps local settings local', async () => {
    const server = await createTestServer();
    const clock = ticking();
    const phone = await connected();
    const browser = await connected();
    await browser.db.insert(settings).values({ key: 'lead_time_days', value: '7' });
    await phone.db.insert(settings).values({ key: 'lead_time_days', value: '3' });
    await sync(phone, server, clock);
    await sync(browser, server, clock);
    await sync(phone, server, clock);
    const value = async (d: Device) => (await d.db.select().from(settings).where(eq(settings.key, 'lead_time_days')))[0]?.value;
    expect(await value(browser)).toBe('7');
    expect(await value(phone)).toBe('3');
  });

  it('ends with the later edit on both devices', async () => {
    const server = await createTestServer();
    const clock = ticking();
    const phone = await connected();
    const browser = await connected();
    const project = newProject('Start', clock);
    await phone.db.insert(projects).values(project);
    await sync(phone, server, clock);
    await sync(browser, server, clock);
    const edit = (d: Device, title: string, at: string) =>
      d.db.update(projects).set({ title, updatedAt: at }).where(eq(projects.id, project.id));
    await edit(phone, 'Phone 10:00', '2026-11-06T10:00:00.000Z');
    await edit(browser, 'Browser 10:05', '2026-11-06T10:05:00.000Z');
    await sync(browser, server, clock);
    await sync(phone, server, clock);
    await sync(browser, server, clock);
    expect(await titles(phone)).toEqual(['Browser 10:05']);
    expect(await titles(browser)).toEqual(['Browser 10:05']);
  });

  it('ends with one habit check when both devices checked the same day', async () => {
    const server = await createTestServer();
    const clock = ticking();
    const phone = await connected();
    const browser = await connected();
    const id = naturalId('habit_check', 'habit-1', '2026-11-05');
    for (const d of [phone, browser]) {
      await d.db.insert(habitChecks).values({ ...createFields(clock, id), habitId: 'habit-1', date: '2026-11-05' });
    }
    await sync(phone, server, clock);
    await sync(browser, server, clock);
    await sync(phone, server, clock);
    expect(await phone.db.select().from(habitChecks)).toHaveLength(1);
    expect(await browser.db.select().from(habitChecks)).toHaveLength(1);
  });

  it('ends with the later timer when both devices started one', async () => {
    const server = await createTestServer();
    const clock = ticking();
    const phone = await connected();
    const browser = await connected();
    const timer = (at: string) => ({ ...createFields(() => new Date(at), TIMER_ID), startedAt: at });
    await phone.db.insert(timers).values(timer('2026-11-06T09:00:00.000Z'));
    await browser.db.insert(timers).values(timer('2026-11-06T09:30:00.000Z'));
    await sync(phone, server, clock);
    await sync(browser, server, clock);
    await sync(phone, server, clock);
    for (const d of [phone, browser]) {
      const rows = await d.db.select().from(timers);
      expect(rows.map((t) => t.startedAt)).toEqual(['2026-11-06T09:30:00.000Z']);
    }
  });

  it('records an offline failure and uploads the change at the next sync', async () => {
    const server = await createTestServer();
    const clock = ticking();
    const device = await connected();
    await device.db.insert(projects).values(newProject('Offline', clock));
    server.offline = true;
    expect(await sync(device, server, clock)).toEqual({ status: 'failed', reason: 'offline' });
    expect((await readState(device.driver)).lastFailure?.reason).toBe('offline');
    server.offline = false;
    expect(await sync(device, server, clock)).toEqual({ status: 'ok' });
    expect((await server.driver.query('SELECT title FROM projects', [], 'all')).rows).toEqual([['Offline']]);
  });

  it('records a refused token and keeps the local data', async () => {
    const server = await createTestServer();
    const clock = ticking();
    const device = await connected();
    await device.db.insert(projects).values(newProject('Mine', clock));
    server.tokens = 'other=different';
    expect(await sync(device, server, clock)).toEqual({ status: 'failed', reason: 'token' });
    expect(await titles(device)).toEqual(['Mine']);
  });

  it('keeps a new goal on a version mismatch and uploads it once the versions match', async () => {
    const server = await createTestServer();
    const clock = ticking();
    const device = await connected();
    await device.db.insert(goals).values({ ...createFields(clock), title: 'Fit' });
    const newer = (async (input: URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      headers.set('Orbit-Schema-Version', '999');
      return server.fetch(input, { ...init, headers });
    }) as typeof fetch;
    expect(await runSync(device.driver, { fetch: newer, now: clock })).toEqual({ status: 'failed', reason: 'version' });
    expect((await device.db.select().from(goals)).map((g) => g.title)).toEqual(['Fit']);
    expect(await sync(device, server, clock)).toEqual({ status: 'ok' });
    expect((await server.driver.query('SELECT title FROM goals', [], 'all')).rows).toEqual([['Fit']]);
  });

  it('uploads a rename made while the pull is running at the next sync', async () => {
    const server = await createTestServer();
    const clock = ticking();
    const phone = await connected();
    const device = await connected();
    const project = newProject('Before', clock);
    await device.db.insert(projects).values(project);
    await sync(device, server, clock);
    await phone.db.insert(projects).values(newProject('Other', clock));
    await sync(phone, server, clock); // something to pull on the device
    let renamed = false;
    server.beforeRequest = (request) => {
      if (request.url.includes('/api/pull') && !renamed) {
        renamed = true;
        device.db.update(projects).set({ title: 'During pull', ...updateFields(clock) }).where(eq(projects.id, project.id)).then(() => undefined); // a Drizzle query only runs when awaited or chained
      }
    };
    await sync(device, server, clock);
    server.beforeRequest = undefined;
    await sync(device, server, clock);
    const rows = (await server.driver.query('SELECT title FROM projects WHERE id = ?', [project.id], 'all')).rows;
    expect(rows).toEqual([['During pull']]);
  });

  it('records the time of a success and clears an earlier failure', async () => {
    const server = await createTestServer();
    const clock = ticking();
    const device = await connected();
    server.offline = true;
    await sync(device, server, clock);
    server.offline = false;
    await sync(device, server, clock);
    const state = await readState(device.driver);
    expect(state.lastFailure).toBeNull();
    expect(state.lastSuccess).not.toBeNull();
  });
});
