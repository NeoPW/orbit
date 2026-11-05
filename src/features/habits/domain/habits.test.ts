import { describe, expect, it } from 'vitest';
import { isDue, isoWeekday, scheduleSummary, validateSchedule, type HabitSchedule } from './habits.ts';

const habit = (over: Partial<HabitSchedule>): HabitSchedule => ({
  active: true,
  scheduleType: 'daily',
  weekdays: null,
  timesPerWeek: null,
  ...over,
});

// 2026-11-02 is a Monday.
describe('habit due', () => {
  it('daily is due every day', () => {
    for (const d of ['2026-11-02', '2026-11-07', '2026-11-08']) expect(isDue(habit({}), d, [])).toBe(true);
  });

  it('weekday not selected is not due', () => {
    const h = habit({ scheduleType: 'weekdays', weekdays: [1, 3, 5] });
    expect(isoWeekday('2026-11-03')).toBe(2);
    expect(isDue(h, '2026-11-03', [])).toBe(false);
    expect(isDue(h, '2026-11-04', [])).toBe(true);
  });

  it('times per week reached is not due', () => {
    const h = habit({ scheduleType: 'times_per_week', timesPerWeek: 3 });
    expect(isDue(h, '2026-11-05', ['2026-11-02', '2026-11-03'])).toBe(true);
    expect(isDue(h, '2026-11-05', ['2026-11-02', '2026-11-03', '2026-11-04'])).toBe(false);
  });

  it('a new week is due again', () => {
    const h = habit({ scheduleType: 'times_per_week', timesPerWeek: 3 });
    const last = ['2026-10-26', '2026-10-28', '2026-11-01'];
    expect(isDue(h, '2026-11-02', last)).toBe(true);
    expect(isDue(h, '2026-11-01', last)).toBe(false);
  });

  it('an inactive habit is never due', () => {
    expect(isDue(habit({ active: false }), '2026-11-02', [])).toBe(false);
  });
});

describe('schedule', () => {
  it('rejects weekdays without a day', () => {
    expect(validateSchedule({ scheduleType: 'weekdays', weekdays: [], timesPerWeek: null }).weekdays).toBeDefined();
  });

  it('summarizes saved weekdays Monday first', () => {
    expect(scheduleSummary({ scheduleType: 'weekdays', weekdays: [5, 1, 3], timesPerWeek: null })).toBe('Mon, Wed, Fri');
    expect(validateSchedule({ scheduleType: 'weekdays', weekdays: [1, 3, 5], timesPerWeek: null })).toEqual({});
  });

  it('rejects times per week out of range', () => {
    for (const n of [8, 0, null]) {
      expect(validateSchedule({ scheduleType: 'times_per_week', weekdays: [], timesPerWeek: n }).timesPerWeek).toBeDefined();
    }
    expect(validateSchedule({ scheduleType: 'times_per_week', weekdays: [], timesPerWeek: 7 })).toEqual({});
  });

  it('summarizes daily and times per week', () => {
    expect(scheduleSummary({ scheduleType: 'daily', weekdays: null, timesPerWeek: null })).toBe('Daily');
    expect(scheduleSummary({ scheduleType: 'times_per_week', weekdays: null, timesPerWeek: 3 })).toBe('3 times per week');
  });
});
