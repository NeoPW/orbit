import { formatDateRange } from '../../../core/dates/format.ts';
import { addDays } from '../../../core/dates/today.ts';
import { isoWeekday, weekStartOf } from '../../habits/domain/habits.ts';

/** The Monday of the week a review on `today` is about: the week ending today on a Sunday, else the week before. */
export function reviewWeekStart(today: string): string {
  const monday = weekStartOf(today);
  return isoWeekday(today) === 7 ? monday : addDays(monday, -7);
}

/** Monday of the current week. */
export function currentWeekStart(today: string): string {
  return weekStartOf(today);
}

/** Monday of the week before the current one. */
export function lastWeekStart(today: string): string {
  return addDays(weekStartOf(today), -7);
}

/** The Sunday of the week starting on `weekStart`. */
export function weekEnd(weekStart: string): string {
  return addDays(weekStart, 6);
}

/** The ISO calendar week number of the week starting on `weekStart` (a Monday): the week holding the year's first Thursday is week 1. */
export function calendarWeek(weekStart: string): number {
  const [y, m, d] = weekStart.split('-').map(Number);
  const thursday = new Date(Date.UTC(y ?? 0, (m ?? 1) - 1, (d ?? 1) + 3));
  const yearStart = Date.UTC(thursday.getUTCFullYear(), 0, 1);
  return Math.ceil(((thursday.getTime() - yearStart) / 86_400_000 + 1) / 7);
}

/** "CW 45". */
export function formatWeek(weekStart: string): string {
  return `CW ${calendarWeek(weekStart)}`;
}

/** "CW 45 · 02-11-2026 – 08-11-2026". */
export function formatWeekFull(weekStart: string): string {
  return `${formatWeek(weekStart)} · ${formatWeekRange(weekStart)}`;
}

/** "05-10-2026 – 11-10-2026". */
export function formatWeekRange(weekStart: string): string {
  return formatDateRange(weekStart, weekEnd(weekStart));
}

/** Local midnight of `date` as an ISO instant. */
function localMidnight(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y ?? 0, (m ?? 1) - 1, d ?? 1).toISOString();
}

export interface WeekRange {
  /** Monday, `yyyy-mm-dd`. */
  start: string;
  /** Sunday, `yyyy-mm-dd`. */
  end: string;
  /** UTC instants of the local week: `from` inclusive, `to` exclusive (Monday 00:00 of the next week). */
  from: string;
  to: string;
}

export function weekRange(weekStart: string): WeekRange {
  return { start: weekStart, end: weekEnd(weekStart), from: localMidnight(weekStart), to: localMidnight(addDays(weekStart, 7)) };
}

/** The week the Review tab shows: the Monday of `week`, or the current week when it is missing, invalid or in the future. */
export function resolveWeek(week: string | undefined, today: string): string {
  const current = currentWeekStart(today);
  if (!week || !/^\d{4}-\d{2}-\d{2}$/.test(week) || Number.isNaN(Date.parse(week))) return current;
  const monday = weekStartOf(week);
  return monday > current ? current : monday;
}
