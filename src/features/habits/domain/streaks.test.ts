import { describe, expect, it } from 'vitest';
import { habitDayStates, habitStreak } from './streaks.ts';

const today = '2026-11-08';
const habit = (over: object = {}) => ({
  scheduleType: 'daily' as const,
  weekdays: null,
  timesPerWeek: null,
  createdAt: '2026-01-01T12:00:00',
  ...over,
});
const days = (...d: string[]) => d.map((x) => `2026-11-${x}`);

describe('habit streak', () => {
  it('does not break on a day that is still open', () => {
    expect(habitStreak(habit(), days('04', '05', '06', '07'), today).current).toBe(4);
  });

  it('breaks on a missed day', () => {
    const s = habitStreak(habit(), days('04', '05', '07'), today);
    expect(s).toMatchObject({ current: 1, best: 2 });
  });

  it('skips days that are not due and ignores checks on them', () => {
    const h = habit({ scheduleType: 'weekdays', weekdays: [1, 3, 5] });
    expect(habitStreak(h, days('02', '04', '06'), today).current).toBe(3);
    expect(habitStreak(h, days('02', '04', '06', '07'), today).current).toBe(3);
  });

  it('counts weeks that reach the weekly target', () => {
    const h = habit({ scheduleType: 'times_per_week', timesPerWeek: 2 });
    const checks = ['2026-10-19', '2026-10-21', '2026-10-26', '2026-10-27', '2026-11-02'];
    const s = habitStreak(h, checks, '2026-11-04');
    expect(s).toMatchObject({ current: 2, unit: 'weeks' });
    expect(habitStreak(h, [...checks, '2026-11-03'], '2026-11-04').current).toBe(3);
  });

  it('keeps a best streak longer than the current one', () => {
    const run = Array.from({ length: 10 }, (_, i) => `2026-10-${String(i + 1).padStart(2, '0')}`);
    const s = habitStreak(habit({ createdAt: '2026-10-01T12:00:00' }), [...run, ...days('06', '07', '08')], today);
    expect(s).toMatchObject({ current: 3, best: 10 });
  });

  it('is zero for a new habit', () => {
    expect(habitStreak(habit({ createdAt: '2026-11-08T09:00:00' }), [], today)).toMatchObject({ current: 0, best: 0 });
  });
});

describe('habit day states', () => {
  it('marks a missed due day and leaves the rest neutral', () => {
    const h = habit({ scheduleType: 'weekdays', weekdays: [1, 5] });
    const s = habitDayStates(h, ['2026-11-02'], '2026-11-02', '2026-11-08', today);
    expect(s.get('2026-11-02')).toBe('checked');
    expect(s.get('2026-11-06')).toBe('missed');
    expect(s.get('2026-11-04')).toBe('neutral');
  });

  it('is neutral before creation and for today while open', () => {
    const h = habit({ createdAt: '2026-10-20T12:00:00' });
    const s = habitDayStates(h, [], '2026-10-18', '2026-11-08', today);
    expect(s.get('2026-10-19')).toBe('neutral');
    expect(s.get('2026-10-20')).toBe('missed');
    expect(s.get('2026-11-08')).toBe('neutral');
  });

  it('marks only checked days of a weekly habit', () => {
    const h = habit({ scheduleType: 'times_per_week', timesPerWeek: 3 });
    const s = habitDayStates(h, ['2026-11-02', '2026-11-04', '2026-11-06'], '2026-11-02', '2026-11-08', today);
    expect([...s.values()].filter((v) => v === 'checked')).toHaveLength(3);
    expect([...s.values()].includes('missed')).toBe(false);
  });
});
