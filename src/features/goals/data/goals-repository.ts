import { and, eq, gte, inArray, max } from 'drizzle-orm';
import type { Db } from '../../../core/db/drizzle.ts';
import { createFields, deleteFields, notDeleted, updateFields, type Clock } from '../../../core/db/records.ts';
import { goals, habitChecks, habits, measures, projects, tasks, type Goal, type GoalStatus, type Measure } from '../../../core/db/schema.ts';

export interface GoalInput {
  title: string;
  description: string;
  /** `yyyy-mm-dd`. */
  startDate: string;
  endDate: string;
  /** Own color, or null for Auto. */
  color: string | null;
}

/** A measure with what its progress needs: the check-ins of its habit since the goal's start (habit measures). */
export interface MeasureView extends Measure {
  checkIns: number;
}

export interface GoalWithMeasures {
  goal: Goal;
  /** Position among all goals in sort order, for the Auto color. */
  index: number;
  measures: MeasureView[];
}

/** Adds the check-in counts to measures. Habit measures count checks of their habit on or after the goal's start. */
async function withCheckIns(db: Db, goal: Goal, rows: Measure[]): Promise<MeasureView[]> {
  const habitIds = [...new Set(rows.flatMap((m) => (m.measureType === 'habit' && m.habitId ? [m.habitId] : [])))];
  const counts = new Map<string, number>();
  if (habitIds.length > 0) {
    const checks = await db
      .select({ habitId: habitChecks.habitId })
      .from(habitChecks)
      .where(and(inArray(habitChecks.habitId, habitIds), gte(habitChecks.date, goal.startDate ?? ''), notDeleted(habitChecks)));
    for (const { habitId } of checks) counts.set(habitId, (counts.get(habitId) ?? 0) + 1);
  }
  return rows.map((m) => ({ ...m, checkIns: m.habitId ? (counts.get(m.habitId) ?? 0) : 0 }));
}

async function allGoals(db: Db): Promise<Goal[]> {
  return db.select().from(goals).where(notDeleted(goals)).orderBy(goals.sortOrder, goals.createdAt);
}

async function loadMeasures(db: Db, goalIds: string[]): Promise<Measure[]> {
  if (goalIds.length === 0) return [];
  return db.select().from(measures).where(and(inArray(measures.goalId, goalIds), notDeleted(measures))).orderBy(measures.sortOrder, measures.createdAt);
}

async function assemble(db: Db, list: Goal[], all: Goal[]): Promise<GoalWithMeasures[]> {
  const rows = await loadMeasures(db, list.map((g) => g.id));
  return Promise.all(
    list.map(async (goal) => ({
      goal,
      index: all.findIndex((g) => g.id === goal.id),
      measures: await withCheckIns(db, goal, rows.filter((m) => m.goalId === goal.id)),
    })),
  );
}

/** Goals with status `active` in sort order, each with its measures. */
export async function listActiveGoals(db: Db): Promise<GoalWithMeasures[]> {
  const all = await allGoals(db);
  return assemble(db, all.filter((g) => g.status === 'active'), all);
}

/** Goals with status `completed` or `archived`, most recently updated first. */
export async function listArchivedGoals(db: Db): Promise<Goal[]> {
  const all = await allGoals(db);
  return all.filter((g) => g.status !== 'active').sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/** One goal of any status with its measures; undefined when missing or deleted. */
export async function getGoal(db: Db, id: string): Promise<GoalWithMeasures | undefined> {
  const all = await allGoals(db);
  const goal = all.find((g) => g.id === id);
  if (!goal) return undefined;
  return (await assemble(db, [goal], all))[0];
}

/** Creates an active goal after the existing goals; returns its id. */
export async function createGoal(db: Db, clock: Clock, input: GoalInput): Promise<string> {
  const [last] = await db.select({ value: max(goals.sortOrder) }).from(goals).where(notDeleted(goals));
  const fields = createFields(clock);
  await db.insert(goals).values({
    ...fields,
    title: input.title.trim(),
    description: input.description.trim(),
    startDate: input.startDate,
    endDate: input.endDate,
    color: input.color,
    status: 'active',
    sortOrder: (last?.value ?? -1) + 1,
  });
  return fields.id;
}

export async function updateGoal(db: Db, clock: Clock, id: string, input: GoalInput): Promise<void> {
  await db
    .update(goals)
    .set({
      ...updateFields(clock),
      title: input.title.trim(),
      description: input.description.trim(),
      startDate: input.startDate,
      endDate: input.endDate,
      color: input.color,
    })
    .where(and(eq(goals.id, id), notDeleted(goals)));
}

export async function setGoalStatus(db: Db, clock: Clock, id: string, status: GoalStatus): Promise<void> {
  await db
    .update(goals)
    .set({ ...updateFields(clock), status })
    .where(and(eq(goals.id, id), notDeleted(goals)));
}

/**
 * Soft-deletes the goal and its measures and clears `goal_id` on its
 * projects, tasks and habits, in one batch. Log entries keep their link.
 */
export async function deleteGoal(db: Db, clock: Clock, id: string): Promise<void> {
  const unlink = { ...updateFields(clock), goalId: null };
  await db.batch([
    db.update(goals).set(deleteFields(clock)).where(eq(goals.id, id)),
    db.update(measures).set(deleteFields(clock)).where(and(eq(measures.goalId, id), notDeleted(measures))),
    db.update(projects).set(unlink).where(and(eq(projects.goalId, id), notDeleted(projects))),
    db.update(tasks).set(unlink).where(and(eq(tasks.goalId, id), notDeleted(tasks))),
    db.update(habits).set(unlink).where(and(eq(habits.goalId, id), notDeleted(habits))),
  ]);
}
