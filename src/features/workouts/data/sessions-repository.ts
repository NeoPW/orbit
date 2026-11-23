import { and, desc, eq, inArray, isNotNull, isNull } from 'drizzle-orm';
import type { Db } from '../../../core/db/drizzle.ts';
import { localToday } from '../../../core/dates/deadline.ts';
import { createFields, deleteFields, newId, notDeleted, updateFields, type Clock } from '../../../core/db/records.ts';
import { exercises, logEntries, sessionExercises, sessionSets, workoutSessions, type DistanceUnit, type ExerciseKind } from '../../../core/db/schema.ts';
import { checkHabit } from '../../habits/data/habits-repository.ts';
import { insertLogEntryQuery } from '../../work-log/data/log-repository.ts';
import { sessionMinutes, validateSet, type PastSetRow, type SetInput } from '../domain/sessions.ts';
import { getWorkout } from './workouts-repository.ts';

export type WorkoutSession = typeof workoutSessions.$inferSelect;
export type SessionSet = typeof sessionSets.$inferSelect;

/** An exercise of a session with what the session screen needs. */
export interface SessionExerciseView {
  /** The session exercise's id. */
  id: string;
  exerciseId: string;
  name: string;
  kind: ExerciseKind;
  distanceUnit: DistanceUnit | null;
  /** The exercise was deleted after it was added; the session still shows it. */
  deleted: boolean;
  sets: SessionSet[];
}

export interface SessionView {
  session: WorkoutSession;
  exercises: SessionExerciseView[];
}

export type SetWriteResult = { ok: true } | { ok: false; error: string };
export type SessionUpdateResult = { ok: true } | { ok: false; error: string };

const byPosition = <T extends { position: number }>(a: T, b: T) => a.position - b.position;

/** The running session (no end, not deleted), the most recently started one if there are several. */
export async function getRunningSession(db: Db): Promise<WorkoutSession | undefined> {
  const [row] = await db
    .select()
    .from(workoutSessions)
    .where(and(notDeleted(workoutSessions), isNull(workoutSessions.endedAt)))
    .orderBy(desc(workoutSessions.startedAt))
    .limit(1);
  return row;
}

/**
 * Starts a session from a workout (its name, exercises in order and resolved links) or empty ("Workout").
 * Returns the new session's id, or the running session's id when one already runs.
 */
export async function startSession(db: Db, clock: Clock, workoutId: string | null): Promise<string> {
  const running = await getRunningSession(db);
  if (running) return running.id;
  const workout = workoutId ? await getWorkout(db, workoutId) : undefined;
  const session = createFields(clock);
  await db.batch([
    db.insert(workoutSessions).values({
      ...session,
      workoutId: workout?.id ?? null,
      name: workout?.name ?? 'Workout',
      startedAt: session.createdAt,
      endedAt: null,
      projectId: workout?.projectId ?? null,
      goalId: workout?.goalId ?? null,
      habitId: workout?.habitId ?? null,
      logEntryId: null,
    }),
    ...(workout?.exercises ?? []).map((exercise, position) =>
      db.insert(sessionExercises).values({ ...createFields(clock), sessionId: session.id, exerciseId: exercise.id, position }),
    ),
  ]);
  return session.id;
}

async function liveSessionExercises(db: Db, sessionId: string) {
  const rows = await db
    .select()
    .from(sessionExercises)
    .where(and(eq(sessionExercises.sessionId, sessionId), notDeleted(sessionExercises)));
  return rows.sort(byPosition);
}

/** A session with its exercises (deleted exercises included by name) and their sets, in order. */
export async function getSession(db: Db, id: string): Promise<SessionView | undefined> {
  const [session] = await db
    .select()
    .from(workoutSessions)
    .where(and(eq(workoutSessions.id, id), notDeleted(workoutSessions)));
  if (!session) return undefined;
  const rows = await liveSessionExercises(db, id);
  const ids = rows.map((r) => r.id);
  const [exerciseRows, setRows] = await Promise.all([
    rows.length === 0
      ? []
      : db
          .select()
          .from(exercises)
          .where(
            inArray(
              exercises.id,
              rows.map((r) => r.exerciseId),
            ),
          ),
    ids.length === 0
      ? []
      : db
          .select()
          .from(sessionSets)
          .where(and(inArray(sessionSets.sessionExerciseId, ids), notDeleted(sessionSets))),
  ]);
  const exerciseById = new Map(exerciseRows.map((e) => [e.id, e]));
  return {
    session,
    exercises: rows.map((row) => {
      const exercise = exerciseById.get(row.exerciseId);
      return {
        id: row.id,
        exerciseId: row.exerciseId,
        name: exercise?.name ?? 'Exercise',
        kind: exercise?.kind ?? 'strength',
        distanceUnit: exercise?.distanceUnit ?? null,
        deleted: !exercise || exercise.deletedAt !== null,
        sets: setRows.filter((s) => s.sessionExerciseId === row.id).sort(byPosition),
      };
    }),
  };
}

