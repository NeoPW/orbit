import { describe, expect, it } from 'vitest';
import { weekRange } from './review-week.ts';
import type { WeekRows } from './week-summary.ts';
import { recentWeeks, weekTime } from './week-time.ts';

/** A local date and time as an ISO instant, whatever the time zone of the test run. */
const at = (date: string, time = '12:00') => new Date(`${date}T${time}:00`).toISOString();
const week = weekRange('2026-10-05');
const TODAY = '2026-10-14';

const empty = (): WeekRows => ({
  goals: [],
  areas: [],
  measures: [],
  projects: [],
  tasks: [],
  habits: [],
  habitChecks: [],
  logEntries: [],
  reviews: [],
  snapshots: [],
});
const project = (id: string, title: string, extra: Partial<WeekRows['projects'][number]> = {}): WeekRows['projects'][number] => ({
  id,
  title,
  goalId: null,
  areaId: null,
  color: null,
  status: 'active',
  completedAt: null,
  deletedAt: null,
  ...extra,
});
const entry = (
  date: string,
  minutes: number | null,
  extra: Partial<WeekRows['logEntries'][number]> = {},
): WeekRows['logEntries'][number] => ({
  projectId: null,
  goalId: null,
  taskId: null,
  habitId: null,
  occurredAt: at(date),
  durationMinutes: minutes,
  ...extra,
});
const area = (id: string, name: string) => ({ id, name, color: '#112233' });
const goal = (id: string, title: string) => ({ id, title, status: 'active' as const, color: null });

describe('week time figures', () => {
  it('sums the entries of the week, ignoring entries without duration and outside the week', () => {
    const rows = {
      ...empty(),
      logEntries: [entry('2026-10-06', 30), entry('2026-10-07', 45), entry('2026-10-08', null), entry('2026-10-04', 99)],
    };
    expect(weekTime(rows, week, TODAY, null).totalMinutes).toBe(75);
  });

  it('shows the share of the target', () => {
    const rows = { ...empty(), logEntries: [entry('2026-10-06', 15 * 60 + 44)] };
    const time = weekTime(rows, week, TODAY, 20);
    expect(time).toMatchObject({ targetMinutes: 1200, targetShare: 79 });
  });

  it('has no target share without a target', () => {
    expect(weekTime(empty(), week, TODAY, null)).toMatchObject({ targetMinutes: null, targetShare: null });
  });

  it('averages the current week over the days so far', () => {
    const rows = { ...empty(), logEntries: [entry('2026-10-12', 15 * 60 + 44)] };
    expect(weekTime(rows, weekRange('2026-10-12'), '2026-10-13', null).dailyAverageMinutes).toBe(7 * 60 + 52);
  });

  it('averages a past week over 7 days', () => {
    const rows = { ...empty(), logEntries: [entry('2026-10-06', 14 * 60)] };
    expect(weekTime(rows, week, '2026-11-01', null).dailyAverageMinutes).toBe(120);
  });

  it('shows the share of time on goals', () => {
    const rows = {
      ...empty(),
      goals: [goal('g1', 'Get fit')],
      projects: [project('p1', 'Run club', { goalId: 'g1' })],
      logEntries: [entry('2026-10-06', 600, { projectId: 'p1' }), entry('2026-10-07', 150)],
    };
    expect(weekTime(rows, week, TODAY, null)).toMatchObject({ goalMinutes: 600, goalShare: 80 });
  });

  it('leaves the share on goals out without time', () => {
    expect(weekTime(empty(), week, TODAY, null)).toMatchObject({ totalMinutes: 0, goalShare: null });
  });
});

