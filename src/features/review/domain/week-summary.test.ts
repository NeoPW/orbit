import { describe, expect, it } from 'vitest';
import { weekRange } from './review-week.ts';
import { summarizeWeek, type WeekRows } from './week-summary.ts';

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
const project = (id: string, title: string, goalId: string | null = null, extra: Partial<WeekRows['projects'][number]> = {}) => ({
  id,
  title,
  goalId,
  areaId: null,
  color: null,
  status: 'active',
  completedAt: null,
  deletedAt: null,
  ...extra,
});
const goal = (id: string, title: string) => ({ id, title, status: 'active' as const, color: null });
const entry = (projectId: string | null, date: string, durationMinutes: number | null) => ({
  projectId,
  goalId: null,
  taskId: null,
  habitId: null,
  occurredAt: at(date),
  durationMinutes,
});
const habit = (extra: Partial<WeekRows['habits'][number]>): WeekRows['habits'][number] => ({
  id: 'h1',
  title: 'Run',
  projectId: null,
  goalId: null,
  active: true,
  scheduleType: 'daily',
  weekdays: null,
  timesPerWeek: null,
  createdAt: at('2026-09-01'),
  ...extra,
});
const numeric = (id: string, goalId: string, current: number) => ({
  id,
  goalId,
  title: id,
  measureType: 'numeric' as const,
  startValue: 0,
  targetValue: 100,
  currentValue: current,
  habitId: null,
  unit: null,
  checkIns: 0,
  checkDates: [] as string[],
  changes: [] as { at: string; from: number | null }[],
});

describe('habit adherence', () => {
  it('weekdays habit: 2 of 3', () => {
    const rows = {
      ...empty(),
      habits: [habit({ scheduleType: 'weekdays', weekdays: [1, 3, 5] })],
      habitChecks: [
        { habitId: 'h1', date: '2026-10-05' },
        { habitId: 'h1', date: '2026-10-09' },
      ],
    };
    expect(summarizeWeek(rows, week, '2026-10-12').habits[0]).toMatchObject({ done: 2, expected: 3 });
  });

  it('daily habit created on Thursday: 4 of 4', () => {
    const rows = {
      ...empty(),
      habits: [habit({ createdAt: at('2026-10-08') })],
      habitChecks: ['2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11'].map((date) => ({ habitId: 'h1', date })),
    };
    expect(summarizeWeek(rows, week, '2026-10-12').habits[0]).toMatchObject({ done: 4, expected: 4 });
  });

  it('times per week: 4 of 3', () => {
    const rows = {
      ...empty(),
      habits: [habit({ scheduleType: 'times_per_week', timesPerWeek: 3 })],
      habitChecks: ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08'].map((date) => ({ habitId: 'h1', date })),
    };
    expect(summarizeWeek(rows, week, '2026-10-12').habits[0]).toMatchObject({ done: 4, expected: 3 });
  });

  it('expects only days up to today in the current week and skips inactive habits', () => {
    const rows = { ...empty(), habits: [habit({}), habit({ id: 'h2', active: false })] };
    const { habits } = summarizeWeek(rows, week, '2026-10-07');
    expect(habits).toHaveLength(1);
    expect(habits[0]?.expected).toBe(3);
  });
});

describe('completed tasks and finished projects', () => {
  it('lists a task completed in the week with its project, most recent first', () => {
    const task = { projectId: null, goalId: null, status: 'done', deletedAt: null };
    const rows = {
      ...empty(),
      projects: [project('p1', 'Wedding')],
      tasks: [
        { ...task, id: 't1', title: 'Book venue', projectId: 'p1', completedAt: at('2026-10-06') },
        { ...task, id: 't2', title: 'Tax', completedAt: at('2026-10-08') },
        { ...task, id: 't3', title: 'Old', completedAt: at('2026-10-04') },
      ],
    };
    const { completedTasks } = summarizeWeek(rows, week, TODAY);
    expect(completedTasks.map((t) => t.title)).toEqual(['Tax', 'Book venue']);
    expect(completedTasks[1]?.assignedTo).toEqual({ kind: 'project', id: 'p1', title: 'Wedding' });
  });

  it('lists a project finished in the week, not a reopened one', () => {
    const rows = {
      ...empty(),
      projects: [
        project('p1', 'Garden', null, { status: 'completed', completedAt: at('2026-10-06') }),
        project('p2', 'Shed', null, { status: 'active', completedAt: null }),
      ],
    };
    expect(summarizeWeek(rows, week, TODAY).finishedProjects.map((p) => p.title)).toEqual(['Garden']);
  });
});

