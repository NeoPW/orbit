import { formatDate } from './format.ts';

/** Deadline lead time until the Settings feature stores the user's choice. */
export const DEFAULT_LEAD_DAYS = 7;

const DAY_MS = 24 * 60 * 60 * 1000;

function dayNumber(date: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(date);
  if (!match) throw new Error(`Not a calendar date: ${date}`);
  return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) / DAY_MS;
}

/** Whole calendar days from `today` to `date` (both `yyyy-mm-dd`); negative when `date` has passed. */
export function daysUntil(date: string, today: string): number {
  return dayNumber(date) - dayNumber(today);
}

/** Today's local calendar date as `yyyy-mm-dd`. */
export function localToday(now: Date = new Date()): string {
  const two = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${two(now.getMonth() + 1)}-${two(now.getDate())}`;
}

export type DeadlineTone = 'overdue' | 'soon' | 'none';

export interface DeadlineBadge {
  label: string;
  tone: DeadlineTone;
}

export function deadlineBadge(deadline: string, today: string, leadDays: number): DeadlineBadge {
  const days = daysUntil(deadline, today);
  if (days < 0) return { label: 'Overdue', tone: 'overdue' };
  if (days === 0) return { label: 'Today', tone: 'soon' };
  if (days === 1) return { label: 'Tomorrow', tone: 'soon' };
  if (days <= leadDays) return { label: `In ${days} days`, tone: 'soon' };
  return { label: formatDate(deadline), tone: 'none' };
}
