import { localToday } from '../../../core/dates/deadline.ts';
import { addDays } from '../../../core/dates/today.ts';
import { isoWeekday, weekStartOf } from '../../habits/domain/habits.ts';
import { blockTimes } from '../../timeline/domain/day-timeline.ts';
import type { Period } from './period.ts';

export interface CalendarEntry {
  source: string;
  occurredAt: string;
  durationMinutes: number | null;
}

/** Minutes worked per local date (the date of the entry's `occurredAt`), for the dates from `from` to `to`. */
export function dailyMinutes(entries: readonly CalendarEntry[], from: string, to: string): Map<string, number> {
  const days = new Map<string, number>();
  for (const e of entries) {
    const minutes = e.durationMinutes ?? 0;
    if (minutes <= 0) continue;
    const date = localToday(new Date(e.occurredAt));
    if (date >= from && date <= to) days.set(date, (days.get(date) ?? 0) + minutes);
  }
  return days;
}

/** The step 0–4 of a day: 0 without work, then up to 25 %, 50 %, 75 % and above, as a share of the busiest day. */
export function intensity(minutes: number, max: number): 0 | 1 | 2 | 3 | 4 {
  if (minutes <= 0 || max <= 0) return 0;
  const share = minutes / max;
  return share <= 0.25 ? 1 : share <= 0.5 ? 2 : share <= 0.75 ? 3 : 4;
}

/** The days the work calendar grid covers, Monday to Sunday: the calendar year of the period, or the 53 weeks up to the current week. */
export function calendarRange(period: Period, today: string): { start: string; end: string } {
  if (period.kind === 'all') {
    const thisWeek = weekStartOf(today);
    return { start: addDays(thisWeek, -52 * 7), end: addDays(thisWeek, 6) };
  }
  const year = period.key.slice(0, 4);
  return { start: weekStartOf(`${year}-01-01`), end: addDays(weekStartOf(`${year}-12-31`), 6) };
}

/**
 * Minutes worked per weekday (0 = Monday) and hour of the day over the dates `from`..`to`. An entry's time is spread
 * over the hours between its start and end (see day-timeline), across midnight, by the local clock.
 */
export function weekdayHourMinutes(entries: readonly CalendarEntry[], from: string, to: string): number[][] {
  const grid = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));
  for (const e of entries) {
    if ((e.durationMinutes ?? 0) <= 0) continue;
    const { start, end } = blockTimes(e);
    for (let cursor = start; cursor < end; ) {
      const next = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate(), cursor.getHours() + 1);
      const segmentEnd = next < end ? next : end;
      const date = localToday(cursor);
      if (date >= from && date <= to) {
        const row = grid[isoWeekday(date) - 1];
        if (row) row[cursor.getHours()] = (row[cursor.getHours()] ?? 0) + (segmentEnd.getTime() - cursor.getTime()) / 60000;
      }
      cursor = segmentEnd;
    }
  }
  return grid;
}
