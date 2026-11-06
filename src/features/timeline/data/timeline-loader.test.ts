import { describe, expect, it } from 'vitest';
import { openTestDatabase } from '../../../core/db/testing.ts';
import { createHabit } from '../../habits/data/habits-repository.ts';
import { createGoal } from '../../goals/data/goals-repository.ts';
import { createProject } from '../../projects/data/projects-repository.ts';
import { startTimer, stopTimer } from '../../timer/data/timer-repository.ts';
import { completeTask, createTask } from '../../tasks/data/tasks-repository.ts';
import { addManualEntry } from '../../work-log/data/log-repository.ts';
import { loadTimeline } from './timeline-loader.ts';

const FROM = '2026-10-14T00:00:00.000Z';
const TO = '2026-10-15T00:00:00.000Z';
const clockAt = (time: string) => () => new Date(`2026-10-14T${time}:00.000Z`);
const project = { description: '', areaId: null, goalId: null, importance: 3, deadline: null, status: 'active' as const, color: 'pc5' };
const task = { notes: '', dueDate: null, importance: null, projectId: null, goalId: null };

describe('timeline loader', () => {
  it('labels an entry with its project and colours it like the project', async () => {
    const { db } = await openTestDatabase();
    const projectId = await createProject(db, clockAt('08:00'), { ...project, title: 'Portfolio site' });
    await addManualEntry(db, clockAt('10:30'), { target: { projectId }, durationMinutes: 30, note: 'Header' });
    const [item] = await loadTimeline(db, FROM, TO);
    expect(item).toMatchObject({ kind: 'block', label: 'Portfolio site', note: 'Header', minutes: 30, target: { projectId } });
    expect(item?.color).toBe('var(--pc5)');
    expect(item?.start).toEqual(new Date('2026-10-14T10:00:00.000Z'));
    expect(item?.end).toEqual(new Date('2026-10-14T10:30:00.000Z'));
  });

  it('labels with the task and takes the colour of its project', async () => {
    const { db } = await openTestDatabase();
    const projectId = await createProject(db, clockAt('08:00'), { ...project, title: 'Chapter 4: Evaluation' });
    const taskId = await createTask(db, clockAt('08:00'), { ...task, title: 'Rerun benchmarks', projectId });
    await addManualEntry(db, clockAt('12:00'), { target: { taskId }, durationMinutes: 60, note: '' });
    const [item] = await loadTimeline(db, FROM, TO);
    expect(item).toMatchObject({ label: 'Rerun benchmarks', projectName: 'Chapter 4: Evaluation', target: { taskId } });
    expect(item?.color).toBe('var(--pc5)');
  });

  it('is neutral for a standalone task and colours a goal-only entry like its goal', async () => {
    const { db } = await openTestDatabase();
    const taskId = await createTask(db, clockAt('08:00'), { ...task, title: 'Call the bank' });
    await addManualEntry(db, clockAt('12:00'), { target: { taskId }, durationMinutes: 20, note: '' });
    const goalId = await createGoal(db, clockAt('08:00'), {
      title: 'Get fit',
      description: '',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      color: 'pc3',
    });
    const goalTask = await createTask(db, clockAt('08:00'), { ...task, title: 'Run', goalId });
    await addManualEntry(db, clockAt('14:00'), { target: { taskId: goalTask }, durationMinutes: 20, note: '' });
    const [standalone, goalOnly] = await loadTimeline(db, FROM, TO);
    expect(standalone?.color).toBeNull();
    expect(goalOnly?.color).toBe('var(--pc3)');
  });

  it('shows a completed task as a marker', async () => {
    const { db } = await openTestDatabase();
    const projectId = await createProject(db, clockAt('08:00'), { ...project, title: 'Thesis' });
    const taskId = await createTask(db, clockAt('08:00'), { ...task, title: 'Email supervisor', projectId });
    await completeTask(db, clockAt('11:20'), taskId, { kind: 'skip' });
    const [item] = await loadTimeline(db, FROM, TO);
    expect(item).toMatchObject({ kind: 'marker', minutes: 0, label: 'Email supervisor' });
    expect(item?.start).toEqual(new Date('2026-10-14T11:20:00.000Z'));
    expect(item?.color).toBe('var(--pc5)');
  });

  it('leaves out entries of other days', async () => {
    const { db } = await openTestDatabase();
    const projectId = await createProject(db, clockAt('08:00'), { ...project, title: 'Thesis' });
    await addManualEntry(db, () => new Date('2026-10-13T10:00:00.000Z'), { target: { projectId }, durationMinutes: 30, note: '' });
    expect(await loadTimeline(db, FROM, TO)).toEqual([]);
  });

  it('shows the running timer as a block up to now', async () => {
    const { db } = await openTestDatabase();
    const taskId = await createTask(db, clockAt('08:00'), { ...task, title: 'Rerun benchmarks' });
    await startTimer(db, clockAt('09:00'), { taskId }, null);
    const [item] = await loadTimeline(db, FROM, TO, new Date('2026-10-14T09:20:00.000Z'));
    expect(item).toMatchObject({ running: true, kind: 'block', label: 'Rerun benchmarks', minutes: 20, target: { taskId } });
    expect(item?.end).toEqual(new Date('2026-10-14T09:20:00.000Z'));
  });

  it('labels a habit session with the habit and colours it like its project', async () => {
    const { db } = await openTestDatabase();
    const projectId = await createProject(db, clockAt('06:00'), { ...project, title: 'Training block 3' });
    const made = await createHabit(db, clockAt('06:00'), {
      title: 'Run 5 km',
      projectId,
      goalId: null,
      scheduleType: 'weekdays',
      weekdays: [1],
      timesPerWeek: null,
      reminderTime: null,
      active: true,
    });
    if (!made.ok) throw new Error('habit invalid');
    await startTimer(db, clockAt('07:00'), { habitId: made.id }, null);
    await stopTimer(db, clockAt('07:40'), '');
    const [item] = await loadTimeline(db, FROM, TO);
    expect(item).toMatchObject({
      kind: 'block',
      label: 'Run 5 km',
      minutes: 40,
      color: 'var(--pc5)',
      projectName: 'Training block 3',
      target: { projectId },
    });
  });
});
