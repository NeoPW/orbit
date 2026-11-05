import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { openTestDatabase } from '../../core/db/testing.ts';
import { areas, projects } from '../../core/db/schema.ts';
import { createFields } from '../../core/db/records.ts';
import { createNodeDriver } from './node.ts';

const clock = () => new Date('2026-11-05T10:00:00.000Z');

describe('node driver', () => {
  it('returns both id columns of a join', async () => {
    const { db } = await openTestDatabase();
    await db.insert(areas).values({ ...createFields(clock, 'area-1'), name: 'Job', color: '#1E88E5' });
    await db
      .insert(projects)
      .values({ ...createFields(clock, 'project-1'), title: 'P', areaId: 'area-1' });
    const rows = await db
      .select()
      .from(projects)
      .innerJoin(areas, eq(projects.areaId, areas.id));
    expect(rows).toHaveLength(1);
    expect(rows[0]?.projects.id).toBe('project-1');
    expect(rows[0]?.areas.id).toBe('area-1');
  });

  it('returns undefined for a get without a row', async () => {
    const { db } = await openTestDatabase();
    expect(await db.select().from(areas).where(eq(areas.id, 'none')).get()).toBeUndefined();
  });

  it('stores neither insert when the second of a batch is rejected', async () => {
    const { db, driver } = await openTestDatabase();
    const first = { ...createFields(clock, 'a-1'), name: 'Job', color: '#000000' };
    const duplicate = { ...first, name: 'Dup' };
    await expect(
      db.batch([db.insert(areas).values(first), db.insert(areas).values(duplicate)]),
    ).rejects.toThrow();
    const { rows } = await driver.query('SELECT count(*) FROM areas', [], 'get');
    expect(rows[0]?.[0]).toBe(0);
  });

  it('returns plain numbers for integers', async () => {
    const driver = createNodeDriver();
    const { rows } = await driver.query('SELECT 42, 1.5, NULL, \'x\'', [], 'get');
    expect(rows[0]).toEqual([42, 1.5, null, 'x']);
  });
});
