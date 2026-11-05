import { and, desc, eq } from 'drizzle-orm';
import type { Db } from '../../../core/db/drizzle.ts';
import { createFields, deleteFields, naturalId, notDeleted, type Clock } from '../../../core/db/records.ts';
import { notes, type NoteTargetType } from '../../../core/db/schema.ts';

export type Note = typeof notes.$inferSelect;

const idOf = (type: NoteTargetType, targetId: string, weekStart: string) => naturalId('note', type, targetId, weekStart);

/** The note of the project or goal for the week starting on `weekStart`, or undefined. */
export async function getNote(db: Db, type: NoteTargetType, targetId: string, weekStart: string): Promise<Note | undefined> {
  const [row] = await db.select().from(notes).where(and(eq(notes.id, idOf(type, targetId, weekStart)), notDeleted(notes)));
  return row;
}

/**
 * Writes the note: one row per target and week (natural ID), so the same note written on two devices
 * ends up as one. An empty text deletes the note.
 */
export async function saveNote(db: Db, clock: Clock, type: NoteTargetType, targetId: string, weekStart: string, text: string): Promise<void> {
  const id = idOf(type, targetId, weekStart);
  const note = text.trim();
  if (note === '') {
    await db.update(notes).set(deleteFields(clock)).where(and(eq(notes.id, id), notDeleted(notes)));
    return;
  }
  await db
    .insert(notes)
    .values({ ...createFields(clock, id), targetType: type, targetId, weekStart, note })
    .onConflictDoUpdate({ target: notes.id, set: { note, updatedAt: clock().toISOString(), deletedAt: null } });
}

/** Notes of a project or goal, newest week first. */
export function listNotesForTarget(db: Db, type: NoteTargetType, targetId: string): Promise<Note[]> {
  return db
    .select()
    .from(notes)
    .where(and(eq(notes.targetType, type), eq(notes.targetId, targetId), notDeleted(notes)))
    .orderBy(desc(notes.weekStart));
}

/** All notes of a week, for a past review. */
export function listNotesForWeek(db: Db, weekStart: string): Promise<Note[]> {
  return db.select().from(notes).where(and(eq(notes.weekStart, weekStart), notDeleted(notes))).orderBy(notes.targetType, notes.createdAt);
}
