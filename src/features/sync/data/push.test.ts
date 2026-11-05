import { describe, expect, it } from 'vitest';
import { createFields, deleteFields, updateFields } from '../../../core/db/records.ts';
import { areas } from '../../../core/db/schema.ts';
import { eq } from 'drizzle-orm';
import { pushChanges } from './push.ts';
import { readState } from './state.ts';
import { createDevice, createTestServer } from './testing.ts';

/** A clock that moves forward by one second on every call. */
function ticking(start = Date.UTC(2026, 10, 5, 10, 0, 0)) {
  let t = start;
  return () => new Date((t += 1000));
}

const serverAreas = async (server: Awaited<ReturnType<typeof createTestServer>>) =>
  (await server.driver.query('SELECT id, name, deleted_at FROM areas', [], 'all')).rows;

describe('push', () => {
  it('stores 1200 changed records on the server', async () => {
    const server = await createTestServer();
    const { db, driver } = await createDevice();
    const clock = ticking();
    await db.insert(areas).values(
      Array.from({ length: 1200 }, (_, i) => ({ ...createFields(clock), name: `A${i}`, color: '#fff', sortOrder: i })),
    );
    await pushChanges(driver, server.connection(), clock);
    expect(await serverAreas(server)).toHaveLength(1200);
    expect(server.pushed).toEqual([500, 500, 200]);
  });

  it('continues with the rest after a lost connection, without sending stored parts again', async () => {
    const server = await createTestServer();
    const { db, driver } = await createDevice();
    const clock = ticking();
    await db.insert(areas).values(
      Array.from({ length: 600 }, (_, i) => ({ ...createFields(clock), name: `A${i}`, color: '#fff', sortOrder: i })),
    );
    server.beforeRequest = () => {
      if (server.pushed.length === 1) throw new TypeError('connection lost');
    };
    await expect(pushChanges(driver, server.connection(), clock)).rejects.toThrow();
    expect(await serverAreas(server)).toHaveLength(500);
    server.beforeRequest = undefined;
    await pushChanges(driver, server.connection(), clock);
    expect(server.pushed).toEqual([500, 100]);
    expect(await serverAreas(server)).toHaveLength(600);
  });

  it('still uploads a local edit after rows with a fast clock were pulled', async () => {
    const server = await createTestServer();
    const { db, driver } = await createDevice();
    const now = new Date(Date.UTC(2026, 10, 5, 10, 0, 0));
    const future = { ...createFields(() => new Date(now.getTime() + 3_600_000)), name: 'Future', color: '#fff', sortOrder: 0 };
    const local = { ...createFields(() => now), name: 'Local', color: '#fff', sortOrder: 1 };
    await db.insert(areas).values([future, local]);
    await pushChanges(driver, server.connection(), () => now);
    const later = new Date(now.getTime() + 60_000);
    await db.update(areas).set({ name: 'Edited', ...updateFields(() => later) }).where(eq(areas.id, local.id));
    await pushChanges(driver, server.connection(), () => new Date(later.getTime() + 1000));
    const names = (await serverAreas(server)).map((r) => r[1]);
    expect(names).toContain('Edited');
  });

  it('uploads a deleted record', async () => {
    const server = await createTestServer();
    const { db, driver } = await createDevice();
    const clock = ticking();
    const row = { ...createFields(clock), name: 'Gone', color: '#fff', sortOrder: 0 };
    await db.insert(areas).values(row);
    await pushChanges(driver, server.connection(), clock);
    await db.update(areas).set(deleteFields(clock)).where(eq(areas.id, row.id));
    await pushChanges(driver, server.connection(), clock);
    expect((await serverAreas(server))[0]?.[2]).not.toBeNull();
  });

  it('sends nothing when nothing changed', async () => {
    const server = await createTestServer();
    const { driver } = await createDevice();
    const clock = ticking();
    await pushChanges(driver, server.connection(), clock);
    await pushChanges(driver, server.connection(), clock);
    expect(server.pushed).toEqual([]);
    expect((await readState(driver)).pushedUntil).not.toBeNull();
  });
});
