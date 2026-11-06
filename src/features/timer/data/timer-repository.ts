import { eq } from 'drizzle-orm';
import type { Db } from '../../../core/db/drizzle.ts';
import { createFields, deleteFields, TIMER_ID, type Clock } from '../../../core/db/records.ts';
import { timers } from '../../../core/db/schema.ts';
import { localToday } from '../../../core/dates/deadline.ts';
import { checkHabit } from '../../habits/data/habits-repository.ts';
import { habitLinks, insertLogEntryQuery, taskLinks, type LogTarget } from '../../work-log/data/log-repository.ts';
import { elapsedMs, loggedMinutes } from '../domain/timer.ts';

export type Timer = typeof timers.$inferSelect;

/** The running timer, also when its project or task is gone or done. */
export async function getTimer(db: Db): Promise<Timer | undefined> {
  const [timer] = await db.select().from(timers).where(eq(timers.id, TIMER_ID));
  return timer && timer.deletedAt === null ? timer : undefined;
}

/** The query that logs a timer's time: source `timer`, at its start, whole minutes (at least 1). */
async function logTimerQuery(db: Db, clock: Clock, timer: Timer, note: string) {
  const links = timer.taskId
    ? await taskLinks(db, timer.taskId)
    : timer.habitId
      ? await habitLinks(db, timer.habitId)
      : { projectId: timer.projectId, goalId: null };
  // Wrapped: a query builder is thenable, so returning it from an async function would run it.
  return {
    query: insertLogEntryQuery(db, clock, {
      projectId: links.projectId,
      goalId: links.goalId,
      taskId: timer.taskId,
      habitId: timer.habitId,
      occurredAt: timer.startedAt,
      durationMinutes: loggedMinutes(elapsedMs(timer.startedAt, clock())),
      note: note.trim(),
      source: 'timer',
    }),
  };
}

function upsertTimerQuery(db: Db, clock: Clock, target: LogTarget, plannedMinutes: number | null) {
  const now = clock().toISOString();
  const values = {
    projectId: 'projectId' in target ? target.projectId : null,
    taskId: 'taskId' in target ? target.taskId : null,
    habitId: 'habitId' in target ? target.habitId : null,
    startedAt: now,
    plannedMinutes,
  };
  return db
    .insert(timers)
    .values({ ...createFields(clock, TIMER_ID), ...values })
    .onConflictDoUpdate({ target: timers.id, set: { ...values, updatedAt: now, deletedAt: null } });
}

/** Starts the timer for a project, task or habit; a running timer is logged first, in the same batch. */
export async function startTimer(db: Db, clock: Clock, target: LogTarget, plannedMinutes: number | null): Promise<void> {
  const running = await getTimer(db);
  const start = upsertTimerQuery(db, clock, target, plannedMinutes);
  if (running) await db.batch([(await logTimerQuery(db, clock, running, '')).query, start]);
  else await start;
}

/**
 * Writes the log entry (with the note) and ends the timer, in one batch. Does nothing without a running timer.
 * With `markHabitDone` a habit timer also checks its habit for the local date of the stop.
 */
export async function stopTimer(db: Db, clock: Clock, note: string, options: { markHabitDone?: boolean } = {}): Promise<void> {
  const running = await getTimer(db);
  if (!running) return;
  await db.batch([
    (await logTimerQuery(db, clock, running, note)).query,
    db.update(timers).set(deleteFields(clock)).where(eq(timers.id, TIMER_ID)),
  ]);
  if (options.markHabitDone && running.habitId) await checkHabit(db, clock, running.habitId, localToday(clock()));
}

/** Ends the timer without a log entry. */
export async function discardTimer(db: Db, clock: Clock): Promise<void> {
  await db.update(timers).set(deleteFields(clock)).where(eq(timers.id, TIMER_ID));
}
