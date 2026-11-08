import { describe, expect, it } from 'vitest';
import {
  calendarWeek,
  currentWeekStart,
  formatWeekFull,
  formatWeekRange,
  resolveWeek,
  reviewWeekStart,
  weekRange,
} from './review-week.ts';

describe('review week', () => {
  it('is the week ending today on a Sunday', () => {
    expect(reviewWeekStart('2026-10-11')).toBe('2026-10-05');
    expect(formatWeekRange(reviewWeekStart('2026-10-11'))).toBe('05-10-2026 – 11-10-2026');
  });

  it('is the previous week on a Monday', () => {
    expect(formatWeekRange(reviewWeekStart('2026-10-12'))).toBe('05-10-2026 – 11-10-2026');
  });

  it('is the previous week on a Saturday', () => {
    expect(formatWeekRange(reviewWeekStart('2026-10-10'))).toBe('28-09-2026 – 04-10-2026');
  });

  it('gives the current week', () => {
    expect(currentWeekStart('2026-10-12')).toBe('2026-10-12');
    expect(formatWeekRange(currentWeekStart('2026-10-07'))).toBe('05-10-2026 – 11-10-2026');
  });

  it('spans seven local days', () => {
    const { from, to } = weekRange('2026-10-05');
    expect(new Date(from).getDate()).toBe(5);
    expect(new Date(to).getDate()).toBe(12);
  });
});

describe('resolveWeek', () => {
  const today = '2026-11-04';
  it('keeps a past week', () => expect(resolveWeek('2026-10-26', today)).toBe('2026-10-26'));
  it('snaps a date to the Monday of its week', () => expect(resolveWeek('2026-10-29', today)).toBe('2026-10-26'));
  it('uses the current week when missing, invalid or in the future', () => {
    expect(resolveWeek(undefined, today)).toBe('2026-11-02');
    expect(resolveWeek('2026-13-45', today)).toBe('2026-11-02');
    expect(resolveWeek('2026-11-16', today)).toBe('2026-11-02');
  });
});

describe('calendar weeks', () => {
  it('numbers the week of Monday 2026-11-02 as CW 45', () => {
    expect(calendarWeek('2026-11-02')).toBe(45);
    expect(formatWeekFull('2026-11-02')).toBe('CW 45 · 02-11-2026 – 08-11-2026');
  });
  it('knows the year boundary', () => {
    expect(calendarWeek('2026-12-28')).toBe(53);
    expect(calendarWeek('2027-01-04')).toBe(1);
    expect(calendarWeek('2024-12-30')).toBe(1);
  });
});