describe('week time grouping', () => {
  it('groups by area with unassigned time as Other, last', () => {
    const rows = {
      ...empty(),
      areas: [area('a1', 'Work')],
      projects: [project('p1', 'Thesis', { areaId: 'a1' }), project('p2', 'Garden')],
      tasks: [{ id: 't1', title: 'Call', projectId: null, goalId: null, status: 'open', completedAt: null, deletedAt: null }],
      logEntries: [
        entry('2026-10-06', 180, { projectId: 'p1' }),
        entry('2026-10-07', 60, { projectId: 'p2' }),
        entry('2026-10-08', 30, { taskId: 't1' }),
      ],
    };
    expect(weekTime(rows, week, TODAY, null).byArea.map((i) => [i.title, i.minutes])).toEqual([
      ['Work', 180],
      ['Other', 90],
    ]);
  });

  it('counts an entry of a task for the project of the task', () => {
    const rows = {
      ...empty(),
      projects: [project('p1', 'Thesis')],
      tasks: [{ id: 't1', title: 'Write', projectId: 'p1', goalId: null, status: 'open', completedAt: null, deletedAt: null }],
      logEntries: [entry('2026-10-06', 45, { taskId: 't1' })],
    };
    expect(weekTime(rows, week, TODAY, null).byProject).toMatchObject([{ id: 'p1', title: 'Thesis', minutes: 45 }]);
  });

  it('counts habit time for the project, its area and its goal', () => {
    const rows = {
      ...empty(),
      areas: [area('a1', 'Sport')],
      goals: [goal('g1', 'Get fit')],
      projects: [project('p1', 'Fitness', { areaId: 'a1', goalId: 'g1' })],
      logEntries: [entry('2026-10-06', 20, { projectId: 'p1', habitId: 'h1' })],
    };
    const time = weekTime(rows, week, TODAY, null);
    expect(time.byProject[0]).toMatchObject({ title: 'Fitness', minutes: 20 });
    expect(time.byArea[0]).toMatchObject({ title: 'Sport', minutes: 20 });
    expect(time.byGoal[0]).toMatchObject({ title: 'Get fit', minutes: 20 });
  });

  it('counts the time of a deleted project as Other', () => {
    const rows = {
      ...empty(),
      projects: [project('p1', 'Old', { deletedAt: at('2026-10-01') })],
      logEntries: [entry('2026-10-06', 20, { projectId: 'p1' })],
    };
    expect(weekTime(rows, week, TODAY, null).byProject).toMatchObject([{ id: null, title: 'Other', minutes: 20 }]);
  });
});

describe('recent weeks', () => {
  const hours = (h: number) => h * 60;
  const rowsOf = (byWeek: Record<string, number>): Pick<WeekRows, 'logEntries'> => ({
    logEntries: Object.entries(byWeek).map(([date, h]) => entry(date, hours(h))),
  });

  it('shows the 8 weeks ending with the shown week', () => {
    const { weeks } = recentWeeks(empty(), '2026-11-02', '2026-11-09');
    expect(weeks.map((w) => w.weekStart)).toEqual([
      '2026-09-14',
      '2026-09-21',
      '2026-09-28',
      '2026-10-05',
      '2026-10-12',
      '2026-10-19',
      '2026-10-26',
      '2026-11-02',
    ]);
    expect(weeks.map((w) => w.shown)).toEqual([false, false, false, false, false, false, false, true]);
  });

  it('takes the headline of the current week from the 4 weeks before it and gives it no average point', () => {
    const rows = rowsOf({ '2026-10-13': 40, '2026-10-20': 32, '2026-10-27': 50, '2026-11-03': 30, '2026-11-10': 5 });
    const trend = recentWeeks(rows, '2026-11-09', '2026-11-09');
    expect(trend.headline).toBe(hours(38));
    const last = trend.weeks[7];
    expect(last).toMatchObject({ minutes: hours(5), average: null, current: true });
  });

  it('averages a past week with the 3 weeks before it', () => {
    const rows = rowsOf({ '2026-10-13': 40, '2026-10-20': 32, '2026-10-27': 50, '2026-11-03': 30 });
    const trend = recentWeeks(rows, '2026-11-02', '2026-11-16');
    expect(trend.weeks[7]?.average).toBe(hours(38));
    expect(trend.headline).toBe(hours(38));
  });

  it('counts weeks without work as 0', () => {
    const trend = recentWeeks(rowsOf({ '2026-11-03': 8 }), '2026-11-02', '2026-11-16');
    expect(trend.weeks[0]).toMatchObject({ minutes: 0, average: 0 });
    expect(trend.weeks[7]?.average).toBe(hours(2));
  });
});
