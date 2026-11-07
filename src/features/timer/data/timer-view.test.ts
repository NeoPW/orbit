import { describe, expect, it } from 'vitest';
import { createHabit } from '../../habits/data/habits-repository.ts';
import { createFields } from '../../../core/db/records.ts';
import { projects, tasks } from '../../../core/db/schema.ts';
import { openTestDatabase } from '../../../core/db/testing.ts';
import { getTimerView } from './timer-view.ts';
import { pauseTimer, startTimer } from './timer-repository.ts';

const clock = () => new Date('2026-11-05T09:00:00Z');

describe('timer view', () => {
  it('gives a task timer the colour and name of its project', async () => {
    const { db } = await openTestDatabase();
    const project = { ...createFields(clock), title: 'Thesis', color: 'pc3' };
    await db.insert(projects).values(project);
    const task = { ...createFields(clock), title: 'Rerun', projectId: project.id };
    await db.insert(tasks).values(task);
    await startTimer(db, clock, { taskId: task.id });
    expect(await getTimerView(db)).toMatchObject({ title: 'Rerun', projectName: 'Thesis', projectColor: 'var(--pc3)' });
  });

  it('shows a paused session with its worked minutes and limit', async () => {
    const { db } = await openTestDatabase();
    const task = { ...createFields(clock), title: 'Rerun' };
    await db.insert(tasks).values(task);
    await startTimer(db, () => new Date('2026-11-05T08:30:00Z'), { taskId: task.id });
    await pauseTimer(db, clock);
    expect((await getTimerView(db))?.timer).toMatchObject({
      pausedAt: '2026-11-05T09:00:00.000Z',
      workedSeconds: 1800,
      plannedMinutes: null,
    });
  });

  it('has no colour for a task outside a project', async () => {
    const { db } = await openTestDatabase();
    const task = { ...createFields(clock), title: 'Book physio' };
    await db.insert(tasks).values(task);
    await startTimer(db, clock, { taskId: task.id });
    expect(await getTimerView(db)).toMatchObject({ projectName: null, projectColor: null });
  });

  it('gives a habit timer the habit, its project colour and whether it is checked today', async () => {
    const { db } = await openTestDatabase();
    const project = { ...createFields(clock), title: 'Training', color: 'pc2' };
    await db.insert(projects).values(project);
    const made = await createHabit(db, clock, {
      title: 'Run 5 km',
      projectId: project.id,
      goalId: null,
      scheduleType: 'weekdays',
      weekdays: [1],
      timesPerWeek: null,
      reminderTime: null,
      active: true,
    });
    if (!made.ok) throw new Error('habit invalid');
    await startTimer(db, clock, { habitId: made.id });
    expect(await getTimerView(db)).toMatchObject({
      title: 'Run 5 km',
      projectName: 'Training',
      projectColor: 'var(--pc2)',
      habit: { id: made.id, checkedToday: false },
    });
  });
});
