import { describe, expect, it } from 'vitest';
import { createFields } from '../../../core/db/records.ts';
import { habits } from '../../../core/db/schema.ts';
import { openTestDatabase } from '../../../core/db/testing.ts';
import { deleteHabit } from '../../habits/data/habits-repository.ts';
import { createExercise } from './exercises-repository.ts';
import { createWorkout, getWorkout, listWorkouts, loadLinkOptions, updateWorkout } from './workouts-repository.ts';

const clock = () => new Date('2026-11-10T10:00:00Z');

async function setup() {
  const { db } = await openTestDatabase();
  const ids: string[] = [];
  for (const name of ['Bench press', 'Overhead press', 'Dips']) {
    const r = await createExercise(db, clock, { name, kind: 'strength', distanceUnit: null });
    if (r.ok) ids.push(r.id);
  }
  await db.insert(habits).values({ ...createFields(clock, 'h1'), title: 'Gym' });
  return { db, ids };
}

describe('workouts repository', () => {
  it('creates a workout with its exercises in order', async () => {
    const { db, ids } = await setup();
    const result = await createWorkout(db, clock, { name: ' Push day ', exerciseIds: ids, projectId: null, goalId: null, habitId: null });
    expect(result.ok).toBe(true);
    const [workout] = await listWorkouts(db);
    expect(workout?.name).toBe('Push day');
    expect(workout?.exercises.map((e) => e.name)).toEqual(['Bench press', 'Overhead press', 'Dips']);
  });

  it('rejects a workout without exercises', async () => {
    const { db } = await setup();
    expect(await createWorkout(db, clock, { name: 'Push day', exerciseIds: [], projectId: null, goalId: null, habitId: null })).toMatchObject({
      ok: false,
      errors: { exercises: 'Add at least one exercise' },
    });
  });

  it('links a habit, and shows no habit once it is deleted', async () => {
    const { db, ids } = await setup();
    const result = await createWorkout(db, clock, { name: 'Push day', exerciseIds: ids, projectId: null, goalId: null, habitId: 'h1' });
    if (!result.ok) throw new Error('invalid');
    expect((await getWorkout(db, result.id))?.habitId).toBe('h1');
    await deleteHabit(db, clock, 'h1');
    expect((await getWorkout(db, result.id))?.habitId).toBeNull();
    const options = await loadLinkOptions(db, { projectId: null, goalId: null, habitId: null });
    expect(options.habits).toEqual([]);
  });

  it('keeps a deleted exercise out of the list even if the stored list still has it', async () => {
    const { db, ids } = await setup();
    const result = await createWorkout(db, clock, { name: 'Push day', exerciseIds: [...ids, 'gone'], projectId: null, goalId: null, habitId: null });
    if (!result.ok) throw new Error('invalid');
    expect((await getWorkout(db, result.id))?.exercises).toHaveLength(3);
    await updateWorkout(db, clock, result.id, { name: 'Push', exerciseIds: ids.slice(0, 1), projectId: null, goalId: null, habitId: null });
    expect((await getWorkout(db, result.id))?.name).toBe('Push');
  });
});
