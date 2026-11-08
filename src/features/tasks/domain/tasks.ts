import { compareDeadlines, effectiveDeadline, urgency } from '../../projects/domain/projects.ts';

export const DEFAULT_IMPORTANCE = 3;

export interface ImportanceInput {
  importance: number | null;
  /** Importance of the task's project, when it has one. */
  projectImportance?: number | null;
}

/** The task's own importance, else its project's, else 3; `inherited` tells which. */
export function effectiveImportance(task: ImportanceInput): { value: number; inherited: boolean } {
  if (task.importance != null) return { value: task.importance, inherited: false };
  return { value: task.projectImportance ?? DEFAULT_IMPORTANCE, inherited: true };
}

export interface RankInput extends ImportanceInput {
  dueDate: string | null;
  createdAt: string;
  /** The project's own deadline and the end of the goal it serves (its effective deadline). */
  projectDeadline?: string | null;
  projectGoalEnd?: string | null;
  /** End date of the goal the task is assigned to directly. */
  goalEnd?: string | null;
}

/** The date that drives urgency: due date, else the project's effective deadline, else the task's goal end. */
export function rankDate(task: RankInput): string | null {
  return (
    task.dueDate ??
    effectiveDeadline({ deadline: task.projectDeadline ?? null, goalEnd: task.projectGoalEnd ?? null })?.date ??
    task.goalEnd ??
    null
  );
}

/** Importance × urgency. */
export function taskRank(task: RankInput, today: string): number {
  return effectiveImportance(task).value * urgency(rankDate(task), today);
}

/** Rank (highest first), nearest date (none last), then oldest first. */
export function compareByRank(today: string) {
  return (a: RankInput, b: RankInput): number =>
    taskRank(b, today) - taskRank(a, today) ||
    compareDeadlines(rankDate(a) ?? undefined, rankDate(b) ?? undefined) ||
    a.createdAt.localeCompare(b.createdAt);
}

export function sortByRank<T extends RankInput>(tasks: T[], today: string): T[] {
  return [...tasks].sort(compareByRank(today));
}

export interface OrderableTask {
  dueDate: string | null;
  createdAt: string;
  isNextStep?: boolean;
  /** The manual position in the project's list; null until the list is reordered. */
  sortOrder?: number | null;
}

/** Whether any of the tasks has a manual position, that is, the user has reordered the list. */
export function hasManualOrder(tasks: readonly { sortOrder?: number | null }[]): boolean {
  return tasks.some((t) => t.sortOrder != null);
}

/**
 * Open task order: with `nextStepsFirst`, next steps lead; then tasks with a manual position, by position;
 * then the rest by due date (none last) and oldest first.
 */
export function sortOpenTasks<T extends OrderableTask>(tasks: T[], options: { nextStepsFirst?: boolean } = {}): T[] {
  return [...tasks].sort((a, b) => {
    const steps = options.nextStepsFirst ? Number(!!b.isNextStep) - Number(!!a.isNextStep) : 0;
    if (steps) return steps;
    const pa = a.sortOrder ?? null;
    const pb = b.sortOrder ?? null;
    if (pa !== null && pb !== null && pa !== pb) return pa - pb;
    if ((pa === null) !== (pb === null)) return pa === null ? 1 : -1;
    return compareDeadlines(a.dueDate ?? undefined, b.dueDate ?? undefined) || a.createdAt.localeCompare(b.createdAt);
  });
}

/** The position for a task dropped between two neighbours (null at an end of the group). */
export function positionBetween(before: number | null, after: number | null): number {
  if (before === null && after === null) return 0;
  if (before === null) return (after as number) - 1;
  if (after === null) return before + 1;
  return (before + after) / 2;
}

/** The smallest gap between positions that is still safe to halve; below it the list is renumbered. */
export const MIN_POSITION_GAP = 1e-6;

/** Whether `position` is too close to a neighbour to stay distinct. */
export function positionTooClose(position: number, before: number | null, after: number | null): boolean {
  return (before !== null && position - before < MIN_POSITION_GAP) || (after !== null && after - position < MIN_POSITION_GAP);
}

export interface PositionInput {
  projectId?: string | null;
  sortOrder?: number | null;
}

/**
 * Home tie-break: among tasks of one project that tie on rank and date, the manual position decides their order.
 * The tasks take the places the project's positioned tasks already had, so tasks of other projects keep their places.
 */
export function applyProjectOrder<T>(sorted: T[], today: string, info: (item: T) => RankInput & PositionInput): T[] {
  const out = [...sorted];
  let start = 0;
  while (start < out.length) {
    const first = info(out[start] as T);
    const rank = taskRank(first, today);
    const date = rankDate(first);
    let end = start + 1;
    while (end < out.length) {
      const next = info(out[end] as T);
      if (taskRank(next, today) !== rank || rankDate(next) !== date) break;
      end += 1;
    }
    if (end - start > 1) {
      const slots = new Map<string, number[]>();
      for (let i = start; i < end; i += 1) {
        const task = info(out[i] as T);
        if (task.projectId && task.sortOrder != null) slots.set(task.projectId, [...(slots.get(task.projectId) ?? []), i]);
      }
      for (const places of slots.values()) {
        if (places.length < 2) continue;
        const items = places.map((i) => out[i] as T).sort((a, b) => (info(a).sortOrder as number) - (info(b).sortOrder as number));
        places.forEach((place, k) => { out[place] = items[k] as T; });
      }
    }
    start = end;
  }
  return out;
}

export type NextStepOutcome = 'direct' | 'ask';

/**
 * Whether completing `task` needs the "What's the next step?" prompt: it is
 * the last open next step of its project. `openNextSteps` are the project's
 * open next-step tasks (the task itself may be among them).
 */
export function nextStepOutcome(
  task: { id: string; projectId: string | null; isNextStep: boolean },
  openNextSteps: { id: string }[],
): NextStepOutcome {
  if (!task.projectId || !task.isNextStep) return 'direct';
  return openNextSteps.some((t) => t.id !== task.id) ? 'direct' : 'ask';
}
