import { and, gte, lt } from 'drizzle-orm';
import type { Db } from '../../../core/db/drizzle.ts';
import { notDeleted } from '../../../core/db/records.ts';
import {
  areas,
  goals,
  habitChecks,
  habits,
  logEntries,
  measureChanges,
  measures,
  projects,
  reviewMeasureSnapshots,
  tasks,
  weeklyReviews,
} from '../../../core/db/schema.ts';
import { addDays } from '../../../core/dates/today.ts';
import { weekRange } from '../domain/review-week.ts';
import { summarizeWeek, type WeekRows, type WeekSummary } from '../domain/week-summary.ts';
import { firstUseDate } from './first-use.ts';

/** Weeks of log entries loaded before the shown week: the 8 bars of the trend plus 3 weeks for the first 4-week average. */
export const TREND_WEEKS_BEFORE = 10;

/** Loads the rows a summary of the week needs. Log entries come by the UTC range of the ten weeks up to the week, habit checks by local date. */
export async function loadWeekRows(db: Db, weekStart: string): Promise<WeekRows> {
  const week = weekRange(weekStart);
  const from = weekRange(addDays(weekStart, -7 * TREND_WEEKS_BEFORE)).from;
  const [goalRows, measureRows, changeRows, areaRows, projectRows, taskRows, habitRows, allChecks, entries, reviews, snapshots] =
    await Promise.all([
      db.select().from(goals).where(notDeleted(goals)).orderBy(goals.sortOrder, goals.createdAt),
      db.select().from(measures).where(notDeleted(measures)).orderBy(measures.sortOrder, measures.createdAt),
      db.select().from(measureChanges).where(notDeleted(measureChanges)),
      db.select().from(areas).where(notDeleted(areas)),
      db.select().from(projects),
      db.select().from(tasks),
      db.select().from(habits).where(notDeleted(habits)),
      db.select().from(habitChecks).where(notDeleted(habitChecks)),
      db
        .select()
        .from(logEntries)
        .where(and(notDeleted(logEntries), gte(logEntries.occurredAt, from), lt(logEntries.occurredAt, week.to))),
      db.select().from(weeklyReviews).where(notDeleted(weeklyReviews)),
      db.select().from(reviewMeasureSnapshots).where(notDeleted(reviewMeasureSnapshots)),
    ]);
  const firstUse = await firstUseDate(db);
  const goalStart = new Map(goalRows.map((g) => [g.id, g.startDate ?? '']));
  const checkDates = (habitId: string | null, goalId: string) =>
    habitId ? allChecks.filter((c) => c.habitId === habitId && c.date >= (goalStart.get(goalId) ?? '')).map((c) => c.date) : [];
  return {
    firstUse,
    goals: goalRows.map((g) => ({ id: g.id, title: g.title, status: g.status, color: g.color })),
    measures: measureRows.map((m) => ({
      ...m,
      checkIns: checkDates(m.habitId, m.goalId).length,
      checkDates: checkDates(m.habitId, m.goalId),
      changes: changeRows.filter((c) => c.measureId === m.id).map((c) => ({ at: c.createdAt, from: c.fromValue })),
    })),
    areas: areaRows,
    projects: projectRows,
    tasks: taskRows,
    habits: habitRows,
    habitChecks: allChecks.filter((c) => c.date >= week.start && c.date <= week.end),
    logEntries: entries,
    reviews,
    snapshots,
  };
}

/** The summary of the Monday–Sunday week starting on `weekStart`; `today` is the local date. A reviewed week shows its snapshots. */
export async function loadWeek(
  db: Db,
  weekStart: string,
  today: string,
  options: { live?: boolean; targetHours?: number | null } = {},
): Promise<WeekSummary> {
  const rows = await loadWeekRows(db, weekStart);
  // `live` shows the current progress of the goals even when the week's review is completed (the review flow).
  if (options.live) rows.reviews = rows.reviews.filter((r) => r.weekStart !== weekStart);
  return summarizeWeek(rows, weekRange(weekStart), today, { targetHours: options.targetHours ?? null });
}