async function liveSession(db: Db, id: string): Promise<WorkoutSession | undefined> {
  const [row] = await db
    .select()
    .from(workoutSessions)
    .where(and(eq(workoutSessions.id, id), notDeleted(workoutSessions)));
  return row;
}

/** Renames the session; an empty name is ignored. A finished session's log entry gets the new name as note. */
export async function renameSession(db: Db, clock: Clock, id: string, name: string): Promise<void> {
  const trimmed = name.trim();
  const session = await liveSession(db, id);
  if (!session || trimmed === '' || trimmed === session.name) return;
  const rename = db
    .update(workoutSessions)
    .set({ ...updateFields(clock), name: trimmed })
    .where(eq(workoutSessions.id, id));
  if (!session.logEntryId) {
    await rename;
    return;
  }
  await db.batch([
    rename,
    db
      .update(logEntries)
      .set({ ...updateFields(clock), note: trimmed })
      .where(eq(logEntries.id, session.logEntryId)),
  ]);
}

async function exerciseIsLive(db: Db, exerciseId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: exercises.id })
    .from(exercises)
    .where(and(eq(exercises.id, exerciseId), notDeleted(exercises)));
  return row !== undefined;
}

/** Adds the exercise at the end; nothing when it is already in the session or deleted. */
export async function addSessionExercise(db: Db, clock: Clock, sessionId: string, exerciseId: string): Promise<void> {
  const rows = await liveSessionExercises(db, sessionId);
  if (rows.some((r) => r.exerciseId === exerciseId) || !(await exerciseIsLive(db, exerciseId))) return;
  const position = rows.reduce((max, r) => Math.max(max, r.position + 1), 0);
  await db.insert(sessionExercises).values({ ...createFields(clock), sessionId, exerciseId, position });
}

async function sessionExerciseRow(db: Db, id: string) {
  const [row] = await db
    .select()
    .from(sessionExercises)
    .where(and(eq(sessionExercises.id, id), notDeleted(sessionExercises)));
  return row;
}

/** Swaps the exercise with its neighbour above (-1) or below (1). */
export async function moveSessionExercise(db: Db, clock: Clock, sessionExerciseId: string, direction: -1 | 1): Promise<void> {
  const row = await sessionExerciseRow(db, sessionExerciseId);
  if (!row) return;
  const rows = await liveSessionExercises(db, row.sessionId);
  const index = rows.findIndex((r) => r.id === row.id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= rows.length) return;
  const order = [...rows];
  [order[index], order[target]] = [order[target]!, order[index]!];
  // Renumber 0, 1, 2 …, writing only rows whose position changes (also fixes equal positions after a sync conflict).
  const changed = order.flatMap((r, position) => (r.position === position ? [] : [{ id: r.id, position }]));
  if (changed.length === 0) return;
  const queries = changed.map((c) =>
    db
      .update(sessionExercises)
      .set({ ...updateFields(clock), position: c.position })
      .where(eq(sessionExercises.id, c.id)),
  );
  await db.batch([queries[0]!, ...queries.slice(1)]);
}

async function liveSets(db: Db, sessionExerciseId: string): Promise<SessionSet[]> {
  const rows = await db
    .select()
    .from(sessionSets)
    .where(and(eq(sessionSets.sessionExerciseId, sessionExerciseId), notDeleted(sessionSets)));
  return rows.sort(byPosition);
}

