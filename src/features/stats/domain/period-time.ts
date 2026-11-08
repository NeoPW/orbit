import { localToday } from '../../../core/dates/deadline.ts';
import { groupTime, type TimeGroups } from '../../review/domain/week-time.ts';
import type { WeekRows } from '../../review/domain/week-summary.ts';
import { periodRange, type Period } from './period.ts';

/** The rows that attribute log entries to areas, goals and projects, with the creation dates the project and task figures need. */
export interface TimeLinks {
  areas: WeekRows['areas'];
  goals: WeekRows['goals'];
  projects: (WeekRows['projects'][number] & { createdAt: string })[];
  tasks: (WeekRows['tasks'][number] & { createdAt: string })[];
}

export interface TimeEntry {
  projectId: string | null;
  goalId: string | null;
  taskId: string | null;
  occurredAt: string;
  durationMinutes: number | null;
}

/** Minutes logged over all time for one project or task (the grouped lifetime sums). */
export interface LifetimeMinutes {
  projectId: string | null;
  taskId: string | null;
  minutes: number;
}

export interface ProjectRow {
  id: string;
  title: string;
  color: string | null;
  periodMinutes: number;
  totalMinutes: number;
  /** Days from creation to completion of a completed project. */
  finishedAfterDays: number | null;
}

/** The period's time grouped by area, goal and project; entries count by their local date. */
export function periodTime(entries: readonly TimeEntry[], links: TimeLinks, period: Period, today: string, firstUse: string | null = null): TimeGroups {
  const { start, end } = periodRange(period, today, firstUse);
  const inPeriod = entries.filter((e) => {
    const date = localToday(new Date(e.occurredAt));
    return date >= start && date <= end;
  });
  return groupTime(inPeriod, links);
}

const days = (from: string, to: string) => Math.round((Date.parse(localToday(new Date(to))) - Date.parse(localToday(new Date(from)))) / 86_400_000);

/** The projects with time in the period, most time first, with their time in total and, when completed, the days it took. */
export function projectRows(time: TimeGroups, lifetime: readonly LifetimeMinutes[], links: TimeLinks): ProjectRow[] {
  const taskProject = new Map(links.tasks.map((t) => [t.id, t.projectId]));
  const totals = new Map<string, number>();
  for (const row of lifetime) {
    const projectId = row.projectId ?? (row.taskId ? taskProject.get(row.taskId) : null) ?? null;
    if (projectId) totals.set(projectId, (totals.get(projectId) ?? 0) + row.minutes);
  }
  return time.byProject.flatMap((item): ProjectRow[] => {
    const project = item.id === null ? undefined : links.projects.find((p) => p.id === item.id);
    if (!project) return [];
    return [
      {
        id: project.id,
        title: project.title,
        color: item.color,
        periodMinutes: item.minutes,
        totalMinutes: totals.get(project.id) ?? 0,
        finishedAfterDays: project.completedAt ? Math.max(0, days(project.createdAt, project.completedAt)) : null,
      },
    ];
  });
}
