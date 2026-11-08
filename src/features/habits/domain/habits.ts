import { localToday } from '../../../core/dates/deadline.ts';
import { addDays } from '../../../core/dates/today.ts';
import type { ScheduleType } from '../../../core/db/schema.ts';

export interface HabitSchedule {
  active: boolean;
  scheduleType: ScheduleType;
  /** ISO weekday numbers, 1 = Monday ... 7 = Sunday. */
  weekdays: number[] | null;
  timesPerWeek: number | null;
}

export const WEEKDAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

/** ISO weekday of a `yyyy-mm-dd` date: 1 = Monday ... 7 = Sunday. */
export function isoWeekday(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  const day = new Date(Date.UTC(y ?? 0, (m ?? 1) - 1, d ?? 1)).getUTCDay();
  return day === 0 ? 7 : day;
}

/** The Monday of the week containing `date`. */
export function weekStartOf(date: string): string {
  return addDays(date, 1 - isoWeekday(date));
}

/**
 * Whether the habit is due on `date`. `checkDates` are the dates the habit was checked
 * (any range; only the week of `date` counts for `times_per_week`).
 */
export function isDue(habit: HabitSchedule, date: string, checkDates: readonly string[]): boolean {
  if (!habit.active) return false;
  if (habit.scheduleType === 'daily') return true;
  if (habit.scheduleType === 'weekdays') return (habit.weekdays ?? []).includes(isoWeekday(date));
  const start = weekStartOf(date);
  const end = addDays(start, 6);
  const done = new Set(checkDates.filter((d) => d >= start && d <= end)).size;
  return done < (habit.timesPerWeek ?? 0);
}

/** Check-ins done and expected of one habit in the Monday–Sunday week `week`; days after `today` and before the habit was created are not expected. */
export function weekAdherence(
  habit: Pick<HabitSchedule, 'scheduleType' | 'weekdays' | 'timesPerWeek'> & { createdAt: string },
  checkDates: readonly string[],
  week: { start: string; end: string },
  today: string,
): { done: number; expected: number } {
  const done = new Set(checkDates.filter((d) => d >= week.start && d <= week.end)).size;
  if (habit.scheduleType === 'times_per_week') return { done, expected: habit.timesPerWeek ?? 0 };
  const created = localToday(new Date(habit.createdAt));
  const lastDay = today < week.end ? today : week.end;
  let expected = 0;
  for (let d = created > week.start ? created : week.start; d <= lastDay; d = addDays(d, 1)) {
    if (habit.scheduleType === 'daily' || (habit.weekdays ?? []).includes(isoWeekday(d))) expected += 1;
  }
  return { done, expected };
}

/** "Daily", "Mon, Wed, Fri" or "3 times per week". */
export function scheduleSummary(habit: Pick<HabitSchedule, 'scheduleType' | 'weekdays' | 'timesPerWeek'>): string {
  if (habit.scheduleType === 'daily') return 'Daily';
  if (habit.scheduleType === 'weekdays') {
    const days = [...new Set(habit.weekdays ?? [])].sort((a, b) => a - b);
    return days.map((d) => WEEKDAY_NAMES[d - 1]).join(', ');
  }
  const n = habit.timesPerWeek ?? 0;
  return n === 1 ? '1 time per week' : `${n} times per week`;
}

export interface ScheduleInput {
  scheduleType: ScheduleType;
  weekdays: number[];
  timesPerWeek: number | null;
}

export interface ScheduleErrors {
  weekdays?: string;
  timesPerWeek?: string;
}

/** Errors for the fields the schedule type needs; an empty object means valid. */
export function validateSchedule(input: ScheduleInput): ScheduleErrors {
  if (input.scheduleType === 'weekdays' && input.weekdays.length === 0) return { weekdays: 'Pick at least one day' };
  if (input.scheduleType === 'times_per_week') {
    const n = input.timesPerWeek;
    if (n === null || !Number.isInteger(n) || n < 1 || n > 7) return { timesPerWeek: 'Enter a number from 1 to 7' };
  }
  return {};
}