/** Puts another exercise in this one's place; only while it has no sets and the other is not in the session yet. Returns whether it was replaced. */
export async function replaceSessionExercise(db: Db, clock: Clock, sessionExerciseId: string, exerciseId: string): Promise<boolean> {
  const row = await sessionExerciseRow(db, sessionExerciseId);
  if (!row || (await liveSets(db, row.id)).length > 0 || !(await exerciseIsLive(db, exerciseId))) return false;
  const rows = await liveSessionExercises(db, row.sessionId);
  if (rows.some((r) => r.exerciseId === exerciseId)) return false;
  await db
    .update(sessionExercises)
    .set({ ...updateFields(clock), exerciseId })
    .where(eq(sessionExercises.id, row.id));
  return true;
}

/** Removes the exercise and its sets from the session, in one batch. */
export async function removeSessionExercise(db: Db, clock: Clock, sessionExerciseId: string): Promise<void> {
  await db.batch([
    db.update(sessionExercises).set(deleteFields(clock)).where(eq(sessionExercises.id, sessionExerciseId)),
    db
      .update(sessionSets)
      .set(deleteFields(clock))
      .where(and(eq(sessionSets.sessionExerciseId, sessionExerciseId), notDeleted(sessionSets))),
  ]);
}

async function kindOf(db: Db, sessionExerciseId: string): Promise<ExerciseKind | undefined> {
  const [row] = await db
    .select({ kind: exercises.kind })
    .from(sessionExercises)
    .innerJoin(exercises, eq(exercises.id, sessionExercises.exerciseId))
    .where(eq(sessionExercises.id, sessionExerciseId));
  return row?.kind;
}

/** Logs a set after the exercise's other sets, validated for the exercise's kind. */
export async function logSet(db: Db, clock: Clock, sessionExerciseId: string, input: SetInput): Promise<SetWriteResult> {
  const kind = await kindOf(db, sessionExerciseId);
  if (!kind) return { ok: false, error: 'This exercise is no longer in the session' };
  const result = validateSet(kind, input);
  if (!result.ok) return result;
  const sets = await liveSets(db, sessionExerciseId);
  const position = sets.reduce((max, s) => Math.max(max, s.position + 1), 0);
  await db.insert(sessionSets).values({ ...createFields(clock), sessionExerciseId, position, ...result.values });
  return { ok: true };
}

export async function updateSet(db: Db, clock: Clock, setId: string, input: SetInput): Promise<SetWriteResult> {
  const [set] = await db
    .select()
    .from(sessionSets)
    .where(and(eq(sessionSets.id, setId), notDeleted(sessionSets)));
  const kind = set ? await kindOf(db, set.sessionExerciseId) : undefined;
  if (!set || !kind) return { ok: false, error: 'This set no longer exists' };
  const result = validateSet(kind, input);
  if (!result.ok) return result;
  await db
    .update(sessionSets)
    .set({ ...updateFields(clock), ...result.values })
    .where(eq(sessionSets.id, setId));
  return { ok: true };
}

export async function deleteSet(db: Db, clock: Clock, setId: string): Promise<void> {
  await db.update(sessionSets).set(deleteFields(clock)).where(eq(sessionSets.id, setId));
}

/** The sets of the given exercises in finished, non-deleted sessions other than `excludeSessionId`, for "last time". */
export async function loadLastTimeRows(db: Db, exerciseIds: string[], excludeSessionId: string): Promise<PastSetRow[]> {
  if (exerciseIds.length === 0) return [];
  const rows = await db
    .select({
      exerciseId: sessionExercises.exerciseId,
      sessionId: workoutSessions.id,
      startedAt: workoutSessions.startedAt,
      position: sessionSets.position,
      reps: sessionSets.reps,
      weightKg: sessionSets.weightKg,
      distance: sessionSets.distance,
      durationSeconds: sessionSets.durationSeconds,
    })
    .from(sessionSets)
    .innerJoin(sessionExercises, eq(sessionExercises.id, sessionSets.sessionExerciseId))
    .innerJoin(workoutSessions, eq(workoutSessions.id, sessionExercises.sessionId))
    .where(
      and(
        notDeleted(sessionSets),
        notDeleted(sessionExercises),
        notDeleted(workoutSessions),
        isNotNull(workoutSessions.endedAt),
        inArray(sessionExercises.exerciseId, exerciseIds),
      ),
    );
  return rows.filter((r) => r.sessionId !== excludeSessionId);
}

