export interface OrderableTask {
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
 * then the rest by time added (oldest first).
 */
export function sortOpenTasks<T extends OrderableTask>(tasks: T[], options: { nextStepsFirst?: boolean } = {}): T[] {
  return [...tasks].sort((a, b) => {
    const steps = options.nextStepsFirst ? Number(!!b.isNextStep) - Number(!!a.isNextStep) : 0;
    if (steps) return steps;
    const pa = a.sortOrder ?? null;
    const pb = b.sortOrder ?? null;
    if (pa !== null && pb !== null && pa !== pb) return pa - pb;
    if ((pa === null) !== (pb === null)) return pa === null ? 1 : -1;
    return a.createdAt.localeCompare(b.createdAt);
  });
}

export interface HomeOrderable {
  createdAt: string;
  /** The manual position in Home's To do list; null until To do is reordered. */
  homePosition?: number | null;
}

/** Whether any of the tasks has a Home position, that is, the user has reordered To do. */
export function hasHomeOrder(tasks: readonly { homePosition?: number | null }[]): boolean {
  return tasks.some((t) => t.homePosition != null);
}

/** To do order: tasks with a Home position first, by position; then the rest by time added (oldest first). */
export function sortTodo<T extends HomeOrderable>(tasks: T[]): T[] {
  return [...tasks].sort((a, b) => {
    const pa = a.homePosition ?? null;
    const pb = b.homePosition ?? null;
    if (pa !== null && pb !== null && pa !== pb) return pa - pb;
    if ((pa === null) !== (pb === null)) return pa === null ? 1 : -1;
    return a.createdAt.localeCompare(b.createdAt);
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
