/** Milliseconds from `startedAt` (ISO) to `now`, never negative. */
export function elapsedMs(startedAt: string, now: Date): number {
  return Math.max(0, now.getTime() - new Date(startedAt).getTime());
}

/** What the worked time of a session depends on: the current stretch and the minutes logged by earlier ones. */
export interface SessionClock {
  /** Start of the current stretch (ISO). */
  startedAt: string;
  /** Set while paused. */
  pausedAt: string | null;
  /** Exact seconds of the earlier stretches (not their rounded entries). */
  workedSeconds: number;
}

/** Milliseconds worked in the session: the earlier stretches plus the running one; it stands still while paused. */
export function workedMs(session: SessionClock, now: Date): number {
  const logged = session.workedSeconds * 1000;
  return session.pausedAt === null ? logged + elapsedMs(session.startedAt, now) : logged;
}

/**
 * The time limit after `+` (`step` 5) or `−` (`step` -5) in focus mode. `−` removes a limit of 5 minutes or less;
 * `+` without a limit sets 5 minutes above the worked time, rounded up to whole 5 minutes.
 */
export function stepLimit(limit: number | null, worked: number, step: 5 | -5): number | null {
  if (step < 0) return limit === null || limit <= 5 ? null : limit - 5;
  if (limit !== null) return limit + 5;
  return Math.ceil((worked / 60_000 + 5) / 5) * 5;
}

/** `m:ss`, and `h:mm:ss` from one hour on. */
export function formatElapsed(ms: number): string {
  const total = Math.floor(Math.max(0, ms) / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = String(total % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
}

/** Milliseconds past the time limit (`plannedMinutes`) of the worked time, or null while within it or without a plan. */
export function overtimeMs(elapsed: number, plannedMinutes: number | null): number | null {
  if (plannedMinutes === null) return null;
  const over = elapsed - plannedMinutes * 60_000;
  return over > 0 ? over : null;
}

/** "+2:10" for the overtime, or null. */
export function formatOvertime(elapsed: number, plannedMinutes: number | null): string | null {
  const over = overtimeMs(elapsed, plannedMinutes);
  return over === null ? null : `+${formatElapsed(over)}`;
}

/** Elapsed whole minutes for the log entry, at least 1. */
export function loggedMinutes(elapsed: number): number {
  return Math.max(1, Math.floor(elapsed / 60_000));
}

export interface StopContext {
  /** The task the timer ran for (null for a project timer). */
  task: { status: 'open' | 'done'; completedAt: string | null; projectId: string | null } | null;
  /** Whether that task's project is active, and how many open next steps it has now. */
  projectActive: boolean;
  openNextSteps: number;
  /** The timer's start time (ISO). */
  startedAt: string;
}

/**
 * Whether stopping the timer is followed by "What's the next step?": the task
 * was completed since the timer started and its project is left without next step.
 */
export function promptAfterStop(context: StopContext): boolean {
  const { task } = context;
  if (!task || task.status !== 'done' || !task.projectId || !task.completedAt) return false;
  return task.completedAt >= context.startedAt && context.projectActive && context.openNextSteps === 0;
}
