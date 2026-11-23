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

export interface OrderableProject {
  deadline: string | null;
  goalEnd: string | null;
  createdAt: string;
}

/** Earliest first, none last. */
export function compareDeadlines(a: string | undefined, b: string | undefined): number {
  if (a === b) return 0;
  if (a === undefined) return 1;
  if (b === undefined) return -1;
  return a < b ? -1 : 1;
}

/** Project order (Home and Plan): effective deadline (earliest first, none last), then time added (oldest first). */
export function compareProjects(a: OrderableProject, b: OrderableProject): number {
  return compareDeadlines(effectiveDeadline(a)?.date, effectiveDeadline(b)?.date) || a.createdAt.localeCompare(b.createdAt);
}

export function sortProjects<T extends OrderableProject>(projects: T[]): T[] {
  return [...projects].sort(compareProjects);
}

/** Anything with a project and the end of its goal, such as `ProjectView`. */
export interface ProjectLike {
  project: { deadline: string | null; createdAt: string };
  goalEnd: string | null;
}

function orderable(view: ProjectLike): OrderableProject {
  return { deadline: view.project.deadline, goalEnd: view.goalEnd, createdAt: view.project.createdAt };
}

/** Plan order for project views. */
export function sortViewsForPlan<T extends ProjectLike>(views: T[]): T[] {
  return [...views].sort((a, b) => compareProjects(orderable(a), orderable(b)));
}
