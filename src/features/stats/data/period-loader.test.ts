import { describe, expect, it } from 'vitest';
import { createFields } from '../../../core/db/records.ts';
import { logEntries } from '../../../core/db/schema.ts';
import { openTestDatabase } from '../../../core/db/testing.ts';
import { parsePeriod } from '../domain/period.ts';
import { loadPeriodStats, loadStatsRows } from './period-loader.ts';

const clock = () => new Date('2026-11-08T12:00:00Z');
const today = '2026-11-08';
const entry = (date: string, minutes: number) => ({
  ...createFields(clock),
  occurredAt: new Date(`${date}T10:00:00`).toISOString(),
  durationMinutes: minutes,
});

describe('period loader', () => {
  it('loads entries of the period and the one before, not older ones', async () => {
    const { db } = await openTestDatabase();
    await db.insert(logEntries).values([entry('2026-08-01', 10), entry('2026-09-15', 20), entry('2026-10-10', 30)]);
    const rows = await loadStatsRows(db, parsePeriod('2026-10', today), today, null);
    expect(rows.logEntries).toHaveLength(2);
  });

  it('starts all time at the earliest entry', async () => {
    const { db } = await openTestDatabase();
    await db.insert(logEntries).values([entry('2026-03-14', 60), entry('2026-10-10', 30)]);
    const stats = await loadPeriodStats(db, parsePeriod('all', today), today);
    expect(stats.allStart).toBe('2026-03-14');
    expect(stats.headline.minutes).toBe(90);
  });

  it('has no start for all time without data', async () => {
    const { db } = await openTestDatabase();
    const stats = await loadPeriodStats(db, parsePeriod('all', today), today);
    expect(stats.allStart).toBeNull();
    expect(stats.headline.empty).toBe(true);
  });
});
