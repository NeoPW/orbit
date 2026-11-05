import type { GoalStatus } from '../../../core/db/schema.ts';

/** Active projects that Plan lists outside the goals: without a goal, or serving a goal that is not active. */
export function withoutActiveGoal<T extends { goalStatus: GoalStatus | null }>(activeProjects: T[]): T[] {
  return activeProjects.filter((view) => view.goalStatus !== 'active');
}

/** The Backlog's area filter: `undefined` shows all areas, `null` only projects without an area. */
export type AreaFilter = string | null | undefined;

export function filterByArea<T extends { project: { areaId: string | null } }>(views: T[], filter: AreaFilter): T[] {
  if (filter === undefined) return views;
  return views.filter((view) => view.project.areaId === filter);
}

export type ArchiveItem<G, P> =
  | { kind: 'goal'; item: G; updatedAt: string }
  | { kind: 'project'; item: P; updatedAt: string };

/** Completed and archived goals together with completed projects, most recently updated first. */
export function archiveItems<G extends { updatedAt: string }, P extends { project: { updatedAt: string } }>(
  goals: G[],
  projects: P[],
): ArchiveItem<G, P>[] {
  const items: ArchiveItem<G, P>[] = [
    ...goals.map((item) => ({ kind: 'goal' as const, item, updatedAt: item.updatedAt })),
    ...projects.map((item) => ({ kind: 'project' as const, item, updatedAt: item.project.updatedAt })),
  ];
  return items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
