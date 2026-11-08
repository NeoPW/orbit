import { describe, expect, it } from 'vitest';
import { ongoingText, phoneReminders, reminderId } from './android-plan.ts';
import { planReminders, type ReminderInput, type ReminderSettings } from './plan-reminders.ts';

const local = (y: number, m: number, d: number, h = 0, min = 0) => new Date(y, m - 1, d, h, min);
const settings: ReminderSettings = { remindersOn: true, reminderTime: '08:00', leadDays: 7, reviewDay: 7, reviewTime: '18:00' };
const input: ReminderInput = {
  habits: [
    {
      id: 'h1',
      title: 'Stretch',
      active: true,
      scheduleType: 'daily',
      weekdays: null,
      timesPerWeek: null,
      reminderTime: '18:00',
      linkTitle: null,
    },
  ],
  checks: [],
  tasks: [{ id: 't1', title: 'Book venue', dueDate: '2026-11-10' }],
  projects: [{ id: 'p1', title: 'Garden', deadline: '2026-11-11' }],
  completedReviewWeeks: [],
  focus: { title: 'Thesis', startedAt: local(2026, 11, 9, 10, 0).toISOString(), workedSeconds: 0, limitMinutes: 30 },
};
/** Monday 2026-11-09 9:00 to a week later, as the phone plans. */
const week = (s: Partial<ReminderSettings> = {}) =>
  phoneReminders(planReminders(input, { ...settings, ...s }, local(2026, 11, 9, 9, 0), local(2026, 11, 16, 9, 0)));

describe('phone reminders', () => {
  it('leaves out the weekly review, which is not on the phone', () => {
    const titles = week().map((r) => r.title);
    expect(titles).not.toContain('Weekly review');
    expect(titles).toContain('Stretch');
  });

  it('asks about the habit and date, the task and the project', () => {
    const list = week();
    expect(list.find((r) => r.title === 'Stretch')?.check).toEqual({ kind: 'habit', id: 'h1', date: '2026-11-09' });
    expect(list.find((r) => r.title === 'Book venue')?.check).toEqual({ kind: 'task', id: 't1' });
    expect(list.find((r) => r.title === 'Garden')?.check).toEqual({ kind: 'project', id: 'p1' });
  });

  it('keeps the end of a focus session, without a check, when reminders are off', () => {
    const list = week({ remindersOn: false });
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({
      title: 'Thesis: 30 minutes done',
      route: '/focus',
      check: null,
      at: local(2026, 11, 9, 10, 30).getTime(),
    });
  });

  it('plans a daily habit on all 7 days', () => {
    expect(week().filter((r) => r.title === 'Stretch')).toHaveLength(7);
  });
});

describe('reminderId', () => {
  it('is stable for a key and differs between keys', () => {
    expect(reminderId('habit:h1:2026-11-09')).toBe(reminderId('habit:h1:2026-11-09'));
    expect(reminderId('habit:h1:2026-11-09')).not.toBe(reminderId('habit:h1:2026-11-10'));
  });

  it('is a positive 31-bit number outside the reserved ids 1–9', () => {
    for (const key of ['', 'a', 'focus:2026-11-08T10:00:00.000Z:30', 'deadline:task:t1:2026-11-09:due']) {
      const id = reminderId(key);
      expect(Number.isInteger(id)).toBe(true);
      expect(id).toBeGreaterThanOrEqual(10);
      expect(id).toBeLessThanOrEqual(0x7fffffff);
    }
  });
});

describe('ongoingText', () => {
  it('reads "Running since" with the start of the current stretch', () => {
    const startedAt = local(2026, 11, 9, 10, 15).toISOString();
    expect(ongoingText({ title: 'Thesis', startedAt, pausedAt: null, workedSeconds: 600 })).toEqual({
      title: 'Thesis',
      body: 'Running since 10:15',
    });
  });

  it('reads "Paused" with the whole minutes worked', () => {
    const startedAt = local(2026, 11, 9, 10, 15).toISOString();
    expect(ongoingText({ title: 'Thesis', startedAt, pausedAt: startedAt, workedSeconds: 25 * 60 + 40 })).toEqual({
      title: 'Thesis',
      body: 'Paused · 25 min',
    });
  });
});
