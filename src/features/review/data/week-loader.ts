import { and, gte, lt } from 'drizzle-orm';
import type { Db } from '../../../core/db/drizzle.ts';
import { notDeleted } from '../../../core/db/records.ts';
import { goals, habitChecks, habits, logEntries, measures, projects, reviewMeasureSnapshots, tasks, weeklyReviews } from '../../../core/db/schema.ts';
import { weekRange } from '../domain/review-week.ts';
import { summarizeWeek, type WeekRows, type WeekSummary } from '../domain/week-summary.ts';

/** Loads the rows a summary of the week needs. Log entries come by the UTC range of the local week, habit checks by local date. */
export async function loadWeekRows(db: Db, weekStart: string): Promise<WeekRows> {
  const week = weekRange(weekStart);
  const [goalRows, measureRows, projectRows, taskRows, habitRows, allChecks, entries, reviews, snapshots] = await Promise.all([
    db.select().from(goals).where(notDeleted(goals)).orderBy(goals.sortOrder, goals.createdAt),
    db.select().from(measures).where(notDeleted(measures)).orderBy(measures.sortOrder, measures.createdAt),
    db.select().from(projects),
    db.select().from(tasks),
    db.select().from(habits).where(notDeleted(habits)),
    db.select().from(habitChecks).where(notDeleted(habitChecks)),
    db.select().from(logEntries).where(and(notDeleted(logEntries), gte(logEntries.occurredAt, week.from), lt(logEntries.occurredAt, week.to))),
    db.select().from(weeklyReviews).where(notDeleted(weeklyReviews)),
    db.select().from(reviewMeasureSnapshots).where(notDeleted(reviewMeasureSnapshots)),
  ]);
  const goalStart = new Map(goalRows.map((g) => [g.id, g.startDate ?? '']));
  const checkIns = (habitId: string | null, goalId: string) =>
    habitId ? allChecks.filter((c) => c.habitId === habitId && c.date >= (goalStart.get(goalId) ?? '')).length : 0;
  return {
    goals: goalRows.map((g) => ({ id: g.id, title: g.title, status: g.status, color: g.color })),
    measures: measureRows.map((m) => ({ ...m, checkIns: checkIns(m.habitId, m.goalId) })),
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
export async function loadWeek(db: Db, weekStart: string, today: string, options: { live?: boolean } = {}): Promise<WeekSummary> {
  const rows = await loadWeekRows(db, weekStart);
  // `live` shows the current progress of the goals even when the week's review is completed (the review flow).
  if (options.live) rows.reviews = rows.reviews.filter((r) => r.weekStart !== weekStart);
  return summarizeWeek(rows, weekRange(weekStart), today);
}
