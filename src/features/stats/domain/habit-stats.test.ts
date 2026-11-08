import { describe, expect, it } from 'vitest';
import { habitStatsRows, type HabitRows } from './habit-stats.ts';
import { parsePeriod } from './period.ts';

const today = '2026-11-08';
const habit = (id: string, title: string) => ({
  id,
  title,
  active: true,
  scheduleType: 'daily' as const,
  weekdays: null,
  timesPerWeek: null,
  createdAt: '2026-10-01T12:00:00',
});
const checks = (id: string, dates: string[]) => dates.map((date) => ({ habitId: id, date }));
const entry = (habitId: string, date: string, minutes: number) => ({ habitId, occurredAt: new Date(`${date}T10:00:00`).toISOString(), durationMinutes: minutes });

describe('habit stats rows', () => {
  it('gives streaks, check-ins kept of expected and time', () => {
    const october = Array.from({ length: 20 }, (_, i) => `2026-10-${String(i + 1).padStart(2, '0')}`);
    const rows: HabitRows = {
      habits: [habit('r', 'Read')],
      checks: checks('r', october),
      entries: [entry('r', '2026-10-03', 120), entry('r', '2026-10-04', 240), entry('r', '2026-09-01', 600)],
    };
    const [row] = habitStatsRows(rows, parsePeriod('2026-10', today), today);
    expect(row?.kept).toBe(20);
    expect(row?.expected).toBe(32);
    expect(row?.share).toBe(63);
    expect(row?.minutes).toBe(360);
    expect(row?.streak.best).toBe(20);
  });

  it('lists the longest current streak first, then by title', () => {
    const rows: HabitRows = {
      habits: [habit('a', 'Run'), habit('b', 'Read'), habit('c', 'Cook')],
      checks: [...checks('a', ['2026-11-06', '2026-11-07', '2026-11-08']), ...checks('b', ['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08'])],
      entries: [],
    };
    expect(habitStatsRows(rows, parsePeriod('2026-11', today), today).map((r) => r.title)).toEqual(['Read', 'Run', 'Cook']);
  });

  it('skips inactive habits', () => {
    const rows: HabitRows = { habits: [{ ...habit('a', 'Run'), active: false }], checks: [], entries: [] };
    expect(habitStatsRows(rows, parsePeriod('2026-11', today), today)).toEqual([]);
  });
});
