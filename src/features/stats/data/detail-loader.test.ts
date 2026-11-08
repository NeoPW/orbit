import { describe, expect, it } from 'vitest';
import { createFields } from '../../../core/db/records.ts';
import { logEntries } from '../../../core/db/schema.ts';
import { openTestDatabase } from '../../../core/db/testing.ts';
import { parsePeriod } from '../domain/period.ts';
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
    expect(detail.allStart).toBe('2024-06-01');
  });
});
