import { and, eq } from 'drizzle-orm';
import type { Db } from '../../../core/db/drizzle.ts';
import { createFields, deleteFields, notDeleted, updateFields, type Clock } from '../../../core/db/records.ts';
import { exercises, sessionExercises, sessionSets, workoutSessions, workouts, type DistanceUnit, type ExerciseKind } from '../../../core/db/schema.ts';
import { validateExercise, type ExerciseErrors } from '../domain/workouts.ts';

export type Exercise = typeof exercises.$inferSelect;

export interface ExerciseInput {
  name: string;
  kind: ExerciseKind;
  /** Used for `endurance` only; defaults to km. */
  distanceUnit: DistanceUnit | null;
}

export type ExerciseResult = { ok: true; id: string } | { ok: false; errors: ExerciseErrors };

/** All exercises, by name. */
export async function listExercises(db: Db): Promise<Exercise[]> {
  const rows = await db.select().from(exercises).where(notDeleted(exercises));
  return rows.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
}

function valuesOf(input: ExerciseInput) {
  return {
    name: input.name.trim(),
    kind: input.kind,
    distanceUnit: input.kind === 'endurance' ? (input.distanceUnit ?? 'km') : null,
  };
}

async function errorsOf(db: Db, input: ExerciseInput, ownId?: string): Promise<ExerciseErrors> {
  const others = (await listExercises(db)).filter((e) => e.id !== ownId).map((e) => e.name);
  return validateExercise(input.name, others);
}

export async function createExercise(db: Db, clock: Clock, input: ExerciseInput): Promise<ExerciseResult> {
  const errors = await errorsOf(db, input);
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  const fields = createFields(clock);
  await db.insert(exercises).values({ ...fields, ...valuesOf(input) });
  return { ok: true, id: fields.id };
}

/** Whether the exercise has a set in a session that is not deleted; its type and unit are then fixed. */
export async function exerciseHasSets(db: Db, exerciseId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: sessionSets.id })
    .from(sessionSets)
    .innerJoin(sessionExercises, eq(sessionExercises.id, sessionSets.sessionExerciseId))
    .innerJoin(workoutSessions, eq(workoutSessions.id, sessionExercises.sessionId))
    .where(and(eq(sessionExercises.exerciseId, exerciseId), notDeleted(sessionSets), notDeleted(sessionExercises), notDeleted(workoutSessions)))
    .limit(1);
  return row !== undefined;
}

/** Updates the exercise; once it has sets, its stored type and unit are kept whatever the input says. */
export async function updateExercise(db: Db, clock: Clock, id: string, input: ExerciseInput): Promise<ExerciseResult> {
  const errors = await errorsOf(db, input, id);
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  const values = valuesOf(input);
  const locked = await exerciseHasSets(db, id);
  await db
    .update(exercises)
    .set({ ...updateFields(clock), ...(locked ? { name: values.name } : values) })
    .where(and(eq(exercises.id, id), notDeleted(exercises)));
  return { ok: true, id };
}

/** Soft-deletes the exercise and removes it from every workout that contains it, in one batch. */
export async function deleteExercise(db: Db, clock: Clock, id: string): Promise<void> {
  const containing = (await db.select().from(workouts).where(notDeleted(workouts))).filter((w) => w.exerciseIds.includes(id));
  await db.batch([
    db.update(exercises).set(deleteFields(clock)).where(eq(exercises.id, id)),
    ...containing.map((w) =>
      db
        .update(workouts)
        .set({ ...updateFields(clock), exerciseIds: w.exerciseIds.filter((e) => e !== id) })
        .where(eq(workouts.id, w.id)),
    ),
  ]);
}
