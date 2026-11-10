import { and, eq } from 'drizzle-orm';
import type { Db } from '../../../core/db/drizzle.ts';
import { createFields, deleteFields, notDeleted, updateFields, type Clock } from '../../../core/db/records.ts';
import { exercises, goals, habits, projects, workouts } from '../../../core/db/schema.ts';
import { validateWorkout, type WorkoutErrors } from '../domain/workouts.ts';
import type { Exercise } from './exercises-repository.ts';

export interface WorkoutInput {
  name: string;
  /** The exercises in the workout's order. */
  exerciseIds: string[];
  projectId: string | null;
  goalId: string | null;
  habitId: string | null;
}

export type WorkoutResult = { ok: true; id: string } | { ok: false; errors: WorkoutErrors };

/** A workout with its exercises resolved in order and its links resolved to existing items (else null). */
export interface WorkoutView {
  id: string;
  name: string;
  exercises: Exercise[];
  projectId: string | null;
  goalId: string | null;
  habitId: string | null;
}

function valuesOf(input: WorkoutInput) {
  return {
    name: input.name.trim(),
    exerciseIds: input.exerciseIds,
    projectId: input.projectId,
    goalId: input.goalId,
    habitId: input.habitId,
  };
}

async function existingIds(db: Db): Promise<{ projects: Set<string>; goals: Set<string>; habits: Set<string>; exercises: Map<string, Exercise> }> {
  const [p, g, h, e] = await Promise.all([
    db.select({ id: projects.id }).from(projects).where(notDeleted(projects)),
    db.select({ id: goals.id }).from(goals).where(notDeleted(goals)),
    db.select({ id: habits.id }).from(habits).where(notDeleted(habits)),
    db.select().from(exercises).where(notDeleted(exercises)),
  ]);
  return {
    projects: new Set(p.map((r) => r.id)),
    goals: new Set(g.map((r) => r.id)),
    habits: new Set(h.map((r) => r.id)),
    exercises: new Map(e.map((r) => [r.id, r])),
  };
}

type Row = typeof workouts.$inferSelect;

function viewOf(row: Row, known: Awaited<ReturnType<typeof existingIds>>): WorkoutView {
  return {
    id: row.id,
    name: row.name,
    exercises: row.exerciseIds.flatMap((id) => known.exercises.get(id) ?? []),
    projectId: row.projectId && known.projects.has(row.projectId) ? row.projectId : null,
    goalId: row.goalId && known.goals.has(row.goalId) ? row.goalId : null,
    habitId: row.habitId && known.habits.has(row.habitId) ? row.habitId : null,
  };
}

/** All workouts, by name. */
export async function listWorkouts(db: Db): Promise<WorkoutView[]> {
  const [rows, known] = await Promise.all([db.select().from(workouts).where(notDeleted(workouts)), existingIds(db)]);
  return rows.map((r) => viewOf(r, known)).sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
}

export async function getWorkout(db: Db, id: string): Promise<WorkoutView | undefined> {
  const [[row], known] = await Promise.all([db.select().from(workouts).where(and(eq(workouts.id, id), notDeleted(workouts))), existingIds(db)]);
  return row ? viewOf(row, known) : undefined;
}

export async function createWorkout(db: Db, clock: Clock, input: WorkoutInput): Promise<WorkoutResult> {
  const errors = validateWorkout(input.name, input.exerciseIds);
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  const fields = createFields(clock);
  await db.insert(workouts).values({ ...fields, ...valuesOf(input) });
  return { ok: true, id: fields.id };
}

export async function updateWorkout(db: Db, clock: Clock, id: string, input: WorkoutInput): Promise<WorkoutResult> {
  const errors = validateWorkout(input.name, input.exerciseIds);
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  await db
    .update(workouts)
    .set({ ...updateFields(clock), ...valuesOf(input) })
    .where(and(eq(workouts.id, id), notDeleted(workouts)));
  return { ok: true, id };
}

export async function deleteWorkout(db: Db, clock: Clock, id: string): Promise<void> {
  await db.update(workouts).set(deleteFields(clock)).where(eq(workouts.id, id));
}

export interface LinkOption {
  value: string;
  label: string;
}

export interface LinkOptions {
  projects: LinkOption[];
  goals: LinkOption[];
  habits: LinkOption[];
}

/** Non-completed projects, active goals and active habits, plus the workout's current links (if they still exist). */
export async function loadLinkOptions(db: Db, current: { projectId: string | null; goalId: string | null; habitId: string | null }): Promise<LinkOptions> {
  const [projectRows, goalRows, habitRows] = await Promise.all([
    db.select().from(projects).where(notDeleted(projects)),
    db.select().from(goals).where(notDeleted(goals)).orderBy(goals.sortOrder, goals.createdAt),
    db.select().from(habits).where(notDeleted(habits)).orderBy(habits.createdAt),
  ]);
  return {
    projects: projectRows
      .filter((p) => p.status !== 'completed' || p.id === current.projectId)
      .map((p) => ({ value: p.id, label: p.status === 'completed' ? `${p.title} (completed)` : p.title })),
    goals: goalRows
      .filter((g) => g.status === 'active' || g.id === current.goalId)
      .map((g) => ({ value: g.id, label: g.status === 'active' ? g.title : `${g.title} (${g.status})` })),
    habits: habitRows
      .filter((h) => h.active || h.id === current.habitId)
      .map((h) => ({ value: h.id, label: h.active ? h.title : `${h.title} (inactive)` })),
  };
}
