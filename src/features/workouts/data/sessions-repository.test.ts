import { describe, expect, it } from 'vitest';
import { createFields } from '../../../core/db/records.ts';
import { habitChecks, habits, logEntries, projects } from '../../../core/db/schema.ts';
import { openTestDatabase } from '../../../core/db/testing.ts';
import { lastTime } from '../domain/sessions.ts';
import { createExercise, deleteExercise } from './exercises-repository.ts';
import {
  addSessionExercise,
  deleteSession,
  discardSession,
  finishSession,
  getRunningSession,
  getSession,
  listRecentSessions,
  loadLastTimeRows,
  logSet,
  moveSessionExercise,
  removeSessionExercise,
  renameSession,
  replaceSessionExercise,
  startSession,
  updateFinishedSession,
} from './sessions-repository.ts';
import { createWorkout, getWorkout } from './workouts-repository.ts';

let now = new Date('2026-11-10T17:05:00Z');
const clock = () => now;
const at = (iso: string) => {
  now = new Date(iso);
};
const input = (over: Partial<Record<'reps' | 'weight' | 'distance' | 'duration', string>>) => ({ reps: '', weight: '', distance: '', duration: '', ...over });

async function setup() {
  at('2026-11-10T17:05:00Z');
  const { db } = await openTestDatabase();
  const ids: Record<string, string> = {};
  for (const [name, kind] of [
    ['Bench press', 'strength'],
    ['Dips', 'bodyweight'],
    ['Pull-ups', 'bodyweight'],
    ['Push-ups', 'bodyweight'],
    ['Run', 'endurance'],
  ] as const) {
    const r = await createExercise(db, clock, { name, kind, distanceUnit: kind === 'endurance' ? 'km' : null });
    if (r.ok) ids[name] = r.id;
  }
  await db.insert(habits).values({ ...createFields(clock, 'gym'), title: 'Gym' });
  await db.insert(projects).values({ ...createFields(clock, 'strength'), title: 'Strength block' });
  const w = await createWorkout(db, clock, { name: 'Push day', exerciseIds: [ids['Bench press']!, ids['Dips']!], projectId: 'strength', goalId: null, habitId: 'gym' });
  if (!w.ok) throw new Error('invalid');
  return { db, ids, workoutId: w.id };
}

const names = async (db: Awaited<ReturnType<typeof setup>>['db'], id: string) => (await getSession(db, id))?.exercises.map((e) => e.name);
const liveEntries = async (db: Awaited<ReturnType<typeof setup>>['db']) => (await db.select().from(logEntries)).filter((e) => e.deletedAt === null);

describe('starting a session', () => {
  it('copies the workout', async () => {
    const { db, workoutId } = await setup();
    const id = await startSession(db, clock, workoutId);
    const view = await getSession(db, id);
    expect(view?.session).toMatchObject({ name: 'Push day', startedAt: '2026-11-10T17:05:00.000Z', endedAt: null, habitId: 'gym', projectId: 'strength' });
    expect(view?.exercises.map((e) => e.name)).toEqual(['Bench press', 'Dips']);
  });

  it('starts empty', async () => {
    const { db } = await setup();
    const id = await startSession(db, clock, null);
    expect((await getSession(db, id))?.session).toMatchObject({ name: 'Workout', habitId: null, workoutId: null });
    expect(await names(db, id)).toEqual([]);
  });

  it('does not start a second session', async () => {
    const { db, workoutId } = await setup();
    const id = await startSession(db, clock, workoutId);
    expect(await startSession(db, clock, null)).toBe(id);
    expect((await getRunningSession(db))?.id).toBe(id);
  });

  it('renames, ignoring an empty name', async () => {
    const { db } = await setup();
    const id = await startSession(db, clock, null);
    await renameSession(db, clock, id, ' Morning swim ');
    await renameSession(db, clock, id, '  ');
    expect((await getSession(db, id))?.session.name).toBe('Morning swim');
  });
});

