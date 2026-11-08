import { and, isNotNull, min } from 'drizzle-orm';
import { localToday } from '../../../core/dates/deadline.ts';
import type { Db } from '../../../core/db/drizzle.ts';
import { notDeleted } from '../../../core/db/records.ts';
import { habitChecks, logEntries, weeklyReviews } from '../../../core/db/schema.ts';

/** The first-use date: the earliest date with a log entry, a habit check or a completed review; null without any. */
export async function firstUseDate(db: Db): Promise<string | null> {
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
