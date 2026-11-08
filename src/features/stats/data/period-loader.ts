import { and, gte, isNotNull, lt } from 'drizzle-orm';
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
import { firstUseDate } from '../../review/data/first-use.ts';
import { periodRange, stepPeriod, type Period } from '../domain/period.ts';

export interface PeriodStats {
  period: Period;
  /** The first date with data, for "All time". */
  firstUse: string | null;
  headline: Headline;
  comparison: Comparison;
  trend: TrendPoint[];
}

const localMidnight = (date: string) => {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y ?? 0, (m ?? 1) - 1, d ?? 1).toISOString();
};

/**
 * Rows for the period and the one before it. Weeks belong to the period holding their Thursday, so the range
 * reaches a week before the previous period's start and a week after the shown period's end.
 */
export async function loadStatsRows(db: Db, period: Period, today: string, firstUse: string | null): Promise<StatsRows> {
  const bounded = period.kind !== 'all';
  const previous = stepPeriod(period, -1);
  const first = bounded && previous ? addDays(periodRange(previous, today).start, -7) : null;
  const last = bounded ? addDays(periodRange(period, today, firstUse).end, 8) : null;
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
  const firstUse = await firstUseDate(db);
  const rows = await loadStatsRows(db, period, today, firstUse);
  const headline = periodHeadline(rows, period, today, firstUse);
  return {
    period,
    firstUse,
    headline,
    comparison: comparePeriods(headline, previousHeadline(rows, period, today, firstUse), period),
    trend: periodTrend(rows, period, today, firstUse),
  };
}
