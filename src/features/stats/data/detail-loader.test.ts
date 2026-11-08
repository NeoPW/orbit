import { describe, expect, it } from 'vitest';
import { createFields } from '../../../core/db/records.ts';
import { goals, logEntries, tasks } from '../../../core/db/schema.ts';
import { openTestDatabase } from '../../../core/db/testing.ts';
import { parsePeriod } from '../domain/period.ts';
import { setMeasureValue, addMeasure } from '../../goals/data/measures-repository.ts';
import { loadStatsDetail } from './detail-loader.ts';

const clock = () => new Date('2026-11-08T12:00:00Z');
const today = '2026-11-08';
const entry = (date: string) => ({ ...createFields(clock), occurredAt: new Date(`${date}T10:00:00`).toISOString(), durationMinutes: 30 });

describe('detail loader', () => {
  it('loads the entries of the calendar year only', async () => {
    const { db } = await openTestDatabase();
    await db.insert(logEntries).values([entry('2025-06-01'), entry('2026-02-01'), entry('2026-10-05')]);
    const detail = await loadStatsDetail(db, parsePeriod('2026-10', today), today);
    expect(detail.entries).toHaveLength(2);
    expect(detail.range.start).toBe('2025-12-29');
  });

  it('loads every entry for all time', async () => {
    const { db } = await openTestDatabase();
    await db.insert(logEntries).values([entry('2024-06-01'), entry('2026-10-05')]);
    const detail = await loadStatsDetail(db, parsePeriod('all', today), today);
    expect(detail.entries).toHaveLength(2);
    expect(detail.firstUse).toBe('2024-06-01');
  });

  it('sums the lifetime minutes of a project over all years', async () => {
    const { db } = await openTestDatabase();
    const withProject = (date: string, minutes: number) => ({ ...entry(date), projectId: 'p', durationMinutes: minutes });
    await db.insert(logEntries).values([withProject('2024-06-01', 60), withProject('2026-10-05', 30)]);
    const detail = await loadStatsDetail(db, parsePeriod('2026-10', today), today);
    expect(detail.lifetime.find((r) => r.projectId === 'p')?.minutes).toBe(90);
    expect(detail.entries).toHaveLength(1);
  });

  it('loads tasks with their dates, deleted ones flagged', async () => {
    const { db } = await openTestDatabase();
    await db.insert(tasks).values([
      { ...createFields(clock), title: 'Kept' },
      { ...createFields(clock), title: 'Gone', deletedAt: clock().toISOString() },
    ]);
    const detail = await loadStatsDetail(db, parsePeriod('2026-10', today), today);
    expect(detail.links.tasks.map((t) => t.deletedAt !== null)).toEqual(expect.arrayContaining([true, false]));
  });

  it('loads active goals with their measures and recorded changes, not completed or deleted goals', async () => {
    const { db } = await openTestDatabase();
    const goal = (title: string, over: object = {}) => ({ ...createFields(clock), title, ...over });
    const [active, done, gone] = [goal('Active'), goal('Done', { status: 'completed' }), goal('Gone', { deletedAt: clock().toISOString() })];
    await db.insert(goals).values([active, done, gone]);
    const id = await addMeasure(db, clock, active.id, {
      title: 'Run',
      description: '',
      measureType: 'numeric',
      startValue: 0,
      targetValue: 100,
      currentValue: 10,
      unit: null,
      step: 1,
      habitId: null,
    });
    await setMeasureValue(db, clock, id, 40);
    const detail = await loadStatsDetail(db, parsePeriod('2026-10', today), today);
    expect(detail.goalRows.goals.map((g) => g.title)).toEqual(['Active']);
    expect(detail.goalRows.measures).toHaveLength(1);
    expect(detail.goalRows.measures[0]?.changes).toHaveLength(1);
  });
});
