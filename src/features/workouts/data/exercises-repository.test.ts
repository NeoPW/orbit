import { describe, expect, it } from 'vitest';
import { createFields } from '../../../core/db/records.ts';
import { workouts } from '../../../core/db/schema.ts';
import { openTestDatabase } from '../../../core/db/testing.ts';
import { createExercise, deleteExercise, listExercises, updateExercise } from './exercises-repository.ts';

const clock = () => new Date('2026-11-10T10:00:00Z');

async function ok(promise: ReturnType<typeof createExercise>) {
  const result = await promise;
  if (!result.ok) throw new Error('invalid');
  return result.id;
}

describe('exercises repository', () => {
  it('creates a strength exercise without a unit', async () => {
    const { db } = await openTestDatabase();
    await ok(createExercise(db, clock, { name: ' Bench press ', kind: 'strength', distanceUnit: 'km' }));
    expect(await listExercises(db)).toMatchObject([{ name: 'Bench press', kind: 'strength', distanceUnit: null }]);
  });

  it('stores the unit of an endurance exercise, km by default', async () => {
    const { db } = await openTestDatabase();
    await ok(createExercise(db, clock, { name: 'Swim', kind: 'endurance', distanceUnit: 'm' }));
    await ok(createExercise(db, clock, { name: 'Run', kind: 'endurance', distanceUnit: null }));
    expect(await listExercises(db)).toMatchObject([
      { name: 'Run', distanceUnit: 'km' },
      { name: 'Swim', distanceUnit: 'm' },
    ]);
  });

  it('drops the unit when the type changes', async () => {
    const { db } = await openTestDatabase();
    const id = await ok(createExercise(db, clock, { name: 'Run', kind: 'endurance', distanceUnit: 'km' }));
    await updateExercise(db, clock, id, { name: 'Run', kind: 'bodyweight', distanceUnit: 'km' });
    expect((await listExercises(db))[0]).toMatchObject({ kind: 'bodyweight', distanceUnit: null });
  });

  it('rejects a duplicate name but allows keeping its own', async () => {
    const { db } = await openTestDatabase();
    const id = await ok(createExercise(db, clock, { name: 'Bench press', kind: 'strength', distanceUnit: null }));
    expect(await createExercise(db, clock, { name: ' bench press ', kind: 'strength', distanceUnit: null })).toMatchObject({ ok: false });
    expect(await updateExercise(db, clock, id, { name: 'BENCH PRESS', kind: 'strength', distanceUnit: null })).toMatchObject({ ok: true });
  });

  it('removes a deleted exercise from the workouts that contain it', async () => {
    const { db } = await openTestDatabase();
    const dips = await ok(createExercise(db, clock, { name: 'Dips', kind: 'bodyweight', distanceUnit: null }));
    await db.insert(workouts).values({ ...createFields(clock, 'w1'), name: 'Push day', exerciseIds: ['x', dips, 'y'] });
    await db.insert(workouts).values({ ...createFields(clock, 'w2'), name: 'Legs', exerciseIds: ['x'] });
    await deleteExercise(db, clock, dips);
    expect(await listExercises(db)).toEqual([]);
    const rows = await db.select().from(workouts);
    expect(rows.find((w) => w.id === 'w1')?.exerciseIds).toEqual(['x', 'y']);
    expect(rows.find((w) => w.id === 'w2')?.exerciseIds).toEqual(['x']);
  });
});
