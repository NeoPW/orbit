import { and, gte, isNotNull, lt, min } from 'drizzle-orm';
import { localToday } from '../../../core/dates/deadline.ts';
import { addDays } from '../../../core/dates/today.ts';
import type { Db } from '../../../core/db/drizzle.ts';
import { notDeleted } from '../../../core/db/records.ts';
import { goals, habitChecks, habits, logEntries, projects, tasks, weeklyReviews } from '../../../core/db/schema.ts';
import {
  comparePeriods,
  periodHeadline,
  periodTrend,
  previousHeadline,
  type Comparison,
  type Headline,
  type StatsRows,
  type TrendPoint,
} from '../domain/period-stats.ts';
import { periodRange, stepPeriod, type Period } from '../domain/period.ts';

export interface PeriodStats {
  period: Period;
  /** The first date with data, for "All time". */
  allStart: string | null;
  headline: Headline;
  comparison: Comparison;
  trend: TrendPoint[];
}

const localMidnight = (date: string) => {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y ?? 0, (m ?? 1) - 1, d ?? 1).toISOString();
};

/** The earliest date with a log entry, a habit check or a completed review; null without any. */
export async function firstDataDate(db: Db): Promise<string | null> {
  const [entry, check, review] = await Promise.all([
    db.select({ v: min(logEntries.occurredAt) }).from(logEntries).where(notDeleted(logEntries)),
    db.select({ v: min(habitChecks.date) }).from(habitChecks).where(notDeleted(habitChecks)),
    db.select({ v: min(weeklyReviews.weekStart) }).from(weeklyReviews).where(and(notDeleted(weeklyReviews), isNotNull(weeklyReviews.completedAt))),
  ]);
  const dates = [entry[0]?.v ? localToday(new Date(entry[0].v)) : null, check[0]?.v ?? null, review[0]?.v ?? null].filter(
    (d): d is string => d !== null,
  );
  return dates.length > 0 ? dates.sort()[0] ?? null : null;
}

/**
 * Rows for the period and the one before it. Weeks belong to the period holding their Thursday, so the range
 * reaches a week before the previous period's start and a week after the shown period's end.
 */
export async function loadStatsRows(db: Db, period: Period, today: string, allStart: string | null): Promise<StatsRows> {
  const bounded = period.kind !== 'all';
  const previous = stepPeriod(period, -1);
  const first = bounded && previous ? addDays(periodRange(previous, today).start, -7) : null;
  const last = bounded ? addDays(periodRange(period, today, allStart).end, 8) : null;
  const [goalRows, projectRows, taskRows, habitRows, checks, entries, reviews] = await Promise.all([
    db.select({ id: goals.id }).from(goals).where(notDeleted(goals)),
    db.select({ id: projects.id, goalId: projects.goalId }).from(projects),
    db.select({ id: tasks.id, projectId: tasks.projectId, goalId: tasks.goalId }).from(tasks),
    db.select().from(habits).where(notDeleted(habits)),
    db
      .select({ habitId: habitChecks.habitId, date: habitChecks.date })
      .from(habitChecks)
      .where(and(notDeleted(habitChecks), first ? gte(habitChecks.date, first) : undefined, last ? lt(habitChecks.date, last) : undefined)),
    db
      .select()
      .from(logEntries)
      .where(
        and(
          notDeleted(logEntries),
          first ? gte(logEntries.occurredAt, localMidnight(first)) : undefined,
          last ? lt(logEntries.occurredAt, localMidnight(last)) : undefined,
        ),
      ),
    db.select({ weekStart: weeklyReviews.weekStart, score: weeklyReviews.score }).from(weeklyReviews).where(and(notDeleted(weeklyReviews), isNotNull(weeklyReviews.completedAt))),
  ]);
  return { goals: goalRows, projects: projectRows, tasks: taskRows, habits: habitRows, habitChecks: checks, logEntries: entries, reviews };
}

/** The headline, its comparison with the previous period and the trends of a period. */
export async function loadPeriodStats(db: Db, period: Period, today: string): Promise<PeriodStats> {
  const allStart = period.kind === 'all' ? await firstDataDate(db) : null;
  const rows = await loadStatsRows(db, period, today, allStart);
  const headline = periodHeadline(rows, period, today, allStart);
  return {
    period,
    allStart,
    headline,
    comparison: comparePeriods(headline, previousHeadline(rows, period, today), period),
    trend: periodTrend(rows, period, today, allStart),
  };
}
