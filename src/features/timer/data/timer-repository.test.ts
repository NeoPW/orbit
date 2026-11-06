import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { createFields, TIMER_ID } from '../../../core/db/records.ts';
import { logEntries, tasks, timers } from '../../../core/db/schema.ts';
import { openTestDatabase } from '../../../core/db/testing.ts';
import { createHabit, listChecksSince } from '../../habits/data/habits-repository.ts';
import { applyPage } from '../../sync/data/pull.ts';
import { discardTimer, getTimer, startTimer, stopTimer } from './timer-repository.ts';

const at =
  (hhmm: string, seconds = '00') =>
  () =>
    new Date(`2026-11-05T${hhmm}:${seconds}Z`);

const entries = async (db: Awaited<ReturnType<typeof openTestDatabase>>['db']) =>
  (await db.select().from(logEntries)).filter((e) => e.deletedAt === null);

describe('timer repository', () => {
  it('logs a project timer after 45 minutes and ends it', async () => {
    const { db } = await openTestDatabase();
    await startTimer(db, at('09:00'), { projectId: 'thesis' }, 50);
    expect(await getTimer(db)).toMatchObject({ projectId: 'thesis', plannedMinutes: 50 });
    await stopTimer(db, at('09:45'), '');
    expect(await getTimer(db)).toBeUndefined();
    expect(await entries(db)).toMatchObject([
      { projectId: 'thesis', occurredAt: '2026-11-05T09:00:00.000Z', durationMinutes: 45, source: 'timer' },
    ]);
  });

  it('logs a habit timer on the habit with its project and goal', async () => {
    const { db } = await openTestDatabase();
    const made = await createHabit(db, at('08:00'), {
      title: 'Run 5 km',
      projectId: 'p1',
      goalId: null,
      scheduleType: 'weekdays',
      weekdays: [1],
      timesPerWeek: null,
      reminderTime: null,
      active: true,
    });
    if (!made.ok) throw new Error('habit invalid');
    await startTimer(db, at('07:00'), { habitId: made.id }, null);
    expect(await getTimer(db)).toMatchObject({ habitId: made.id, taskId: null });
    await stopTimer(db, at('07:40'), 'Easy pace');
    expect(await entries(db)).toMatchObject([
      { habitId: made.id, projectId: 'p1', taskId: null, durationMinutes: 40, source: 'timer', note: 'Easy pace' },
    ]);
  });

  it('checks the habit on stop only when asked', async () => {
    const { db } = await openTestDatabase();
    const input = {
      title: 'Run',
      projectId: null,
      goalId: null,
      scheduleType: 'weekdays' as const,
      weekdays: [1],
      timesPerWeek: null,
      reminderTime: null,
      active: true,
    };
    const made = await createHabit(db, at('06:00'), input);
    if (!made.ok) throw new Error('habit invalid');
    await startTimer(db, at('07:00'), { habitId: made.id }, null);
    await stopTimer(db, at('07:30'), '', { markHabitDone: false });
    expect(await listChecksSince(db, '1970-01-01')).toHaveLength(0);
    await startTimer(db, at('08:00'), { habitId: made.id }, null);
    await stopTimer(db, at('08:30'), '', { markHabitDone: true });
    expect(await listChecksSince(db, '1970-01-01')).toHaveLength(1);
  });

  it('logs at least one minute', async () => {
    const { db } = await openTestDatabase();
    await startTimer(db, at('09:00'), { projectId: 'p' }, null);
    await stopTimer(db, at('09:00', '20'), '');
    expect((await entries(db))[0]?.durationMinutes).toBe(1);
  });

  it('logs a task timer on the task and its goal, also when the task is done', async () => {
    const { db } = await openTestDatabase();
    const task = { ...createFields(at('08:00')), title: 'Book physio', goalId: 'g1', status: 'done' as const };
    await db.insert(tasks).values(task);
    await startTimer(db, at('09:00'), { taskId: task.id }, null);
    await stopTimer(db, at('09:10'), '');
    expect((await entries(db))[0]).toMatchObject({ taskId: task.id, goalId: 'g1', projectId: null });
  });

  it('saves the stop note', async () => {
    const { db } = await openTestDatabase();
    await startTimer(db, at('09:00'), { projectId: 'p' }, null);
    await stopTimer(db, at('09:30'), ' Drafted chapter 2 ');
    expect((await entries(db))[0]?.note).toBe('Drafted chapter 2');
  });

  it('logs the running timer when switching to another project', async () => {
    const { db } = await openTestDatabase();
    await startTimer(db, at('09:00'), { projectId: 'thesis' }, null);
    await startTimer(db, at('09:30'), { projectId: 'garden' }, 25);
    expect(await entries(db)).toMatchObject([{ projectId: 'thesis', durationMinutes: 30, source: 'timer' }]);
    expect(await getTimer(db)).toMatchObject({ projectId: 'garden', startedAt: '2026-11-05T09:30:00.000Z', plannedMinutes: 25 });
  });

  it('discards without a log entry and can start again', async () => {
    const { db } = await openTestDatabase();
    await startTimer(db, at('09:00'), { projectId: 'p' }, null);
    await discardTimer(db, at('09:20'));
    expect(await getTimer(db)).toBeUndefined();
    expect(await entries(db)).toHaveLength(0);
    await startTimer(db, at('10:00'), { taskId: 't' }, null);
    expect(await getTimer(db)).toMatchObject({ taskId: 't', projectId: null, deletedAt: null });
  });

  it('keeps the later start when two devices started before syncing', async () => {
    const phone = await openTestDatabase();
    const browser = await openTestDatabase();
    await startTimer(phone.db, at('09:00'), { projectId: 'thesis' }, null);
    await startTimer(browser.db, at('09:05'), { projectId: 'garden' }, null);
    const wire = async (db: typeof phone.db) => {
      const [t] = await db.select().from(timers).where(eq(timers.id, TIMER_ID));
      return {
        id: t!.id,
        created_at: t!.createdAt,
        updated_at: t!.updatedAt,
        deleted_at: t!.deletedAt,
        project_id: t!.projectId,
        task_id: t!.taskId,
        started_at: t!.startedAt,
        planned_minutes: t!.plannedMinutes,
      };
    };
    const [fromPhone, fromBrowser] = [await wire(phone.db), await wire(browser.db)];
    await applyPage(phone.driver, { timers: [fromBrowser] }, 1);
    await applyPage(browser.driver, { timers: [fromPhone] }, 1);
    expect((await getTimer(phone.db))?.projectId).toBe('garden');
    expect((await getTimer(browser.db))?.projectId).toBe('garden');
    expect(await entries(phone.db)).toHaveLength(0);
  });
});
