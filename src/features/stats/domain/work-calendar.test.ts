import { describe, expect, it } from 'vitest';
import { parsePeriod } from './period.ts';
import { calendarRange, dailyMinutes, intensity, weekdayHourMinutes } from './work-calendar.ts';

const today = '2026-11-08';
const manual = (at: string, minutes: number | null) => ({ source: 'manual', occurredAt: new Date(at).toISOString(), durationMinutes: minutes });
const timer = (at: string, minutes: number) => ({ source: 'timer', occurredAt: new Date(at).toISOString(), durationMinutes: minutes });

describe('intensity', () => {
  it('shades by the share of the busiest day', () => {
    expect(intensity(5 * 60, 8 * 60)).toBe(3);
    expect(intensity(8 * 60, 8 * 60)).toBe(4);
    expect(intensity(60, 8 * 60)).toBe(1);
    expect(intensity(0, 8 * 60)).toBe(0);
  });
});

describe('calendar range', () => {
  it('covers the year of the period', () => {
    const { start, end } = calendarRange(parsePeriod('2026-10', today), today);
    expect(start).toBe('2025-12-29');
    expect(end).toBe('2027-01-03');
  });

  it('covers 53 weeks up to the current week for all time', () => {
    const { start, end } = calendarRange(parsePeriod('all', today), today);
    expect(end).toBe('2026-11-08');
    expect(start).toBe('2025-11-03');
  });
});

describe('daily minutes', () => {
  it('sums by local date', () => {
    const days = dailyMinutes([manual('2026-10-05T10:00:00', 90), manual('2026-10-05T15:00:00', 60), manual('2026-10-06T10:00:00', null)], '2026-10-01', '2026-10-31');
    expect(days.get('2026-10-05')).toBe(150);
    expect(days.has('2026-10-06')).toBe(false);
  });
});

describe('weekday and hour heatmap', () => {
  const from = '2026-10-01';
  const to = '2026-10-31';

  it('spreads an entry over the hours it spans', () => {
    // Monday 2026-10-05, 09:40–10:20.
    const grid = weekdayHourMinutes([timer('2026-10-05T09:40:00', 40)], from, to);
    expect(grid[0]?.[9]).toBe(20);
    expect(grid[0]?.[10]).toBe(20);
  });

  it('adds nothing for an entry without a duration', () => {
    const grid = weekdayHourMinutes([manual('2026-10-05T10:00:00', null)], from, to);
    expect(grid.flat().every((m) => m === 0)).toBe(true);
  });

  it('adds up the same weekday and hour of different weeks', () => {
    const grid = weekdayHourMinutes([timer('2026-10-05T14:00:00', 60), timer('2026-10-12T14:00:00', 60)], from, to);
    expect(grid[0]?.[14]).toBe(120);
  });

  it('counts only dates in the range', () => {
    const grid = weekdayHourMinutes([timer('2026-09-28T14:00:00', 60)], from, to);
    expect(grid.flat().every((m) => m === 0)).toBe(true);
  });
});
