import { describe, expect, it } from 'vitest';
import { createFields } from '../../../core/db/records.ts';
import { projects } from '../../../core/db/schema.ts';
import { openTestDatabase } from '../../../core/db/testing.ts';
import { createArea, deleteArea, listAreas, updateArea } from './areas-repository.ts';

const clock = () => new Date('2026-10-07T10:00:00Z');

describe('areas repository', () => {
  it('creates a valid area at the end of the list, with a trimmed name', async () => {
    const { db } = await openTestDatabase();
    await createArea(db, clock, { name: 'Sport', color: '#60A5FA' });
    expect(await createArea(db, clock, { name: '  Family ', color: '#C084FC' })).toEqual({ ok: true });
    const list = await listAreas(db);
    expect(list.map((a) => a.name)).toEqual(['Sport', 'Family']);
    expect(list[1]?.color).toBe('#C084FC');
  });

  it('rejects an empty name', async () => {
    const { db } = await openTestDatabase();
    expect(await createArea(db, clock, { name: '   ', color: '#60A5FA' })).toEqual({ ok: false, error: 'empty' });
    expect(await listAreas(db)).toHaveLength(0);
  });

  it('rejects a duplicate name, case-insensitively', async () => {
    const { db } = await openTestDatabase();
    await createArea(db, clock, { name: 'Sport', color: '#60A5FA' });
    expect(await createArea(db, clock, { name: 'sport', color: '#60A5FA' })).toEqual({ ok: false, error: 'duplicate' });
    expect(await listAreas(db)).toHaveLength(1);
  });

  it('renames an area, also keeping its own name', async () => {
    const { db } = await openTestDatabase();
    await createArea(db, clock, { name: 'Uni', color: '#60A5FA' });
    const [area] = await listAreas(db);
    expect(await updateArea(db, clock, area!.id, { name: 'Uni', color: '#C084FC' })).toEqual({ ok: true });
    expect(await updateArea(db, clock, area!.id, { name: 'University', color: '#C084FC' })).toEqual({ ok: true });
    expect((await listAreas(db))[0]?.name).toBe('University');
  });

  it('deletes an area and clears it on its projects', async () => {
    const { db } = await openTestDatabase();
    await createArea(db, clock, { name: 'Sport', color: '#60A5FA' });
    const [area] = await listAreas(db);
    await db.insert(projects).values({ ...createFields(clock), title: 'Marathon', areaId: area!.id });
    await deleteArea(db, clock, area!.id);
    expect(await listAreas(db)).toHaveLength(0);
    const [project] = await db.select().from(projects);
    expect(project?.areaId).toBeNull();
    expect(project?.deletedAt).toBeNull();
  });
});