/**
 * Ends the running session now and writes its workout log entry (from its start, its length,
 * its name as note, its project and goal) in one batch; then checks its habit for today.
 */
export async function finishSession(db: Db, clock: Clock, id: string): Promise<void> {
  const session = await liveSession(db, id);
  if (!session || session.endedAt !== null) return;
  const endedAt = clock().toISOString();
  const entryId = newId();
  await db.batch([
    insertLogEntryQuery(
      db,
      clock,
      {
        projectId: session.projectId,
        goalId: session.goalId,
        taskId: null,
        habitId: null,
        occurredAt: session.startedAt,
        durationMinutes: sessionMinutes(session.startedAt, endedAt),
        note: session.name,
        source: 'workout',
      },
      entryId,
    ),
    db
      .update(workoutSessions)
      .set({ ...updateFields(clock), endedAt, logEntryId: entryId })
      .where(eq(workoutSessions.id, id)),
  ]);
  // checkHabit does nothing for a habit that no longer exists.
  if (session.habitId) await checkHabit(db, clock, session.habitId, localToday(clock()));
}

/** Soft-deletes the session, its exercises and their sets (and its log entry, if any) in one batch. */
async function removeSession(db: Db, clock: Clock, session: WorkoutSession): Promise<void> {
  const rows = await db
    .select({ id: sessionExercises.id })
    .from(sessionExercises)
    .where(and(eq(sessionExercises.sessionId, session.id), notDeleted(sessionExercises)));
  const ids = rows.map((r) => r.id);
  await db.batch([
    db.update(workoutSessions).set(deleteFields(clock)).where(eq(workoutSessions.id, session.id)),
    db
      .update(sessionExercises)
      .set(deleteFields(clock))
      .where(and(eq(sessionExercises.sessionId, session.id), notDeleted(sessionExercises))),
    ...(ids.length > 0
      ? [
          db
            .update(sessionSets)
            .set(deleteFields(clock))
            .where(and(inArray(sessionSets.sessionExerciseId, ids), notDeleted(sessionSets))),
        ]
      : []),
    ...(session.logEntryId ? [db.update(logEntries).set(deleteFields(clock)).where(eq(logEntries.id, session.logEntryId))] : []),
  ]);
}

/** Removes a running session without a log entry or a habit check. */
export async function discardSession(db: Db, clock: Clock, id: string): Promise<void> {
  const session = await liveSession(db, id);
  if (session && session.endedAt === null) await removeSession(db, clock, session);
}

/** Removes a finished session and its log entry; a habit check made when it was finished stays. */
export async function deleteSession(db: Db, clock: Clock, id: string): Promise<void> {
  const session = await liveSession(db, id);
  if (session) await removeSession(db, clock, session);
}

/** The most recently started finished sessions, newest first. */
export function listRecentSessions(db: Db, limit = 10): Promise<WorkoutSession[]> {
  return db
    .select()
    .from(workoutSessions)
    .where(and(notDeleted(workoutSessions), isNotNull(workoutSessions.endedAt)))
    .orderBy(desc(workoutSessions.startedAt))
    .limit(limit);
}

/** Changes a finished session's name, start and end (ISO instants), and its log entry with it, in one batch. */
export async function updateFinishedSession(
  db: Db,
  clock: Clock,
  id: string,
  input: { name: string; startedAt: string; endedAt: string },
): Promise<SessionUpdateResult> {
  const session = await liveSession(db, id);
  if (!session || session.endedAt === null) return { ok: false, error: 'This session is not finished' };
  if (new Date(input.endedAt).getTime() <= new Date(input.startedAt).getTime()) return { ok: false, error: 'End must be after start' };
  const name = input.name.trim() || session.name;
  await db.batch([
    db
      .update(workoutSessions)
      .set({ ...updateFields(clock), name, startedAt: input.startedAt, endedAt: input.endedAt })
      .where(eq(workoutSessions.id, id)),
    ...(session.logEntryId
      ? [
          db
            .update(logEntries)
            .set({ ...updateFields(clock), note: name, occurredAt: input.startedAt, durationMinutes: sessionMinutes(input.startedAt, input.endedAt) })
            .where(eq(logEntries.id, session.logEntryId)),
        ]
      : []),
  ]);
  return { ok: true };
}

