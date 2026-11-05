import { describe, expect, it } from 'vitest';
import { currentWeekStart, formatWeekRange, lastWeekStart, reviewWeekStart, weekRange } from './review-week.ts';

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

  it('gives the current and last week', () => {
    expect(currentWeekStart('2026-10-12')).toBe('2026-10-12');
    expect(formatWeekRange(lastWeekStart('2026-10-07'))).toBe('28-09-2026 – 04-10-2026');
  });

  it('spans seven local days', () => {
    const { from, to } = weekRange('2026-10-05');
    expect(new Date(from).getDate()).toBe(5);
    expect(new Date(to).getDate()).toBe(12);
  });
});
