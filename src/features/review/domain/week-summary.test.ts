import { describe, expect, it } from 'vitest';
import { weekRange } from './review-week.ts';
import { summarizeWeek, type WeekRows } from './week-summary.ts';

/** A local date and time as an ISO instant, whatever the time zone of the test run. */
const at = (date: string, time = '12:00') => new Date(`${date}T${time}:00`).toISOString();
const week = weekRange('2026-10-05');
const TODAY = '2026-10-14';

const empty = (): WeekRows => ({
  goals: [],
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
  status: 'active',
  completedAt: null,
  deletedAt: null,
  ...extra,
});
const goal = (id: string, title: string) => ({ id, title, status: 'active' as const, color: null });
const entry = (projectId: string | null, date: string, durationMinutes: number | null) => ({ projectId, goalId: null, taskId: null, occurredAt: at(date), durationMinutes });
const habit = (extra: Partial<WeekRows['habits'][number]>): WeekRows['habits'][number] => ({
  id: 'h1',
  title: 'Run',
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
  checkIns: 0,
});

describe('work per project', () => {
  it('counts entries and minutes, entries without duration add no time', () => {
    const rows = { ...empty(), projects: [project('p1', 'Thesis')], logEntries: [entry('p1', '2026-10-06', 30), entry('p1', '2026-10-07', 45), entry('p1', '2026-10-08', null)] };
    const [group] = summarizeWeek(rows, week, TODAY).work;
    expect(group?.projects[0]).toMatchObject({ title: 'Thesis', count: 3, minutes: 75 });
  });

  it('leaves out entries outside the week', () => {
    const rows = { ...empty(), projects: [project('p1', 'Thesis')], logEntries: [entry('p1', '2026-10-04', 30), entry('p1', '2026-10-12', 30)] };
    expect(summarizeWeek(rows, week, TODAY).work).toEqual([]);
  });

  it('groups under the goal, then projects without a goal, and "No project" last', () => {
    const rows = {
      ...empty(),
      goals: [goal('g1', 'Graduate')],
      projects: [project('p1', 'Thesis', 'g1'), project('p2', 'Garden')],
      logEntries: [entry('p1', '2026-10-06', 30), entry('p2', '2026-10-06', 60), entry(null, '2026-10-06', 90)],
    };
    const { work } = summarizeWeek(rows, week, TODAY);
    expect(work.map((g) => g.goalTitle)).toEqual(['Graduate', null]);
    expect(work[1]?.projects.map((p) => p.title)).toEqual(['Garden', 'No project']);
  });

  it('orders projects of a group by minutes, then entries', () => {
    const rows = {
      ...empty(),
      projects: [project('a', 'A'), project('b', 'B'), project('c', 'C')],
      logEntries: [entry('a', '2026-10-06', 10), entry('b', '2026-10-06', 30), entry('c', '2026-10-06', 10), entry('c', '2026-10-07', null)],
    };
    expect(summarizeWeek(rows, week, TODAY).work[0]?.projects.map((p) => p.title)).toEqual(['B', 'C', 'A']);
  });
});

describe('habit adherence', () => {
  it('weekdays habit: 2 of 3', () => {
    const rows = {
      ...empty(),
      habits: [habit({ scheduleType: 'weekdays', weekdays: [1, 3, 5] })],
      habitChecks: [{ habitId: 'h1', date: '2026-10-05' }, { habitId: 'h1', date: '2026-10-09' }],
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
      projects: [project('p1', 'Garden', null, { status: 'completed', completedAt: at('2026-10-06') }), project('p2', 'Shed', null, { status: 'active', completedAt: null })],
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

  it('shows the change since the previous review', () => {
    const [g] = summarizeWeek(base(), weekRange('2026-10-12'), TODAY).goals;
    expect(g).toMatchObject({ progress: 0.55, change: 15 });
    expect(g?.measures[0]).toMatchObject({ progress: 0.55, change: 15 });
  });

  it('shows no change without an earlier review', () => {
    const [g] = summarizeWeek({ ...base(), reviews: [], snapshots: [] }, weekRange('2026-10-12'), TODAY).goals;
    expect(g?.progress).toBe(0.55);
    expect(g?.change).toBeNull();
  });

  it('ignores drafts as the earlier review', () => {
    const rows = base();
    rows.reviews = [{ id: 'r0', weekStart: '2026-09-28', completedAt: null }];
    expect(summarizeWeek(rows, weekRange('2026-10-12'), TODAY).goals[0]?.change).toBeNull();
  });

  it('shows the work on the goal in the week', () => {
    const rows = { ...base(), projects: [project('p1', 'Run club', 'g1')], logEntries: [entry('p1', '2026-10-13', 60), entry('p1', '2026-10-14', 30), entry('p1', '2026-10-14', 30), entry('p1', '2026-10-06', 99)] };
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
