import { describe, expect, it } from 'vitest';
import { createFields } from '../../../core/db/records.ts';
import { goals, habits, projects, tasks, timers } from '../../../core/db/schema.ts';
import { openTestDatabase } from '../../../core/db/testing.ts';
import { TIMER_ID } from '../../../core/db/records.ts';
import { loadReminderInput } from './reminder-input.ts';

const clock = () => new Date('2026-10-14T08:00:00Z');

describe('loadReminderInput', () => {
  it('reads active habits with their link, usable tasks and projects, and the timer', async () => {
    const { db } = await openTestDatabase();
    const goal = { ...createFields(clock), title: 'Get fit' };
    const active = { ...createFields(clock), title: 'Garden', deadline: '2026-10-20' };
    const paused = { ...createFields(clock), title: 'Shed', status: 'paused' as const };
    await db.insert(goals).values(goal);
    await db.insert(projects).values([active, paused]);
    await db.insert(habits).values([
      { ...createFields(clock), title: 'Run', goalId: goal.id },
      { ...createFields(clock), title: 'Off', active: false },
    ]);
    await db.insert(tasks).values([
      { ...createFields(clock), title: 'Loose', dueDate: '2026-10-20' },
      { ...createFields(clock), title: 'In garden', dueDate: '2026-10-21', projectId: active.id },
      { ...createFields(clock), title: 'In shed', dueDate: '2026-10-22', projectId: paused.id },
      { ...createFields(clock), title: 'No date' },
    ]);
    await db
      .insert(timers)
      .values({ ...createFields(clock, TIMER_ID), projectId: active.id, startedAt: '2026-10-14T09:00:00.000Z', plannedMinutes: 25 });

    const input = await loadReminderInput(db, '2026-10-14');
    expect(input.habits.map((h) => [h.title, h.linkTitle])).toEqual([['Run', 'Get fit']]);
    expect(input.tasks.map((t) => t.title).sort()).toEqual(['In garden', 'Loose']);
    expect(input.projects).toEqual([{ id: active.id, title: 'Garden', deadline: '2026-10-20' }]);
    expect(input.focus).toEqual({ title: 'Garden', startedAt: '2026-10-14T09:00:00.000Z', workedSeconds: 0, limitMinutes: 25 });
  });
});
