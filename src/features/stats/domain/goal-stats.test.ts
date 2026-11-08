import { describe, expect, it } from 'vitest';
import { goalProgressAt, goalStatsRows, projectGoal, type GoalStatsRows, type StatsGoal } from './goal-stats.ts';
import { parsePeriod } from './period.ts';

const today = '2026-11-08';
const at = (date: string, time = '10:00:00') => new Date(`${date}T${time}`).toISOString();
const goal = (over: Partial<StatsGoal> = {}): StatsGoal => ({ id: 'g', title: 'Get fit', color: null, startDate: '2026-01-01', endDate: null, ...over });
const numeric = (current: number, changes: { at: string; from: number | null }[] = [], over: object = {}) => ({
  goalId: 'g',
  measureType: 'numeric' as const,
  startValue: 0,
  targetValue: 100,
  currentValue: current,
  habitId: null,
  checkDates: [] as string[],
  changes,
  ...over,
});
const rowsOf = (g: StatsGoal, measures: ReturnType<typeof numeric>[]): GoalStatsRows => ({ goals: [g], measures });
const period = (key: string) => parsePeriod(key, today);

describe('goal progress at a date', () => {
  it('uses the value that held at the end of that day', () => {
    const m = numeric(7, [{ at: at('2026-10-05'), from: 0 }, { at: at('2026-10-08'), from: 4 }], { targetValue: 10 });
    expect(goalProgressAt([m], '2026-10-07')).toBe(0.4);
    expect(goalProgressAt([m], '2026-10-11')).toBe(0.7);
  });

  it('counts the check-ins of a habit measure up to the date', () => {
    const checks = [...Array.from({ length: 12 }, (_, i) => `2026-09-${String(i + 1).padStart(2, '0')}`), '2026-10-05', '2026-10-06', '2026-10-07'];
    const m = numeric(0, [], { measureType: 'habit', habitId: 'h', targetValue: 30, checkDates: checks });
    expect(goalProgressAt([m], '2026-09-30')).toBeCloseTo(0.4);
    expect(goalProgressAt([m], '2026-10-31')).toBeCloseTo(0.5);
  });
});

describe('goal rows', () => {
  it('shows progress and the change in the period', () => {
    const m = numeric(55, [{ at: at('2026-10-15'), from: 40 }]);
    const [row] = goalStatsRows(rowsOf(goal(), [m]), period('2026-10'), today);
    expect(row).toMatchObject({ progress: 55, change: 15 });
  });

  it('shows no change when progress stayed', () => {
    const [row] = goalStatsRows(rowsOf(goal(), [numeric(40)]), period('2026-10'), today);
    expect(row).toMatchObject({ progress: 40, change: null });
  });

  it('lists a goal without measures as having none', () => {
    const [row] = goalStatsRows(rowsOf(goal(), []), period('2026-10'), today);
    expect(row).toMatchObject({ hasMeasures: false, progress: null });
  });

  it('leaves out a goal that has not started', () => {
    expect(goalStatsRows(rowsOf(goal({ startDate: '2026-12-01' }), [numeric(10)]), period('2026-10'), today)).toEqual([]);
  });

  it('has a point for each of the 13 weeks of a quarter', () => {
    const [row] = goalStatsRows(rowsOf(goal(), [numeric(40)]), period('2026-Q3'), today);
    expect(row?.series).toHaveLength(13);
  });
});

describe('projected finish', () => {
  // 40 % today, 20 % twenty-eight days ago.
  const m = numeric(40, [{ at: at('2026-10-29'), from: 20 }]);

  it('is ahead of a later deadline', () => {
    expect(projectGoal(goal({ endDate: '2027-03-31' }), [m], today)).toEqual({ kind: 'date', date: '2027-01-31', daysVsDeadline: -59 });
  });

  it('is behind an earlier deadline', () => {
    expect(projectGoal(goal({ endDate: '2027-01-01' }), [m], today)).toEqual({ kind: 'date', date: '2027-01-31', daysVsDeadline: 30 });
  });

  it('has no comparison without a deadline', () => {
    expect(projectGoal(goal(), [m], today)).toEqual({ kind: 'date', date: '2027-01-31', daysVsDeadline: null });
  });

  it('is too early for a goal started 5 days ago', () => {
    expect(projectGoal(goal({ startDate: '2026-11-03' }), [m], today)).toEqual({ kind: 'early' });
  });

  it('has no date without progress', () => {
    expect(projectGoal(goal(), [numeric(40)], today)).toEqual({ kind: 'stalled' });
  });

  it('is complete at 100 %', () => {
    expect(projectGoal(goal(), [numeric(100)], today)).toEqual({ kind: 'complete' });
  });
});
