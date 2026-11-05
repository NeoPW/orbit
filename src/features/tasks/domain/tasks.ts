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
}

/** Open task order: due date (none last), then oldest first; with `nextStepsFirst`, next steps lead. */
export function sortOpenTasks<T extends OrderableTask>(tasks: T[], options: { nextStepsFirst?: boolean } = {}): T[] {
  return [...tasks].sort(
    (a, b) =>
      (options.nextStepsFirst ? Number(!!b.isNextStep) - Number(!!a.isNextStep) : 0) ||
      compareDeadlines(a.dueDate ?? undefined, b.dueDate ?? undefined) ||
      a.createdAt.localeCompare(b.createdAt),
  );
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