describe("changing a session's exercises", () => {
  it('adds at the end without changing the workout', async () => {
    const { db, ids, workoutId } = await setup();
    const id = await startSession(db, clock, workoutId);
    await addSessionExercise(db, clock, id, ids['Pull-ups']!);
    await addSessionExercise(db, clock, id, ids['Dips']!);
    expect(await names(db, id)).toEqual(['Bench press', 'Dips', 'Pull-ups']);
    expect((await getWorkout(db, workoutId))?.exercises.map((e) => e.name)).toEqual(['Bench press', 'Dips']);
  });

  it('moves up and down', async () => {
    const { db, ids, workoutId } = await setup();
    const id = await startSession(db, clock, workoutId);
    await addSessionExercise(db, clock, id, ids['Pull-ups']!);
    const third = (await getSession(db, id))!.exercises[2]!.id;
    await moveSessionExercise(db, clock, third, -1);
    expect(await names(db, id)).toEqual(['Bench press', 'Pull-ups', 'Dips']);
    await moveSessionExercise(db, clock, third, -1);
    await moveSessionExercise(db, clock, third, -1);
    expect(await names(db, id)).toEqual(['Pull-ups', 'Bench press', 'Dips']);
  });

  it('replaces an exercise without sets in its place, but not one with sets', async () => {
    const { db, ids, workoutId } = await setup();
    const id = await startSession(db, clock, workoutId);
    const [bench, dips] = (await getSession(db, id))!.exercises;
    expect(await replaceSessionExercise(db, clock, dips!.id, ids['Push-ups']!)).toBe(true);
    expect(await names(db, id)).toEqual(['Bench press', 'Push-ups']);
    await logSet(db, clock, bench!.id, input({ reps: '8', weight: '60' }));
    expect(await replaceSessionExercise(db, clock, bench!.id, ids['Pull-ups']!)).toBe(false);
  });

  it('removes an exercise with its sets', async () => {
    const { db, workoutId } = await setup();
    const id = await startSession(db, clock, workoutId);
    const bench = (await getSession(db, id))!.exercises[0]!;
    await logSet(db, clock, bench.id, input({ reps: '8', weight: '60' }));
    await logSet(db, clock, bench.id, input({ reps: '8', weight: '60' }));
    await removeSessionExercise(db, clock, bench.id);
    expect(await names(db, id)).toEqual(['Dips']);
    expect(await loadLastTimeRows(db, [bench.exerciseId], 'other')).toEqual([]);
  });
});

describe('sets', () => {
  it('logs strength and endurance sets in order and rejects invalid ones', async () => {
    const { db, ids, workoutId } = await setup();
    const id = await startSession(db, clock, workoutId);
    await addSessionExercise(db, clock, id, ids['Run']!);
    const [bench, dips, run] = (await getSession(db, id))!.exercises;
    expect(await logSet(db, clock, bench!.id, input({ reps: '8', weight: '60' }))).toEqual({ ok: true });
    expect(await logSet(db, clock, bench!.id, input({ reps: '6', weight: '62.5' }))).toEqual({ ok: true });
    expect(await logSet(db, clock, run!.id, input({ distance: '5.2', duration: '28:40' }))).toEqual({ ok: true });
    expect(await logSet(db, clock, dips!.id, input({ reps: '0' }))).toEqual({ ok: false, error: 'Enter at least 1 rep' });
    const view = await getSession(db, id);
    expect(view?.exercises[0]?.sets.map((s) => [s.reps, s.weightKg])).toEqual([
      [8, 60],
      [6, 62.5],
    ]);
    expect(view?.exercises[1]?.sets).toEqual([]);
    expect(view?.exercises[2]?.sets[0]).toMatchObject({ distance: 5.2, durationSeconds: 1720, reps: null });
  });

  it('finds last time in another workout', async () => {
    const { db, ids } = await setup();
    const full = await createWorkout(db, clock, { name: 'Full body', exerciseIds: [ids['Bench press']!], projectId: null, goalId: null, habitId: null });
    if (!full.ok) throw new Error('invalid');
    const first = await startSession(db, clock, full.id);
    await logSet(db, clock, (await getSession(db, first))!.exercises[0]!.id, input({ reps: '8', weight: '60' }));
    at('2026-11-10T18:00:00Z');
    await finishSession(db, clock, first);
    at('2026-11-12T17:00:00Z');
    const second = await startSession(db, clock, null);
    const rows = await loadLastTimeRows(db, [ids['Bench press']!], second);
    expect(lastTime(ids['Bench press']!, rows)).toMatchObject({ sessionId: first, sets: [{ reps: 8, weightKg: 60 }] });
    // A running session's own sets are not "last time".
    expect(await loadLastTimeRows(db, [ids['Bench press']!], first)).toEqual([]);
  });

  it('keeps a deleted exercise in the session by name', async () => {
    const { db, ids, workoutId } = await setup();
    const id = await startSession(db, clock, workoutId);
    await logSet(db, clock, (await getSession(db, id))!.exercises[1]!.id, input({ reps: '10' }));
    await finishSession(db, clock, id);
    await deleteExercise(db, clock, ids['Dips']!);
    expect((await getSession(db, id))?.exercises[1]).toMatchObject({ name: 'Dips', deleted: true, sets: [{ reps: 10 }] });
  });
});

