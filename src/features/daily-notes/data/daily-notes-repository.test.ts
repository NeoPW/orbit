import { describe, expect, it } from 'vitest';
import { naturalId } from '../../../core/db/records.ts';
import { dailyNotes } from '../../../core/db/schema.ts';
import { openTestDatabase } from '../../../core/db/testing.ts';
import { getDailyNote, saveDailyNote } from './daily-notes-repository.ts';

const at = (iso: string) => () => new Date(iso);
const clock = at('2026-11-09T10:00:00Z');

describe('daily notes repository', () => {
  it('changes the note of a day instead of adding one', async () => {
    const { db } = await openTestDatabase();
    await saveDailyNote(db, clock, '2026-11-09', 'Call the bank');
    await saveDailyNote(db, clock, '2026-11-09', 'Call the bank, then gym');
    const rows = await db.select().from(dailyNotes);
    expect(rows.map((r) => r.note)).toEqual(['Call the bank, then gym']);
  });

  it('ends up as one note, the later one, when two devices write the same day', async () => {
    const { db } = await openTestDatabase();
    await saveDailyNote(db, at('2026-11-09T10:00:00Z'), '2026-11-09', 'desktop');
    await saveDailyNote(db, at('2026-11-09T11:00:00Z'), '2026-11-09', 'phone');
    const rows = await db.select().from(dailyNotes);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ id: naturalId('daily_note', '2026-11-09'), note: 'phone' });
  });

  it('deletes an emptied note and writes it again later', async () => {
    const { db } = await openTestDatabase();
    await saveDailyNote(db, clock, '2026-11-09', 'x');
    await saveDailyNote(db, clock, '2026-11-09', '');
    expect(await getDailyNote(db, '2026-11-09')).toBeUndefined();
    await saveDailyNote(db, clock, '2026-11-09', 'again');
    expect((await getDailyNote(db, '2026-11-09'))?.note).toBe('again');
  });

  it('treats spaces and blank lines as an empty note', async () => {
    const { db } = await openTestDatabase();
    await saveDailyNote(db, clock, '2026-11-09', 'x');
    await saveDailyNote(db, clock, '2026-11-09', '  \n \n   ');
    expect(await getDailyNote(db, '2026-11-09')).toBeUndefined();
  });

  it('keeps the note of an earlier day and starts the next day empty', async () => {
    const { db } = await openTestDatabase();
    await saveDailyNote(db, clock, '2026-11-09', 'Call the bank');
    expect(await getDailyNote(db, '2026-11-10')).toBeUndefined();
    expect((await getDailyNote(db, '2026-11-09'))?.note).toBe('Call the bank');
  });

  it('drops leading blank lines and trailing whitespace but keeps the first line indent', async () => {
    const { db } = await openTestDatabase();
    await saveDailyNote(db, clock, '2026-11-09', '\n\n  - Groceries\n- Milk  \n\n');
    expect((await getDailyNote(db, '2026-11-09'))?.note).toBe('  - Groceries\n- Milk');
  });
});
