import { and, desc, eq, isNotNull } from 'drizzle-orm';
import type { Db } from '../../../core/db/drizzle.ts';
import { createFields, deleteFields, naturalId, newId, notDeleted, type Clock } from '../../../core/db/records.ts';
import { reviewMeasureSnapshots, weeklyReviews } from '../../../core/db/schema.ts';
import { addDays } from '../../../core/dates/today.ts';
import { measureProgress } from '../../goals/domain/goals.ts';
import { listActiveGoals } from '../../goals/data/goals-repository.ts';

export type WeeklyReview = typeof weeklyReviews.$inferSelect;

/** What the flow writes: score 1–10 or null, and free text. */
export interface ReviewDraft {
  score: number | null;
  reflection: string;
  planNextWeek: string;
}

export const MIN_SCORE = 1;
export const MAX_SCORE = 10;

export type SaveReviewResult = { ok: true; id: string } | { ok: false; error: string };

/** The review of the week starting on `weekStart` (draft or completed), or undefined. */
export async function getReview(db: Db, weekStart: string): Promise<WeeklyReview | undefined> {
  const [row] = await db.select().from(weeklyReviews).where(and(eq(weeklyReviews.weekStart, weekStart), notDeleted(weeklyReviews)));
  return row;
}

/** The plan for the week starting on `weekStart`: the plan of the completed review of the week before it, or null. */
export async function getPlanForWeek(db: Db, weekStart: string): Promise<string | null> {
  const review = await getReview(db, addDays(weekStart, -7));
  const plan = review?.completedAt ? review.planNextWeek.trim() : '';
  return plan === '' ? null : plan;
}

/** A review by its id, for the history page. */
export async function getReviewById(db: Db, id: string): Promise<WeeklyReview | undefined> {
  const [row] = await db.select().from(weeklyReviews).where(and(eq(weeklyReviews.id, id), notDeleted(weeklyReviews)));
  return row;
}

function upsertReviewQuery(db: Db, clock: Clock, weekStart: string, draft: ReviewDraft, completedAt?: string) {
  const id = naturalId('weekly_review', weekStart);
  const values = {
    score: draft.score,
    reflection: draft.reflection,
    planNextWeek: draft.planNextWeek,
    ...(completedAt === undefined ? {} : { completedAt }),
  };
  return db
    .insert(weeklyReviews)
    .values({ ...createFields(clock, id), weekStart, ...values })
    .onConflictDoUpdate({ target: weeklyReviews.id, set: { ...values, updatedAt: clock().toISOString(), deletedAt: null } });
}

/** The review of the week; an empty draft (natural ID) is created when there is none. */
export async function getOrCreateDraft(db: Db, clock: Clock, weekStart: string): Promise<WeeklyReview> {
  const existing = await getReview(db, weekStart);
  if (existing) return existing;
  await upsertReviewQuery(db, clock, weekStart, { score: null, reflection: '', planNextWeek: '' });
  return (await getReview(db, weekStart))!;
}

/** Stores score, reflection and plan without changing whether the review is completed. */
export async function saveDraft(db: Db, clock: Clock, weekStart: string, draft: ReviewDraft): Promise<void> {
  await upsertReviewQuery(db, clock, weekStart, draft);
}

/**
 * Saves the review as completed and replaces its snapshots, in one batch: the old snapshots are
 * soft-deleted and one is inserted for every measure of an active goal. Needs a score from 1 to 10.
 */
export async function saveReview(db: Db, clock: Clock, weekStart: string, draft: ReviewDraft): Promise<SaveReviewResult> {
  if (draft.score === null || !Number.isInteger(draft.score) || draft.score < MIN_SCORE || draft.score > MAX_SCORE) {
    return { ok: false, error: 'Choose a score from 1 to 10' };
  }
  const id = naturalId('weekly_review', weekStart);
  const goals = await listActiveGoals(db);
  const snapshots = goals.flatMap(({ measures }) =>
    measures.map((m) => ({
      ...createFields(clock, newId()),
      weeklyReviewId: id,
      measureId: m.id,
      progress: measureProgress(m, m.checkIns),
    })),
  );
  await db.batch([
    upsertReviewQuery(db, clock, weekStart, draft, clock().toISOString()),
    db.update(reviewMeasureSnapshots).set(deleteFields(clock)).where(and(eq(reviewMeasureSnapshots.weeklyReviewId, id), notDeleted(reviewMeasureSnapshots))),
    ...(snapshots.length > 0 ? [db.insert(reviewMeasureSnapshots).values(snapshots)] : []),
  ]);
  return { ok: true, id };
}

/** Completed reviews, newest week first. */
export function listCompletedReviews(db: Db): Promise<WeeklyReview[]> {
  return db
    .select()
    .from(weeklyReviews)
    .where(and(notDeleted(weeklyReviews), isNotNull(weeklyReviews.completedAt)))
    .orderBy(desc(weeklyReviews.weekStart));
}

/** The most recently completed review (by week), whose plan the Review tab shows. */
export async function getLatestCompletedReview(db: Db): Promise<WeeklyReview | undefined> {
  return (await listCompletedReviews(db))[0];
}
