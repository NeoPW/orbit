import { describe, expect, it } from 'vitest';
import { canStepBack, canStepForward, periodDays, currentPeriod, parsePeriod, periodBuckets, periodLabel, periodOfWeek, periodWeeks, stepPeriod, switchKind } from './period.ts';

const today = '2026-11-08';

describe('period', () => {
  it('steps back and forward across a year', () => {
    expect(periodLabel(stepPeriod(parsePeriod('2026-11', today), -1)!)).toBe('October 2026');
    expect(periodLabel(stepPeriod(parsePeriod('2026-01', today), -1)!)).toBe('December 2025');
    expect(periodLabel(stepPeriod(parsePeriod('2026-Q1', today), -1)!)).toBe('Q4 2025');
  });

  it('has no future periods', () => {
    expect(canStepForward(currentPeriod('quarter', today), today)).toBe(false);
    expect(canStepForward(parsePeriod('2026-10', today), today)).toBe(true);
    expect(canStepForward(currentPeriod('year', today), today)).toBe(false);
  });

  it('switches the kind to the period holding the start', () => {
    expect(switchKind(parsePeriod('2026-10', today), 'quarter', today).key).toBe('2026-Q4');
    expect(switchKind(parsePeriod('2026-05', today), 'year', today).key).toBe('2026');
    expect(switchKind(parsePeriod('2026-02', today), 'quarter', today).key).toBe('2026-Q1');
    expect(switchKind(currentPeriod('month', today), 'quarter', today).key).toBe('2026-Q4');
  });

  it('falls back to the current month for invalid or future addresses', () => {
    expect(parsePeriod('2026-13', today).key).toBe('2026-11');
    expect(parsePeriod('2027-01', today).key).toBe('2026-11');
    expect(parsePeriod('nonsense', today).key).toBe('2026-11');
    expect(parsePeriod(undefined, today).key).toBe('2026-11');
  });

  it('parses and labels every kind', () => {
    expect(periodLabel(parsePeriod('2026-Q3', today))).toBe('Q3 2026');
    expect(periodLabel(parsePeriod('2026', today))).toBe('2026');
    expect(periodLabel(parsePeriod('all', today))).toBe('All time');
  });

  it('gives a week to the period holding its Thursday', () => {
    expect(periodOfWeek('2026-09-28', 'month').key).toBe('2026-10');
    expect(periodWeeks(parsePeriod('2026-09', today), today)).not.toContain('2026-09-28');
    expect(periodWeeks(parsePeriod('2026-10', today), today)[0]).toBe('2026-09-28');
  });

  it('has 13 weekly points in a quarter', () => {
    const buckets = periodBuckets(parsePeriod('2026-Q3', today), today);
    expect(buckets).toHaveLength(13);
    expect(buckets.every((b) => !b.soFar)).toBe(true);
  });

  it('has monthly points of a year up to the current month', () => {
    const buckets = periodBuckets(currentPeriod('year', today), today);
    expect(buckets.map((b) => b.label)).toEqual(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov']);
    expect(buckets.filter((b) => b.soFar).map((b) => b.label)).toEqual(['Nov']);
  });

  it('starts all time at the given date', () => {
    const buckets = periodBuckets(parsePeriod('all', today), today, '2026-09-14');
    expect(buckets.map((b) => b.key)).toEqual(['2026-09', '2026-10', '2026-11']);
  });
});

describe('first use', () => {
  it('disables ‹ on the period holding the first-use date', () => {
    expect(canStepBack(parsePeriod('2026-09', today), '2026-09-10')).toBe(false);
    expect(canStepBack(parsePeriod('2026-10', today), '2026-09-10')).toBe(true);
    expect(canStepBack(parsePeriod('2026-09', today), null)).toBe(true);
    expect(canStepBack(parsePeriod('all', today), null)).toBe(false);
  });

  it('counts days from first use and leaves a period wholly before it empty', () => {
    expect(periodDays(parsePeriod('2026-11', today), today, '2026-11-03')).toBe(6);
    const october = parsePeriod('2026-10', today);
    expect(periodDays(october, today, '2026-11-03')).toBe(0);
    expect(periodWeeks(october, today, '2026-11-03')).toEqual([]);
  });

  it('keeps the week of first use even when first use is after its Thursday', () => {
    // Friday 2026-10-16: weeks of 10-12 (kept), 10-19, 10-26; 10-05 is before first use
    expect(periodWeeks(parsePeriod('2026-10', today), today, '2026-10-16')).toEqual(['2026-10-12', '2026-10-19', '2026-10-26']);
    expect(periodWeeks(parsePeriod('all', today), today, '2026-10-16')[0]).toBe('2026-10-12');
  });

  it('starts the buckets of a year at the first-use month', () => {
    const keys = periodBuckets(parsePeriod('2026', today), today, '2026-09-10').map((b) => b.key);
    expect(keys).toEqual(['2026-09', '2026-10', '2026-11']);
  });
});
