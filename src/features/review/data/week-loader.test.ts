import { describe, expect, it } from 'vitest';
import { openTestDatabase } from '../../../core/db/testing.ts';
import { addMeasure, setMeasureValue, type MeasureFields } from '../../goals/data/measures-repository.ts';
import { createGoal } from '../../goals/data/goals-repository.ts';
import { saveReview } from './reviews-repository.ts';
import { loadWeek } from './week-loader.ts';

const clock = () => new Date('2026-10-11T18:00:00Z');
const measure: MeasureFields = { title: 'Run', description: '', measureType: 'numeric', startValue: 0, targetValue: 100, currentValue: 40, unit: null, step: 1, habitId: null };

describe('week loader', () => {
  it('shows the snapshots of a reviewed week, not the current progress', async () => {
    const { db } = await openTestDatabase();
    const goalId = await createGoal(db, clock, { title: 'Get fit', description: '', startDate: '2026-01-01', endDate: '2026-12-31', color: null });
    const id = await addMeasure(db, clock, goalId, measure);
    await saveReview(db, clock, '2026-10-05', { score: 7, reflection: '', planNextWeek: '' });
    await setMeasureValue(db, clock, id, 70);
    const past = await loadWeek(db, '2026-10-05', '2026-10-20');
    expect(past.goals[0]?.measures[0]?.progress).toBe(0.4);
    const current = await loadWeek(db, '2026-10-12', '2026-10-20');
    expect(current.goals[0]?.measures[0]?.progress).toBe(0.7);
    const live = await loadWeek(db, '2026-10-05', '2026-10-20', { live: true });
    expect(live.goals[0]?.measures[0]?.progress).toBe(0.7);
  });
});