describe('finishing, discarding, editing and deleting', () => {
  it('finishes with a workout log entry and checks the habit', async () => {
    const { db, workoutId } = await setup();
    const id = await startSession(db, clock, workoutId);
    at('2026-11-10T18:10:00Z');
    await finishSession(db, clock, id);
    const session = (await getSession(db, id))!.session;
    expect(session.endedAt).toBe('2026-11-10T18:10:00.000Z');
    const entry = (await liveEntries(db)).find((e) => e.source === 'workout');
    expect(entry).toMatchObject({ id: session.logEntryId, occurredAt: '2026-11-10T17:05:00.000Z', durationMinutes: 65, note: 'Push day', projectId: 'strength', habitId: null });
    const checks = (await db.select().from(habitChecks)).filter((c) => c.deletedAt === null);
    expect(checks).toMatchObject([{ habitId: 'gym' }]);
    expect(await getRunningSession(db)).toBeUndefined();
    expect((await listRecentSessions(db)).map((s) => s.name)).toEqual(['Push day']);
  });

  it('discards without a log entry', async () => {
    const { db, workoutId } = await setup();
    const id = await startSession(db, clock, workoutId);
    await logSet(db, clock, (await getSession(db, id))!.exercises[0]!.id, input({ reps: '8', weight: '60' }));
    await discardSession(db, clock, id);
    expect(await getRunningSession(db)).toBeUndefined();
    expect(await getSession(db, id)).toBeUndefined();
    expect(await liveEntries(db)).toEqual([]);
  });

  it('corrects the end of a finished session and its entry, but not before the start', async () => {
    const { db, workoutId } = await setup();
    const id = await startSession(db, clock, workoutId);
    at('2026-11-10T20:00:00Z');
    await finishSession(db, clock, id);
    const change = (endedAt: string) => updateFinishedSession(db, clock, id, { name: 'Push day', startedAt: '2026-11-10T17:05:00.000Z', endedAt });
    expect(await change('2026-11-10T18:10:00.000Z')).toEqual({ ok: true });
    expect((await liveEntries(db)).find((e) => e.source === 'workout')?.durationMinutes).toBe(65);
    expect(await change('2026-11-10T16:50:00.000Z')).toEqual({ ok: false, error: 'End must be after start' });
    expect((await getSession(db, id))?.session.endedAt).toBe('2026-11-10T18:10:00.000Z');
  });

  it('deletes a finished session with its entry and keeps the habit check', async () => {
    const { db, workoutId } = await setup();
    const id = await startSession(db, clock, workoutId);
    await finishSession(db, clock, id);
    await deleteSession(db, clock, id);
    expect(await listRecentSessions(db)).toEqual([]);
    expect((await liveEntries(db)).filter((e) => e.source === 'workout')).toEqual([]);
    expect((await db.select().from(habitChecks)).filter((c) => c.deletedAt === null)).toHaveLength(1);
  });
});