describe('goals in the summary', () => {
  const base = (): WeekRows => ({
    ...empty(),
    goals: [goal('g1', 'Get fit')],
    measures: [numeric('m1', 'g1', 55)],
    reviews: [{ id: 'r0', weekStart: '2026-09-28', completedAt: at('2026-10-04') }],
    snapshots: [{ weeklyReviewId: 'r0', measureId: 'm1', progress: 0.4 }],
  });

  const raised = (): WeekRows => ({ ...base(), measures: [{ ...numeric('m1', 'g1', 55), changes: [{ at: at('2026-10-15'), from: 40 }] }] });

  it('shows the value at the start and end of the week and the change of the goal', () => {
    const [g] = summarizeWeek(raised(), weekRange('2026-10-12'), TODAY).goals;
    expect(g).toMatchObject({ progress: 0.55, change: 15 });
    expect(g?.gain).toBeCloseTo(0.15);
    expect(g?.measures[0]).toMatchObject({ value: 55, from: 40, target: 100 });
    expect(g?.measures[0]?.gain).toBeCloseTo(0.15);
  });

  it('shows only the value of a measure that did not change in the week', () => {
    const [g] = summarizeWeek(base(), weekRange('2026-10-12'), TODAY).goals;
    expect(g?.change).toBeNull();
    expect(g?.measures[0]).toMatchObject({ value: 55, from: null, gain: 0 });
  });

  it('counts a change in the week it was made', () => {
    const [g] = summarizeWeek(raised(), weekRange('2026-10-19'), '2026-10-25').goals;
    expect(g?.measures[0]).toMatchObject({ value: 55, from: null });
  });

  it('shows a yes/no measure switched to achieved', () => {
    const done = {
      ...numeric('m1', 'g1', 1),
      measureType: 'boolean' as const,
      startValue: null,
      targetValue: null,
      changes: [{ at: at('2026-10-14'), from: 0 }],
    };
    const [g] = summarizeWeek({ ...base(), measures: [done] }, weekRange('2026-10-12'), TODAY).goals;
    expect(g?.measures[0]).toMatchObject({ measureType: 'boolean', value: 1, from: 0 });
    expect(g?.change).toBe(100);
  });

  it('shows the check-ins of a habit measure before and after the week', () => {
    const dates = [...Array.from({ length: 12 }, (_, i) => `2026-09-${i + 10}`), '2026-10-12', '2026-10-13', '2026-10-14'];
    const habitMeasure = {
      ...numeric('m1', 'g1', 0),
      measureType: 'habit' as const,
      habitId: 'h1',
      targetValue: 30,
      checkDates: dates,
      checkIns: 15,
    };
    const [g] = summarizeWeek({ ...base(), measures: [habitMeasure] }, weekRange('2026-10-12'), TODAY).goals;
    expect(g?.measures[0]).toMatchObject({ value: 15, from: 12, target: 30 });
  });

  it('shows the work on the goal in the week', () => {
    const rows = {
      ...base(),
      projects: [project('p1', 'Run club', 'g1')],
      logEntries: [
        entry('p1', '2026-10-13', 60),
        entry('p1', '2026-10-14', 30),
        entry('p1', '2026-10-14', 30),
        entry('p1', '2026-10-06', 99),
      ],
    };
    expect(summarizeWeek(rows, weekRange('2026-10-12'), TODAY).goals[0]?.work).toEqual({ count: 3, minutes: 120 });
  });

  it('uses the snapshots of a reviewed week', () => {
    const rows = base();
    rows.reviews = [{ id: 'r1', weekStart: '2026-10-05', completedAt: at('2026-10-11') }, ...rows.reviews];
    rows.measures = [numeric('m1', 'g1', 70)];
    rows.snapshots = [...rows.snapshots, { weeklyReviewId: 'r1', measureId: 'm1', progress: 0.4 }];
    rows.goals = [{ ...goal('g1', 'Get fit'), status: 'completed' as never }];
    const [g] = summarizeWeek(rows, week, TODAY).goals;
    expect(g?.progress).toBe(0.4);
  });

  it('shows the active goals with current progress in an unreviewed week', () => {
    const rows = base();
    rows.goals = [goal('g1', 'Get fit'), { ...goal('g2', 'Done goal'), status: 'completed' as never }];
    expect(summarizeWeek(rows, weekRange('2026-10-12'), TODAY).goals.map((g) => g.title)).toEqual(['Get fit']);
  });
});
