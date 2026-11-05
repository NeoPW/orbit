import type { PlannedReminder } from './plan-reminders.ts';

/** How far back a missed reminder (for example during sleep) is still shown. */
export const MAX_LOOKBACK_MS = 15 * 60_000;
/** Longest delay `setTimeout` accepts. */
const MAX_DELAY_MS = 2 ** 31 - 1;

/** Start of the planning window: the previous run, but never further back than the lookback. */
export function planFrom(lastRun: Date, now: Date): Date {
  return new Date(Math.max(lastRun.getTime(), now.getTime() - MAX_LOOKBACK_MS));
}

/**
 * Splits planned reminders (earliest first) into those due at `now` that were not shown yet, and the next
 * one still to come.
 */
export function splitDue(planned: PlannedReminder[], now: Date, shown: ReadonlySet<string>): { due: PlannedReminder[]; next: PlannedReminder | null } {
  const due: PlannedReminder[] = [];
  let next: PlannedReminder | null = null;
  for (const reminder of planned) {
    if (shown.has(reminder.key)) continue;
    if (reminder.at <= now) due.push(reminder);
    else if (!next || reminder.at < next.at) next = reminder;
  }
  return { due, next };
}

/** Milliseconds to wait for `reminder`, at least 0 and within what `setTimeout` accepts. */
export function delayUntil(reminder: PlannedReminder, now: Date): number {
  return Math.min(MAX_DELAY_MS, Math.max(0, reminder.at.getTime() - now.getTime()));
}

/** True when the clock jumped past `thresholdMs` between two checks, for example after sleep. */
export function clockJumped(lastCheck: number, now: number, intervalMs: number): boolean {
  return now - lastCheck > intervalMs * 3;
}
