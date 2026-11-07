import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { createFields } from '../../../core/db/records.ts';
import { habitChecks, habits, logEntries, projects, tasks } from '../../../core/db/schema.ts';
import { openTestDatabase } from '../../../core/db/testing.ts';
import { checkHabit } from '../../habits/data/habits-repository.ts';
import { formatTotal, totalMinutes } from '../domain/work-log.ts';
import {
  addManualEntry,
  deleteLogEntry,
  habitTotals,
  listEntriesForProject,
  listEntriesForTask,
  listLogTargets,
} from './log-repository.ts';

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

describe('total time worked', () => {
  const total = async (entries: Promise<{ durationMinutes: number | null }[]>) => formatTotal(totalMinutes(await entries));

  it('sums the timer and Log work entries of a task, and updates when one is deleted', async () => {
    const { db } = await openTestDatabase();
    const task = { ...createFields(clock), title: 'Rerun benchmarks' };
    await db.insert(tasks).values(task);
    const timerEntry = await addManualEntry(db, clock, { target: { taskId: task.id }, durationMinutes: 45, note: '' });
    await db.update(logEntries).set({ source: 'timer' }).where(eq(logEntries.id, timerEntry));
    await addManualEntry(db, clock, { target: { taskId: task.id }, durationMinutes: 30, note: '' });
    expect(await total(listEntriesForTask(db, task.id))).toBe('1 h 15 min');
    await deleteLogEntry(db, clock, timerEntry);
    expect(await total(listEntriesForTask(db, task.id))).toBe('30 min');
  });

  it('includes the entries of the tasks and habits of a project in its total', async () => {
    const { db } = await openTestDatabase();
    const project = { ...createFields(clock), title: 'Thesis' };
    await db.insert(projects).values(project);
    const task = { ...createFields(clock), title: 'Draft intro', projectId: project.id };
    await db.insert(tasks).values(task);
    const habit = { ...createFields(clock), title: 'Read papers', projectId: project.id, scheduleType: 'weekdays' as const, weekdays: [1] };
    await db.insert(habits).values(habit);
    await addManualEntry(db, clock, { target: { projectId: project.id }, durationMinutes: 60, note: '' });
    await addManualEntry(db, clock, { target: { taskId: task.id }, durationMinutes: 30, note: '' });
    await addManualEntry(db, clock, { target: { habitId: habit.id }, durationMinutes: 20, note: '' });
    expect(await total(listEntriesForProject(db, project.id))).toBe('1 h 50 min');
  });

  it('sums the sessions of a habit and leaves out checks without duration', async () => {
    const { db } = await openTestDatabase();
    const habit = { ...createFields(clock), title: 'Run 5 km', scheduleType: 'weekdays' as const, weekdays: [1] };
    await db.insert(habits).values(habit);
    await addManualEntry(db, clock, { target: { habitId: habit.id }, durationMinutes: 40, note: '' });
    await addManualEntry(db, clock, { target: { habitId: habit.id }, durationMinutes: 40, note: '' });
    await checkHabit(db, clock, habit.id, '2026-11-05');
    expect(formatTotal((await habitTotals(db)).get(habit.id) ?? 0)).toBe('1 h 20 min');
  });

  it('shows "No time logged" without entries that have a duration', async () => {
    const { db } = await openTestDatabase();
    const task = { ...createFields(clock), title: 'Book physio' };
    await db.insert(tasks).values(task);
    expect(await total(listEntriesForTask(db, task.id))).toBe('No time logged');
  });
});
