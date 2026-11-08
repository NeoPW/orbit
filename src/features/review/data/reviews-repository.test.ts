import { describe, expect, it } from 'vitest';
import { createFields } from '../../../core/db/records.ts';
import { goals, logEntries, measures, projects, reviewMeasureSnapshots } from '../../../core/db/schema.ts';
import { openTestDatabase } from '../../../core/db/testing.ts';
import { getPlanForWeek, getReview, listCompletedReviews, saveDraft, saveReview } from './reviews-repository.ts';
import { loadWeek } from './week-loader.ts';

const clock = () => new Date('2026-10-11T18:00:00Z');
const draft = (score: number | null) => ({ score, reflection: 'ok', planNextWeek: 'plan' });

async function withGoal() {
  const { db } = await openTestDatabase();
  const goal = { ...createFields(clock), title: 'Get fit', startDate: '2026-01-01', endDate: '2026-12-31' };
  await db.insert(goals).values(goal);
  const base = {
    ...createFields(clock),
    goalId: goal.id,
    measureType: 'numeric' as const,
    startValue: 0,
    targetValue: 100,
    currentValue: 40,
  };
  await db.insert(measures).values([
    { ...base, id: 'm1', title: 'Run' },
    { ...base, id: 'm2', title: 'Swim', currentValue: 60 },
  ]);
  // A measure of a completed goal gets no snapshot.
  await db.insert(goals).values({ ...createFields(clock), title: 'Old', status: 'completed' });
  return db;
}

const liveSnapshots = async (db: Awaited<ReturnType<typeof withGoal>>) =>
  (await db.select().from(reviewMeasureSnapshots)).filter((s) => s.deletedAt === null);

describe('reviews repository', () => {
  it('saves a completed review with a snapshot per measure of an active goal', async () => {
    const db = await withGoal();
    const result = await saveReview(db, clock, '2026-10-05', draft(8));
    expect(result.ok).toBe(true);
    const review = await getReview(db, '2026-10-05');
    expect(review).toMatchObject({ score: 8, completedAt: clock().toISOString() });
    const snaps = await liveSnapshots(db);
    expect(snaps.map((s) => s.progress).sort()).toEqual([0.4, 0.6]);
    expect(snaps.every((s) => s.weeklyReviewId === review!.id)).toBe(true);
  });

  it('does not save without a score', async () => {
    const db = await withGoal();
    expect((await saveReview(db, clock, '2026-10-05', draft(null))).ok).toBe(false);
    expect(await getReview(db, '2026-10-05')).toBeUndefined();
  });

  it('edits a completed review: same review, new score, replaced snapshots', async () => {
    const db = await withGoal();
    await saveReview(db, clock, '2026-10-05', draft(8));
    const first = await getReview(db, '2026-10-05');
    await saveReview(db, clock, '2026-10-05', draft(6));
    const second = await getReview(db, '2026-10-05');
    expect(second).toMatchObject({ id: first!.id, score: 6 });
    expect(await liveSnapshots(db)).toHaveLength(2);
    expect(await db.select().from(reviewMeasureSnapshots)).toHaveLength(4);
  });

  it('keeps a draft and leaves it out of the history', async () => {
    const { db } = await openTestDatabase();
    await saveDraft(db, clock, '2026-10-05', draft(7));
    expect(await getReview(db, '2026-10-05')).toMatchObject({ score: 7, reflection: 'ok', completedAt: null });
    expect(await listCompletedReviews(db)).toEqual([]);
  });

  it('lists the history newest week first', async () => {
    const { db } = await openTestDatabase();
    await saveReview(db, clock, '2026-09-28', draft(5));
    await saveReview(db, clock, '2026-10-05', draft(6));
    await saveDraft(db, clock, '2026-10-12', draft(7));
    expect((await listCompletedReviews(db)).map((r) => r.weekStart)).toEqual(['2026-10-05', '2026-09-28']);
  });

  it('loads the work of a past week by the local week', async () => {
    const { db } = await openTestDatabase();
    const project = { ...createFields(clock), title: 'Thesis' };
    await db.insert(projects).values(project);
    const entry = (date: string) => ({
      ...createFields(clock),
      projectId: project.id,
      occurredAt: new Date(`${date}T10:00:00`).toISOString(),
      durationMinutes: 20,
    });
    await db.insert(logEntries).values([entry('2026-09-28'), entry('2026-10-01'), entry('2026-10-04'), entry('2026-10-05')]);
    const summary = await loadWeek(db, '2026-09-28', '2026-10-14');
    expect(summary.time.byProject[0]).toMatchObject({ title: 'Thesis', minutes: 60 });
  });

  describe('plan of a week', () => {
    it('is the plan written in the completed review of the week before', async () => {
      const { db } = await openTestDatabase();
      await saveReview(db, clock, '2026-10-19', { score: 7, reflection: '', planNextWeek: ' Draft chapter 4 ' });
      expect(await getPlanForWeek(db, '2026-10-26')).toBe('Draft chapter 4');
      expect(await getPlanForWeek(db, '2026-11-02')).toBeNull();
    });

    it('is none when the week before was not reviewed', async () => {
      const { db } = await openTestDatabase();
      await saveReview(db, clock, '2026-10-05', { score: 7, reflection: '', planNextWeek: 'old' });
      expect(await getPlanForWeek(db, '2026-10-26')).toBeNull();
    });

    it('ignores a draft', async () => {
      const { db } = await openTestDatabase();
      await saveDraft(db, clock, '2026-10-19', { score: null, reflection: '', planNextWeek: 'plan' });
      expect(await getPlanForWeek(db, '2026-10-26')).toBeNull();
    });
  });
});
