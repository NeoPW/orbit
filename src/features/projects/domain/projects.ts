import { daysUntil } from '../../../core/dates/deadline.ts';

export interface EffectiveDeadline {
  /** `yyyy-mm-dd`. */
  date: string;
  /** True when the date is the goal's end date, not the project's own deadline. */
  inherited: boolean;
}

/** The project's own deadline, else the end date of the goal it serves (marked inherited), else none. */
export function effectiveDeadline(project: { deadline: string | null; goalEnd: string | null }): EffectiveDeadline | null {
  if (project.deadline) return { date: project.deadline, inherited: false };
  if (project.goalEnd) return { date: project.goalEnd, inherited: true };
  return null;
}

/** Urgency 1 to 5 from a date: overdue 5, 0-3 days 4, 4-7 days 3, 8-30 days 2, later or none 1. */
export function urgency(date: string | null, today: string): number {
  if (!date) return 1;
  const days = daysUntil(date, today);
  if (days < 0) return 5;
  if (days <= 3) return 4;
  if (days <= 7) return 3;
  if (days <= 30) return 2;
  return 1;
}

export interface ProjectScoreInput {
  importance: number;
  deadline: string | null;
  goalEnd: string | null;
}

/** Importance × urgency of the effective deadline. */
export function projectScore(project: ProjectScoreInput, today: string): number {
  return project.importance * urgency(effectiveDeadline(project)?.date ?? null, today);
}

export interface OrderableProject extends ProjectScoreInput {
  title: string;
}

/** Earliest first, none last. */
export function compareDeadlines(a: string | undefined, b: string | undefined): number {
  if (a === b) return 0;
  if (a === undefined) return 1;
  if (b === undefined) return -1;
  return a < b ? -1 : 1;
}

/** Home order: score (highest first), effective deadline (earliest first, none last), title. */
export function compareByScore(today: string) {
  return (a: OrderableProject, b: OrderableProject): number =>
    projectScore(b, today) - projectScore(a, today) ||
    compareDeadlines(effectiveDeadline(a)?.date, effectiveDeadline(b)?.date) ||
    a.title.localeCompare(b.title);
}

/** Plan order: importance (highest first), effective deadline (earliest first, none last), title. */
export function compareForPlan(a: OrderableProject, b: OrderableProject): number {
  return (
    b.importance - a.importance ||
    compareDeadlines(effectiveDeadline(a)?.date, effectiveDeadline(b)?.date) ||
    a.title.localeCompare(b.title)
  );
}

export function sortByScore<T extends OrderableProject>(projects: T[], today: string): T[] {
  return [...projects].sort(compareByScore(today));
}

/** Anything with a project and the end of its goal, such as `ProjectView`. */
export interface ProjectLike {
  project: { title: string; importance: number; deadline: string | null };
  goalEnd: string | null;
}

function orderable(view: ProjectLike): OrderableProject {
  return { title: view.project.title, importance: view.project.importance, deadline: view.project.deadline, goalEnd: view.goalEnd };
}

/** Plan order for project views. */
export function sortViewsForPlan<T extends ProjectLike>(views: T[]): T[] {
  return [...views].sort((a, b) => compareForPlan(orderable(a), orderable(b)));
}
