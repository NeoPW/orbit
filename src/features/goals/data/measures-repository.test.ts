import { describe, expect, it } from 'vitest';
import { openTestDatabase } from '../../../core/db/testing.ts';
import { createGoal, getGoal } from './goals-repository.ts';
import { addMeasure, deleteMeasure, setMeasureDone, setMeasureValue, stepMeasure, type MeasureFields } from './measures-repository.ts';

const clock = () => new Date('2026-10-07T10:00:00Z');
const goalInput = { title: 'Get fit', description: '', startDate: '2026-10-01', endDate: '2026-12-31', color: null };
const numeric: MeasureFields = { title: 'Run 100 km', description: '', measureType: 'numeric', startValue: 0, targetValue: 100, currentValue: 40, unit: 'km', step: 5, habitId: null };

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
});
