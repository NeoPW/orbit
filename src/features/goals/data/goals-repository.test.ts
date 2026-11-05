import { describe, expect, it } from 'vitest';
import { createFields } from '../../../core/db/records.ts';
import { habitChecks, habits, projects, tasks } from '../../../core/db/schema.ts';
import { openTestDatabase } from '../../../core/db/testing.ts';
import { createGoal, deleteGoal, getGoal, listActiveGoals, listArchivedGoals, setGoalStatus, type GoalInput } from './goals-repository.ts';
import { addMeasure } from './measures-repository.ts';

const clock = () => new Date('2026-10-07T10:00:00Z');
const input: GoalInput = { title: 'Get fit', description: '', startDate: '2026-10-01', endDate: '2026-12-31', color: null };

describe('goals repository', () => {
  it('creates an active goal after the existing goals', async () => {
    const { db } = await openTestDatabase();
    await createGoal(db, clock, { ...input, title: 'First' });
    const id = await createGoal(db, clock, input);
    const goal = await getGoal(db, id);
    expect(goal?.goal).toMatchObject({ title: 'Get fit', status: 'active', startDate: '2026-10-01', endDate: '2026-12-31', sortOrder: 1 });
    expect(goal?.index).toBe(1);
    expect((await listActiveGoals(db)).map((g) => g.goal.title)).toEqual(['First', 'Get fit']);
  });

  it('lists completed and archived goals, most recently updated first', async () => {
    const { db } = await openTestDatabase();
    const a = await createGoal(db, () => new Date('2026-10-01T10:00:00Z'), { ...input, title: 'A' });
    const b = await createGoal(db, () => new Date('2026-10-01T10:00:00Z'), { ...input, title: 'B' });
    await createGoal(db, clock, { ...input, title: 'Active' });
    await setGoalStatus(db, () => new Date('2026-10-02T10:00:00Z'), a, 'completed');
    await setGoalStatus(db, () => new Date('2026-10-03T10:00:00Z'), b, 'archived');
    expect((await listArchivedGoals(db)).map((g) => g.title)).toEqual(['B', 'A']);
  });

  it('hides a completed goal from the active list', async () => {
    const { db } = await openTestDatabase();
    const id = await createGoal(db, clock, input);
    await setGoalStatus(db, clock, id, 'completed');
    expect(await listActiveGoals(db)).toHaveLength(0);
    expect((await getGoal(db, id))?.goal.status).toBe('completed');
  });

  it('deletes the goal with its measures and keeps linked projects, tasks and habits unlinked', async () => {
    const { db } = await openTestDatabase();
    const id = await createGoal(db, clock, input);
    await addMeasure(db, clock, id, { title: 'Run', description: '', measureType: 'boolean', startValue: null, targetValue: null, currentValue: 0, unit: null, step: 1, habitId: null });
    await db.insert(projects).values({ ...createFields(clock), title: 'Marathon', goalId: id });
    await db.insert(tasks).values({ ...createFields(clock), title: 'Book physio', goalId: id });
    await db.insert(habits).values({ ...createFields(clock), title: 'Stretch', goalId: id });
    await deleteGoal(db, clock, id);
    expect(await getGoal(db, id)).toBeUndefined();
    expect(await listActiveGoals(db)).toHaveLength(0);
    for (const table of [projects, tasks, habits]) {
      const [row] = await db.select().from(table);
      expect(row?.goalId).toBeNull();
      expect(row?.deletedAt).toBeNull();
    }
  });

  it('counts only check-ins on or after the goal start for a habit measure', async () => {
    const { db } = await openTestDatabase();
    const id = await createGoal(db, clock, input);
    const habitId = 'habit-1';
    await addMeasure(db, clock, id, { title: 'Gym', description: '', measureType: 'habit', startValue: null, targetValue: 20, currentValue: null, unit: null, step: 1, habitId });
    for (const date of ['2026-09-30', '2026-10-02']) {
      await db.insert(habitChecks).values({ ...createFields(clock), habitId, date });
    }
    const goal = await getGoal(db, id);
    expect(goal?.measures[0]?.checkIns).toBe(1);
  });
});
