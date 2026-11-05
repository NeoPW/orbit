import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { createFields } from '../../../core/db/records.ts';
import { habitChecks, habits, logEntries, projects, tasks } from '../../../core/db/schema.ts';
import { openTestDatabase } from '../../../core/db/testing.ts';
import { checkHabit } from '../../habits/data/habits-repository.ts';
import { addManualEntry, deleteLogEntry, listEntriesForProject, listLogTargets } from './log-repository.ts';

const clock = () => new Date('2026-11-05T10:00:00Z');

describe('log repository', () => {
  it('deletes a manual entry', async () => {
    const { db } = await openTestDatabase();
    const id = await addManualEntry(db, clock, { target: { projectId: 'p1' }, durationMinutes: 30, note: 'x' });
    expect(await listEntriesForProject(db, 'p1')).toHaveLength(1);
    await deleteLogEntry(db, clock, id);
    expect(await listEntriesForProject(db, 'p1')).toHaveLength(0);
  });

  it('deletes a habit entry together with its check', async () => {
    const { db } = await openTestDatabase();
    const habit = { ...createFields(clock), title: 'Run', projectId: 'p1' };
    await db.insert(habits).values(habit);
    await checkHabit(db, clock, habit.id, '2026-11-05');
    const [entry] = await db.select().from(logEntries);
    await deleteLogEntry(db, clock, entry!.id);
    const [check] = await db.select().from(habitChecks);
    expect(check?.deletedAt).not.toBeNull();
    expect((await db.select().from(logEntries).where(eq(logEntries.id, entry!.id)))[0]?.deletedAt).not.toBeNull();
  });

  it('offers active projects and open tasks outside projects', async () => {
    const { db } = await openTestDatabase();
    await db.insert(projects).values([
      { ...createFields(clock), title: 'Active', status: 'active' },
      { ...createFields(clock), title: 'Paused', status: 'paused' },
    ]);
    await db.insert(tasks).values([
      { ...createFields(clock), title: 'Loose' },
      { ...createFields(clock), title: 'In project', projectId: 'p1' },
      { ...createFields(clock), title: 'Done', status: 'done' },
    ]);
    const targets = await listLogTargets(db);
    expect(targets.projects.map((p) => p.title)).toEqual(['Active']);
    expect(targets.tasks.map((t) => t.title)).toEqual(['Loose']);
  });
});
