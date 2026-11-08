import { describe, expect, it } from 'vitest';
import { createFields } from '../../../core/db/records.ts';
import { habitChecks, logEntries } from '../../../core/db/schema.ts';
import { openTestDatabase } from '../../../core/db/testing.ts';
import { firstUseDate } from './first-use.ts';

const clock = () => new Date('2026-11-08T12:00:00Z');

describe('firstUseDate', () => {
  it('is the earliest log entry, habit check or completed review', async () => {
    const { db } = await openTestDatabase();
    await db.insert(logEntries).values({ ...createFields(clock), occurredAt: new Date('2026-03-14T10:00:00').toISOString(), durationMinutes: 60 });
    await db.insert(habitChecks).values({ ...createFields(clock), habitId: 'h', date: '2026-02-01' });
    expect(await firstUseDate(db)).toBe('2026-02-01');
  });

  it('is null without data', async () => {
    const { db } = await openTestDatabase();
    expect(await firstUseDate(db)).toBeNull();
  });
});
