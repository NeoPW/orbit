import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { createFields } from '../../../core/db/records.ts';
import { areas, settings } from '../../../core/db/schema.ts';
import { push } from '../../../../server/src/push.ts';
import { area } from '../../../../server/src/fixtures.ts';
import { pullChanges } from './pull.ts';
import { readState } from './state.ts';
import { createDevice, createTestServer } from './testing.ts';
import type { WireRow } from './types.ts';

const T9 = '2026-11-05T09:00:00.000Z';
const T10 = '2026-11-05T10:00:00.000Z';
const T11 = '2026-11-05T11:00:00.000Z';

const localArea = (name: string, at: string) => ({
  id: 'a1',
  createdAt: T9,
  updatedAt: at,
  deletedAt: null,
  name,
  color: '#fff',
  sortOrder: 0,
});

describe('pull', () => {
  it('inserts a row the device does not have', async () => {
    const server = await createTestServer();
    const { db, driver } = await createDevice();
    await push(server.driver, { rows: { areas: [area('a1', T10, 'Remote')] } });
    await pullChanges(driver, server.connection());
    expect((await db.select().from(areas)).map((a) => a.name)).toEqual(['Remote']);
  });

  it('replaces an older local row and ignores a newer one', async () => {
    const server = await createTestServer();
    const { db, driver } = await createDevice();
    await db.insert(areas).values(localArea('Old local', T9));
    await push(server.driver, { rows: { areas: [area('a1', T10, 'Remote'), area('a2', T9, 'Other')] } });
    await pullChanges(driver, server.connection());
    expect((await db.select().from(areas).where(eq(areas.id, 'a1')))[0]?.name).toBe('Remote');

    await db.update(areas).set({ name: 'Newer local', updatedAt: T11 }).where(eq(areas.id, 'a1'));
    await push(server.driver, { rows: { areas: [area('a1', T10, 'Remote again')] } }); // ignored by the server (older)
    await server.driver.query('UPDATE areas SET server_seq = server_seq + 100', [], 'run');
    await pullChanges(driver, server.connection());
    expect((await db.select().from(areas).where(eq(areas.id, 'a1')))[0]?.name).toBe('Newer local');
  });

  it('applies a deleted row', async () => {
    const server = await createTestServer();
    const { db, driver } = await createDevice();
    await db.insert(areas).values(localArea('Alive', T9));
    await push(server.driver, { rows: { areas: [{ ...area('a1', T10, 'Alive'), deleted_at: T10 }] } });
    await pullChanges(driver, server.connection());
    expect((await db.select().from(areas))[0]?.deletedAt).toBe(T10);
  });

  it('leaves local settings alone and saves the cursor', async () => {
    const server = await createTestServer();
    const { db, driver } = await createDevice();
    await db.insert(settings).values({ key: 'lead_time_days', value: '3' });
    await push(server.driver, { rows: { areas: [area('a1', T10)] } });
    await pullChanges(driver, server.connection());
    expect((await db.select().from(settings).where(eq(settings.key, 'lead_time_days')))[0]?.value).toBe('3');
    expect((await readState(driver)).cursor).toBeGreaterThan(0);
  });

  it('stores neither rows nor cursor when a page cannot be applied', async () => {
    const server = await createTestServer();
    const { db, driver } = await createDevice();
    // A local check for the same habit and date with another id: the unique index rejects the pulled one.
    await driver.query(
      'INSERT INTO habit_checks (id, created_at, updated_at, deleted_at, habit_id, date, log_entry_id) VALUES (?, ?, ?, NULL, ?, ?, NULL)',
      ['local-check', T9, T9, 'h1', '2026-11-05'],
      'run',
    );
    const check: WireRow = { id: 'remote-check', created_at: T9, updated_at: T10, deleted_at: null, habit_id: 'h1', date: '2026-11-05', log_entry_id: null };
    await push(server.driver, { rows: { areas: [area('a1', T10)], habit_checks: [check] } });
    await expect(pullChanges(driver, server.connection())).rejects.toThrow();
    expect(await db.select().from(areas)).toEqual([]);
    expect((await readState(driver)).cursor).toBe(0);
  });

  it('pulls every page', async () => {
    const server = await createTestServer();
    const { db, driver } = await createDevice();
    const clock = () => new Date(T10);
    const rows = Array.from({ length: 1500 }, (_, i) => area(`a${i}`, T10, `A${i}`));
    for (let i = 0; i < rows.length; i += 500) await push(server.driver, { rows: { areas: rows.slice(i, i + 500) } });
    await db.insert(areas).values({ ...createFields(clock), name: 'local', color: '#fff', sortOrder: 0 });
    const result = await pullChanges(driver, server.connection());
    expect(result.received).toBe(1500);
    expect(await db.select().from(areas)).toHaveLength(1501);
  });
});
