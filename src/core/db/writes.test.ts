import { describe, expect, it } from 'vitest';
import { createNodeDriver } from '../../platform/db/node.ts';
import { createDb } from './drizzle.ts';
import { migrate } from './migrate.ts';
import { createFields } from './records.ts';
import { areas, settings } from './schema.ts';
import { withWriteNotification } from './writes.ts';

async function setup() {
  const raw = createNodeDriver();
  await migrate(raw);
  let notified = 0;
  const db = createDb(withWriteNotification(raw, () => notified++));
  return { db, notified: () => notified };
}

const area = () => ({ ...createFields(() => new Date()), name: 'A', color: '#fff', sortOrder: 0 });

describe('write notification', () => {
  it('notifies on insert, update and delete of a synced table', async () => {
    const { db, notified } = await setup();
    const row = area();
    await db.insert(areas).values(row);
    expect(notified()).toBe(1);
    await db.update(areas).set({ name: 'B' });
    expect(notified()).toBe(2);
    await db.delete(areas);
    expect(notified()).toBe(3);
  });

  it('notifies once for a batch that writes a synced table', async () => {
    const { db, notified } = await setup();
    await db.batch([db.insert(areas).values(area()), db.insert(settings).values({ key: 'k', value: 'v' })]);
    expect(notified()).toBe(1);
  });

  it('does not notify for settings, selects or a failed write', async () => {
    const { db, notified } = await setup();
    await db.insert(settings).values({ key: 'k', value: 'v' });
    await db.select().from(areas);
    await db.select().from(settings);
    const row = area();
    await db.insert(areas).values(row);
    const before = notified();
    await expect(db.insert(areas).values(row)).rejects.toThrow();
    expect(notified()).toBe(before);
    expect(before).toBe(1);
  });
});
