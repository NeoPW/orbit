import { and, gte, lt, sum } from 'drizzle-orm';
import { addDays } from '../../../core/dates/today.ts';
import type { Db } from '../../../core/db/drizzle.ts';
import { notDeleted } from '../../../core/db/records.ts';
import { areas, goals, habitChecks, habits, logEntries, projects, tasks } from '../../../core/db/schema.ts';
import type { HabitRows } from '../domain/habit-stats.ts';
import type { Period } from '../domain/period.ts';
import type { LifetimeMinutes, TimeEntry, TimeLinks } from '../domain/period-time.ts';
import { calendarRange } from '../domain/work-calendar.ts';
import { firstDataDate } from './period-loader.ts';

export interface StatsDetail {
  period: Period;
  /** The first date with data, for "All time". */
  allStart: string | null;
  /** The days the work calendar grid covers. */
  range: { start: string; end: string };
  habitRows: HabitRows;
  /** Log entries of the calendar range (all of them for "All time"). */
  entries: (TimeEntry & { source: string; habitId: string | null })[];
  /** Rows that attribute entries to areas, goals and projects, and the task dates. */
  links: TimeLinks;
  /** Minutes over all time per project and task, whatever the period. */
  lifetime: LifetimeMinutes[];
}

const localMidnight = (date: string) => {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y ?? 0, (m ?? 1) - 1, d ?? 1).toISOString();
};

/** What the work calendar, heatmap and habits panel need: all habit checks and the log entries of the calendar range. */
export async function loadStatsDetail(db: Db, period: Period, today: string): Promise<StatsDetail> {
  const allStart = period.kind === 'all' ? await firstDataDate(db) : null;
  const range = calendarRange(period, today);
  const bounded = period.kind !== 'all';
  const [habitList, checks, entries, areaRows, goalRows, projectRows, taskRows, lifetimeRows] = await Promise.all([
    db.select().from(habits).where(notDeleted(habits)),
    db.select({ habitId: habitChecks.habitId, date: habitChecks.date }).from(habitChecks).where(notDeleted(habitChecks)),
    db
      .select({
        source: logEntries.source,
        occurredAt: logEntries.occurredAt,
        durationMinutes: logEntries.durationMinutes,
        habitId: logEntries.habitId,
        projectId: logEntries.projectId,
        goalId: logEntries.goalId,
        taskId: logEntries.taskId,
      })
      .from(logEntries)
      .where(
        and(
          notDeleted(logEntries),
          bounded ? gte(logEntries.occurredAt, localMidnight(range.start)) : undefined,
          bounded ? lt(logEntries.occurredAt, localMidnight(addDays(range.end, 1))) : undefined,
        ),
      ),
    db.select().from(areas).where(notDeleted(areas)),
    db.select().from(goals).where(notDeleted(goals)).orderBy(goals.sortOrder, goals.createdAt),
    db.select().from(projects),
    db.select().from(tasks),
    db
      .select({ projectId: logEntries.projectId, taskId: logEntries.taskId, minutes: sum(logEntries.durationMinutes) })
      .from(logEntries)
      .where(notDeleted(logEntries))
      .groupBy(logEntries.projectId, logEntries.taskId),
  ]);
  return {
    period,
    allStart,
    range,
    habitRows: { habits: habitList, checks, entries },
    entries,
    links: {
      areas: areaRows,
      goals: goalRows.map((g) => ({ id: g.id, title: g.title, status: g.status, color: g.color })),
      projects: projectRows,
      tasks: taskRows,
    },
    lifetime: lifetimeRows.map((r) => ({ projectId: r.projectId, taskId: r.taskId, minutes: Number(r.minutes ?? 0) })),
  };
}
