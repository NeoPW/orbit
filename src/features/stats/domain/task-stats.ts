import { localToday } from '../../../core/dates/deadline.ts';
import { periodBuckets, periodRange, type Bucket, type Period } from './period.ts';

export interface TaskDates {
  status: string;
  createdAt: string;
  completedAt: string | null;
  deletedAt: string | null;
}

export interface TaskFigures {
  completed: number;
  created: number;
  /** Median minutes from creation to completion of the tasks completed in the period; null without one. */
  medianMinutes: number | null;
}

const localDate = (iso: string) => localToday(new Date(iso));
const completedDate = (t: TaskDates) => (t.deletedAt === null && t.status === 'done' && t.completedAt ? localDate(t.completedAt) : null);

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? (sorted[mid] ?? null) : ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
}

/** Tasks completed and created in the period (by local date, deleted ones left out) and the median time to done. */
export function taskFigures(tasks: readonly TaskDates[], period: Period, today: string, firstUse: string | null = null): TaskFigures {
  const { start, end } = periodRange(period, today, firstUse);
  const inRange = (date: string | null) => date !== null && date >= start && date <= end;
  const done = tasks.filter((t) => inRange(completedDate(t)));
  return {
    completed: done.length,
    created: tasks.filter((t) => t.deletedAt === null && inRange(localDate(t.createdAt))).length,
    medianMinutes: median(done.map((t) => (Date.parse(t.completedAt as string) - Date.parse(t.createdAt)) / 60000)),
  };
}

/** Tasks completed in each week or month of the period. */
export function taskTrend(tasks: readonly TaskDates[], period: Period, today: string, firstUse: string | null = null): { bucket: Bucket; completed: number }[] {
  const dates = tasks.map(completedDate).filter((d): d is string => d !== null);
  return periodBuckets(period, today, firstUse).map((bucket) => ({
    bucket,
    completed: dates.filter((d) => d >= bucket.start && d <= bucket.end).length,
  }));
}

/** "3 days", "1 day" or, under a day, "5 h" ("< 1 h" under an hour). */
export function formatTimeToDone(minutes: number): string {
  if (minutes >= 1440) {
    const days = Math.round(minutes / 1440);
    return `${days} ${days === 1 ? 'day' : 'days'}`;
  }
  return minutes < 60 ? '< 1 h' : `${Math.round(minutes / 60)} h`;
}
