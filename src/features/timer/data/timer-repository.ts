import { eq } from 'drizzle-orm';
import type { Db } from '../../../core/db/drizzle.ts';
import { createFields, deleteFields, newId, TIMER_ID, updateFields, type Clock } from '../../../core/db/records.ts';
import { logEntries, timers } from '../../../core/db/schema.ts';
import { localToday } from '../../../core/dates/deadline.ts';
import { checkHabit } from '../../habits/data/habits-repository.ts';
import { completeTask } from '../../tasks/data/tasks-repository.ts';
import { habitLinks, insertLogEntryQuery, taskLinks, type LogTarget } from '../../work-log/data/log-repository.ts';
import { elapsedMs, loggedMinutes } from '../domain/timer.ts';

export type Timer = typeof timers.$inferSelect;

/** The session (running or paused), also when its project or task is gone or done. */
export async function getTimer(db: Db): Promise<Timer | undefined> {
  const [timer] = await db.select().from(timers).where(eq(timers.id, TIMER_ID));
  return timer && timer.deletedAt === null ? timer : undefined;
}

/** The query that logs the running stretch of a session: source `timer`, at its start, whole minutes (at least 1). */
async function logStretch(db: Db, clock: Clock, timer: Timer, note: string) {
  const links = timer.taskId
    ? await taskLinks(db, timer.taskId)
    : timer.habitId
      ? await habitLinks(db, timer.habitId)
      : { projectId: timer.projectId, goalId: null };
  const id = newId();
  const elapsed = elapsedMs(timer.startedAt, clock());
  const minutes = loggedMinutes(elapsed);
  // Wrapped: a query builder is thenable, so returning it from an async function would run it.
  return {
    id,
    /** The stretch's exact length, for the session's worked time. */
    seconds: Math.floor(elapsed / 1000),
    query: insertLogEntryQuery(
      db,
      clock,
      {
        projectId: links.projectId,
        goalId: links.goalId,
        taskId: timer.taskId,
        habitId: timer.habitId,
        occurredAt: timer.startedAt,
        durationMinutes: minutes,
        note: note.trim(),
        source: 'timer',
      },
      id,
    ),
  };
}

function upsertTimerQuery(db: Db, clock: Clock, target: LogTarget) {
  const now = clock().toISOString();
  const values = {
    projectId: 'projectId' in target ? target.projectId : null,
    taskId: 'taskId' in target ? target.taskId : null,
    habitId: 'habitId' in target ? target.habitId : null,
    startedAt: now,
    plannedMinutes: null,
    pausedAt: null,
    workedSeconds: 0,
    lastEntryId: null,
  };
  return db
    .insert(timers)
    .values({ ...createFields(clock, TIMER_ID), ...values })
    .onConflictDoUpdate({ target: timers.id, set: { ...values, updatedAt: now, deletedAt: null } });
}

/**
 * Starts a session for a project, task or habit, without a time limit. The running stretch of another
 * session is logged first, in the same batch; a paused one just ends.
 */
export async function startTimer(db: Db, clock: Clock, target: LogTarget): Promise<void> {
  const existing = await getTimer(db);
  const start = upsertTimerQuery(db, clock, target);
  if (existing && existing.pausedAt === null) await db.batch([(await logStretch(db, clock, existing, '')).query, start]);
  else await start;
}

/** Logs the running stretch (no note) and pauses the session. Does nothing unless it runs. */
export async function pauseTimer(db: Db, clock: Clock): Promise<void> {
  const running = await getTimer(db);
  if (!running || running.pausedAt !== null) return;
  const stretch = await logStretch(db, clock, running, '');
  await db.batch([
    stretch.query,
    db
      .update(timers)
      .set({
        ...updateFields(clock),
        pausedAt: clock().toISOString(),
        workedSeconds: running.workedSeconds + stretch.seconds,
        lastEntryId: stretch.id,
      })
      .where(eq(timers.id, TIMER_ID)),
  ]);
}

/** Starts a new stretch of a paused session from now. */
export async function resumeTimer(db: Db, clock: Clock): Promise<void> {
  const paused = await getTimer(db);
  if (!paused || paused.pausedAt === null) return;
  await db
    .update(timers)
    .set({ ...updateFields(clock), startedAt: clock().toISOString(), pausedAt: null })
    .where(eq(timers.id, TIMER_ID));
}

/** Sets or removes (null) the session's time limit in worked minutes. */
export async function setTimerLimit(db: Db, clock: Clock, minutes: number | null): Promise<void> {
  const limit = minutes !== null && Number.isInteger(minutes) && minutes > 0 ? minutes : null;
  await db
    .update(timers)
    .set({ ...updateFields(clock), plannedMinutes: limit })
    .where(eq(timers.id, TIMER_ID));
}

/**
 * Ends the session. A running stretch is logged with the note; for a paused session a non-empty note goes on the
 * last logged stretch. A task is then marked done, and with `markHabitDone` a habit is checked for the local date.
 */
export async function completeTimer(db: Db, clock: Clock, note: string, options: { markHabitDone?: boolean } = {}): Promise<void> {
  const session = await getTimer(db);
  if (!session) return;
  const end = db.update(timers).set(deleteFields(clock)).where(eq(timers.id, TIMER_ID));
  if (session.pausedAt === null) {
    await db.batch([(await logStretch(db, clock, session, note)).query, end]);
  } else if (note.trim() && session.lastEntryId) {
    await db.batch([
      db
        .update(logEntries)
        .set({ ...updateFields(clock), note: note.trim() })
        .where(eq(logEntries.id, session.lastEntryId)),
      end,
    ]);
  } else {
    await end;
  }
  if (session.taskId) await completeTask(db, clock, session.taskId, { kind: 'skip' });
  if (options.markHabitDone && session.habitId) await checkHabit(db, clock, session.habitId, localToday(clock()));
}

/** Ends the session and drops the running stretch; stretches logged by pausing stay. */
export async function discardTimer(db: Db, clock: Clock): Promise<void> {
  await db.update(timers).set(deleteFields(clock)).where(eq(timers.id, TIMER_ID));
}
