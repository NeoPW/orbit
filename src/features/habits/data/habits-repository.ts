import { and, eq, gte } from 'drizzle-orm';
import type { Db } from '../../../core/db/drizzle.ts';
import { createFields, deleteFields, naturalId, newId, notDeleted, updateFields, type Clock } from '../../../core/db/records.ts';
import { goals, habitChecks, habits, measures, projects, type ScheduleType } from '../../../core/db/schema.ts';
import { deleteLogEntryQuery, insertLogEntryQuery } from '../../work-log/data/log-repository.ts';
import { validateSchedule } from '../domain/habits.ts';

export type Habit = typeof habits.$inferSelect;
export type HabitCheck = typeof habitChecks.$inferSelect;

export interface HabitInput {
  title: string;
  projectId: string | null;
  goalId: string | null;
  scheduleType: ScheduleType;
  /** ISO weekday numbers (1 = Monday), used for `weekdays`. */
  weekdays: number[];
  /** Used for `times_per_week`. */
  timesPerWeek: number | null;
  /** `HH:mm`, or null to use the default reminder time. */
  reminderTime: string | null;
  active: boolean;
}

export interface HabitErrors {
  title?: string;
  weekdays?: string;
  timesPerWeek?: string;
}

export type HabitResult = { ok: true; id: string } | { ok: false; errors: HabitErrors };

function validate(input: HabitInput): HabitErrors {
  return { ...(input.title.trim() === '' ? { title: 'Enter a title' } : {}), ...validateSchedule(input) };
}

/** Only the schedule fields of the chosen type are stored. */
function valuesOf(input: HabitInput) {
  return {
    title: input.title.trim(),
    projectId: input.projectId,
    goalId: input.goalId,
    scheduleType: input.scheduleType,
    weekdays: input.scheduleType === 'weekdays' ? [...new Set(input.weekdays)].sort((a, b) => a - b) : null,
    timesPerWeek: input.scheduleType === 'times_per_week' ? input.timesPerWeek : null,
    reminderTime: input.reminderTime || null,
    active: input.active,
  };
}

/** All habits, oldest first. */
export function listHabits(db: Db): Promise<Habit[]> {
  return db.select().from(habits).where(notDeleted(habits)).orderBy(habits.createdAt);
}

export async function createHabit(db: Db, clock: Clock, input: HabitInput): Promise<HabitResult> {
  const errors = validate(input);
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  const fields = createFields(clock);
  await db.insert(habits).values({ ...fields, ...valuesOf(input) });
  return { ok: true, id: fields.id };
}

export async function updateHabit(db: Db, clock: Clock, id: string, input: HabitInput): Promise<HabitResult> {
  const errors = validate(input);
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  await db.update(habits).set({ ...updateFields(clock), ...valuesOf(input) }).where(and(eq(habits.id, id), notDeleted(habits)));
  return { ok: true, id };
}

/** Soft-deletes the habit and clears `habit_id` on its measures, in one batch. */
export async function deleteHabit(db: Db, clock: Clock, id: string): Promise<void> {
  await db.batch([
    db.update(habits).set(deleteFields(clock)).where(eq(habits.id, id)),
    db.update(measures).set({ ...updateFields(clock), habitId: null }).where(and(eq(measures.habitId, id), notDeleted(measures))),
  ]);
}

/**
 * Checks the habit for `date` (local `yyyy-mm-dd`): the check (natural ID) and its log entry in one batch.
 * Checking again is a no-op. A check that was unchecked earlier is revived with a new log entry.
 */
export async function checkHabit(db: Db, clock: Clock, habitId: string, date: string): Promise<void> {
  const checkId = naturalId('habit_check', habitId, date);
  const [existing] = await db.select().from(habitChecks).where(eq(habitChecks.id, checkId));
  if (existing && existing.deletedAt === null) return;
  const [habit] = await db.select().from(habits).where(and(eq(habits.id, habitId), notDeleted(habits)));
  if (!habit) return;

  const entryId = newId();
  const now = clock().toISOString();
  await db.batch([
    insertLogEntryQuery(
      db,
      clock,
      { projectId: habit.projectId, goalId: habit.goalId, taskId: null, occurredAt: now, durationMinutes: null, note: habit.title, source: 'habit' },
      entryId,
    ),
    db
      .insert(habitChecks)
      .values({ ...createFields(clock, checkId), habitId, date, logEntryId: entryId })
      .onConflictDoUpdate({ target: habitChecks.id, set: { updatedAt: now, deletedAt: null, logEntryId: entryId } }),
  ]);
}

/** Removes the habit's check for `date` and the log entry created with it, in one batch. */
export async function uncheckHabit(db: Db, clock: Clock, habitId: string, date: string): Promise<void> {
  const [check] = await db
    .select()
    .from(habitChecks)
    .where(and(eq(habitChecks.id, naturalId('habit_check', habitId, date)), notDeleted(habitChecks)));
  if (!check) return;
  const remove = db.update(habitChecks).set(deleteFields(clock)).where(eq(habitChecks.id, check.id));
  if (check.logEntryId) await db.batch([remove, deleteLogEntryQuery(db, clock, check.logEntryId)]);
  else await remove;
}

/** Checks on or after `since` (`yyyy-mm-dd`), for one habit or all habits. */
export function listChecksSince(db: Db, since: string, habitId?: string): Promise<HabitCheck[]> {
  const filter = habitId ? and(notDeleted(habitChecks), gte(habitChecks.date, since), eq(habitChecks.habitId, habitId)) : and(notDeleted(habitChecks), gte(habitChecks.date, since));
  return db.select().from(habitChecks).where(filter).orderBy(habitChecks.date);
}

/** Number of check-ins of the habit on or after `since`, for habit measures. */
export async function countCheckIns(db: Db, habitId: string, since: string): Promise<number> {
  return (await listChecksSince(db, since, habitId)).length;
}

/** Titles of the projects and goals habits can link to, by id, to show a habit's links. */
export async function listLinkTitles(db: Db): Promise<{ projects: Map<string, string>; goals: Map<string, string> }> {
  const [projectRows, goalRows] = await Promise.all([
    db.select({ id: projects.id, title: projects.title }).from(projects).where(notDeleted(projects)),
    db.select({ id: goals.id, title: goals.title }).from(goals).where(notDeleted(goals)),
  ]);
  return { projects: new Map(projectRows.map((r) => [r.id, r.title])), goals: new Map(goalRows.map((r) => [r.id, r.title])) };
}
