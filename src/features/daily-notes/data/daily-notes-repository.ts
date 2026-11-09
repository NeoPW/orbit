import { and, eq } from 'drizzle-orm';
import type { Db } from '../../../core/db/drizzle.ts';
import { createFields, deleteFields, naturalId, notDeleted, type Clock } from '../../../core/db/records.ts';
import { dailyNotes } from '../../../core/db/schema.ts';

export type DailyNote = typeof dailyNotes.$inferSelect;

const idOf = (date: string) => naturalId('daily_note', date);

/** Blank lines at the start and whitespace at the end go; the indentation of the first line stays. */
export function normalizeNote(text: string): string {
  return text.replace(/^(?:[ \t]*\r?\n)+/, '').trimEnd();
}

/** The note of a local calendar day (`yyyy-mm-dd`), or undefined. */
export async function getDailyNote(db: Db, date: string): Promise<DailyNote | undefined> {
  const [row] = await db.select().from(dailyNotes).where(and(eq(dailyNotes.id, idOf(date)), notDeleted(dailyNotes)));
  return row;
}

/**
 * Writes the note of a day: one row per date (natural ID), so the same day written on two devices ends up
 * as one note. An empty or blank text deletes the note.
 */
export async function saveDailyNote(db: Db, clock: Clock, date: string, text: string): Promise<void> {
  const id = idOf(date);
  const note = normalizeNote(text);
  if (note === '') {
    await db.update(dailyNotes).set(deleteFields(clock)).where(and(eq(dailyNotes.id, id), notDeleted(dailyNotes)));
    return;
  }
  await db
    .insert(dailyNotes)
    .values({ ...createFields(clock, id), date, note })
    .onConflictDoUpdate({ target: dailyNotes.id, set: { note, updatedAt: clock().toISOString(), deletedAt: null } });
}
