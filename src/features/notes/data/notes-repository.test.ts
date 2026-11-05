import { describe, expect, it } from 'vitest';
import { naturalId } from '../../../core/db/records.ts';
import { notes } from '../../../core/db/schema.ts';
import { openTestDatabase } from '../../../core/db/testing.ts';
import { getNote, listNotesForTarget, listNotesForWeek, saveNote } from './notes-repository.ts';

const at = (iso: string) => () => new Date(iso);
const clock = at('2026-10-11T10:00:00Z');

describe('notes repository', () => {
  it('changes the note of a week instead of adding one', async () => {
    const { db } = await openTestDatabase();
    await saveNote(db, clock, 'project', 'p1', '2026-10-05', 'Beds prepared');
    await saveNote(db, clock, 'project', 'p1', '2026-10-05', 'Beds and seeds');
    const list = await listNotesForTarget(db, 'project', 'p1');
    expect(list.map((n) => n.note)).toEqual(['Beds and seeds']);
  });

  it('ends up as one note, the later one, when two devices write the same note', async () => {
    const { db } = await openTestDatabase();
    await saveNote(db, at('2026-10-11T10:00:00Z'), 'project', 'p1', '2026-10-05', 'desktop');
    await saveNote(db, at('2026-10-11T11:00:00Z'), 'project', 'p1', '2026-10-05', 'browser');
    const rows = await db.select().from(notes);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ id: naturalId('note', 'project', 'p1', '2026-10-05'), note: 'browser' });
  });

  it('deletes an emptied note and writes it again later', async () => {
    const { db } = await openTestDatabase();
    await saveNote(db, clock, 'goal', 'g1', '2026-10-05', 'x');
    await saveNote(db, clock, 'goal', 'g1', '2026-10-05', '  ');
    expect(await getNote(db, 'goal', 'g1', '2026-10-05')).toBeUndefined();
    await saveNote(db, clock, 'goal', 'g1', '2026-10-05', 'back');
    expect((await getNote(db, 'goal', 'g1', '2026-10-05'))?.note).toBe('back');
  });

  it('lists the newest week first and the notes of a week', async () => {
    const { db } = await openTestDatabase();
    await saveNote(db, clock, 'project', 'p1', '2026-10-05', 'a');
    await saveNote(db, clock, 'project', 'p1', '2026-10-12', 'b');
    await saveNote(db, clock, 'goal', 'g1', '2026-10-12', 'c');
    expect((await listNotesForTarget(db, 'project', 'p1')).map((n) => n.weekStart)).toEqual(['2026-10-12', '2026-10-05']);
    expect((await listNotesForWeek(db, '2026-10-12')).map((n) => n.note).sort()).toEqual(['b', 'c']);
  });
});
