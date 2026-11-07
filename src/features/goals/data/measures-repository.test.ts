import { describe, expect, it } from 'vitest';
import { measureChanges } from '../../../core/db/schema.ts';
import { openTestDatabase } from '../../../core/db/testing.ts';
import { createGoal, getGoal } from './goals-repository.ts';
import {
  addMeasure,
  deleteMeasure,
  setMeasureDone,
  setMeasureValue,
  stepMeasure,
  updateMeasure,
  type MeasureFields,
} from './measures-repository.ts';

const clock = () => new Date('2026-10-07T10:00:00Z');
const goalInput = { title: 'Get fit', description: '', startDate: '2026-10-01', endDate: '2026-12-31', color: null };
const numeric: MeasureFields = {
  title: 'Run 100 km',
  description: '',
  measureType: 'numeric',
  startValue: 0,
  targetValue: 100,
  currentValue: 40,
  unit: 'km',
  step: 5,
  habitId: null,
};

async function setup(fields: Partial<MeasureFields> = {}) {
  const { db } = await openTestDatabase();
  const goalId = await createGoal(db, clock, goalInput);
  const id = await addMeasure(db, clock, goalId, { ...numeric, ...fields });
  const measure = async () => (await getGoal(db, goalId))!.measures.find((m) => m.id === id)!;
  return { db, goalId, id, measure };
}

describe('measures repository', () => {
  it('adds a measure after the existing ones', async () => {
    const { db, goalId } = await setup();
    await addMeasure(db, clock, goalId, { ...numeric, title: 'Swim' });
    expect((await getGoal(db, goalId))!.measures.map((m) => m.title)).toEqual(['Run 100 km', 'Swim']);
  });

  it('raises by the step (plus button)', async () => {
    const { db, id, measure } = await setup();
    await stepMeasure(db, clock, id, 1);
    expect((await measure()).currentValue).toBe(45);
  });

  it('lowers by the step (minus button)', async () => {
    const { db, id, measure } = await setup({ step: 1 });
    await stepMeasure(db, clock, id, -1);
    expect((await measure()).currentValue).toBe(39);
  });

  it('sets a typed value', async () => {
    const { db, id, measure } = await setup();
    await setMeasureValue(db, clock, id, 62.5);
    expect((await measure()).currentValue).toBe(62.5);
  });

  it('switches a boolean measure done', async () => {
    const { db, id, measure } = await setup({ measureType: 'boolean', currentValue: 0 });
    await setMeasureDone(db, clock, id, true);
    expect((await measure()).currentValue).toBe(1);
  });

  it('keeps the default step of 1', async () => {
    const { measure } = await setup({ step: 1 });
    expect((await measure()).step).toBe(1);
  });

  it('deletes a measure', async () => {
    const { db, goalId, id } = await setup();
    await deleteMeasure(db, clock, id);
    expect((await getGoal(db, goalId))!.measures).toHaveLength(0);
  });

  describe('value history', () => {
    const changes = async (db: Awaited<ReturnType<typeof setup>>['db']) =>
      (await db.select().from(measureChanges)).map((c) => ({ from: c.fromValue, to: c.toValue, at: c.createdAt }));

    it('records the step with the time', async () => {
      const { db, id } = await setup({ currentValue: 7, step: 1 });
      await stepMeasure(db, clock, id, 1);
      expect(await changes(db)).toEqual([{ from: 7, to: 8, at: '2026-10-07T10:00:00.000Z' }]);
    });

    it('records nothing when the value stays the same', async () => {
      const { db, id } = await setup({ currentValue: 8 });
      await setMeasureValue(db, clock, id, 8);
      expect(await changes(db)).toEqual([]);
    });

    it('records a value changed in the measure form', async () => {
      const { db, id } = await setup({ currentValue: 7 });
      await updateMeasure(db, clock, id, { ...numeric, currentValue: 9 });
      expect(await changes(db)).toMatchObject([{ from: 7, to: 9 }]);
    });

    it('records a yes/no measure switched to achieved', async () => {
      const { db, id } = await setup({ measureType: 'boolean', currentValue: 0 });
      await setMeasureDone(db, clock, id, true);
      expect(await changes(db)).toMatchObject([{ from: 0, to: 1 }]);
    });

    it('records nothing when the type changes', async () => {
      const { db, id } = await setup({ currentValue: 7 });
      await updateMeasure(db, clock, id, { ...numeric, measureType: 'boolean', currentValue: 1 });
      expect(await changes(db)).toEqual([]);
    });

    it('records nothing when a measure is created', async () => {
      const { db } = await setup();
      expect(await changes(db)).toEqual([]);
    });
  });
});
