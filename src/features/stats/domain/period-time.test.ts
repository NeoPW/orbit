import { describe, expect, it } from 'vitest';
import { parsePeriod } from './period.ts';
import { periodTime, projectRows, type TimeLinks } from './period-time.ts';

const today = '2026-11-08';
const at = (date: string, minutes: number, projectId: string | null = null) => ({
  projectId,
  goalId: null,
  taskId: null,
  occurredAt: new Date(`${date}T10:00:00`).toISOString(),
  durationMinutes: minutes,
});
const project = (id: string, title: string, over: object = {}) => ({
  id,
  title,
  goalId: null,
  areaId: null,
  color: null,
  status: 'active',
  completedAt: null,
  deletedAt: null,
  createdAt: '2026-01-01T10:00:00',
  ...over,
});
const links = (over: Partial<TimeLinks> = {}): TimeLinks => ({
  areas: [],
  goals: [{ id: 'g', title: 'Goal', status: 'active', color: null }],
  projects: [project('thesis', 'Thesis'), project('site', 'Website')],
  tasks: [],
  ...over,
});
const period = (key: string) => parsePeriod(key, today);
const minutesOf = (items: { id: string | null; minutes: number }[], id: string) => items.find((i) => i.id === id)?.minutes;

describe('period time', () => {
  it('sums a project over a quarter', () => {
    const entries = [at('2026-07-10', 180, 'thesis'), at('2026-08-10', 120, 'thesis'), at('2026-09-10', 240, 'thesis')];
    expect(minutesOf(periodTime(entries, links(), period('2026-Q3'), today).byProject, 'thesis')).toBe(540);
  });

  it('splits at a month boundary', () => {
    const entries = [at('2026-09-30', 120, 'thesis'), at('2026-10-01', 180, 'thesis')];
    expect(minutesOf(periodTime(entries, links(), period('2026-09'), today).byProject, 'thesis')).toBe(120);
    expect(minutesOf(periodTime(entries, links(), period('2026-10'), today).byProject, 'thesis')).toBe(180);
  });

  it('shows time without a goal as Other', () => {
    const entries = [at('2026-10-05', 60, 'thesis')];
    const goals = periodTime(entries, links(), period('2026-10'), today).byGoal;
    expect(goals.find((i) => i.id === null)).toMatchObject({ title: 'Other', minutes: 60 });
  });
});

describe('project rows', () => {
  it('shows the total whatever the period', () => {
    const entries = [at('2026-10-05', 120, 'thesis')];
    const time = periodTime(entries, links(), period('2026-10'), today);
    const [row] = projectRows(time, [{ projectId: 'thesis', taskId: null, minutes: 2400 }], links());
    expect(row).toMatchObject({ periodMinutes: 120, totalMinutes: 2400 });
  });

  it('counts the days a finished project took', () => {
    const l = links({ projects: [project('site', 'Website', { createdAt: '2026-06-01T10:00:00', completedAt: '2026-07-16T10:00:00', status: 'completed' })] });
    const time = periodTime([at('2026-07-10', 60, 'site')], l, period('2026-07'), today);
    expect(projectRows(time, [], l)[0]?.finishedAfterDays).toBe(45);
  });

  it('attributes lifetime minutes of a task to its project', () => {
    const l = links({ tasks: [{ id: 't', title: 'T', projectId: 'thesis', goalId: null, status: 'open', completedAt: null, deletedAt: null, createdAt: '2026-01-01T10:00:00' }] });
    const time = periodTime([at('2026-10-05', 30, 'thesis')], l, period('2026-10'), today);
    expect(projectRows(time, [{ projectId: null, taskId: 't', minutes: 90 }], l)[0]?.totalMinutes).toBe(90);
  });

  it('lists the project with most period time first', () => {
    const entries = [at('2026-10-05', 120, 'thesis'), at('2026-10-06', 300, 'site')];
    const time = periodTime(entries, links(), period('2026-10'), today);
    expect(projectRows(time, [], links()).map((r) => r.title)).toEqual(['Website', 'Thesis']);
  });
});
