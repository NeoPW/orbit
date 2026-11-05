import { isNull } from 'drizzle-orm';
import type { SQLiteColumn } from 'drizzle-orm/sqlite-core';
import { v5 as uuidv5 } from 'uuid';

/** Fixed namespace for the UUID v5 IDs of records with a natural key. Never change it. */
const ORBIT_NAMESPACE = '6f0c2f1e-52c4-4c0e-9d0a-0b7f3a3e9a11';

export type Clock = () => Date;

export type NaturalKind = 'habit_check' | 'weekly_review' | 'note' | 'timer';

/** Random UUID v4 for a new record. */
export function newId(): string {
  return crypto.randomUUID();
}

/** Deterministic UUID v5 from a record kind and its natural key parts. */
export function naturalId(kind: NaturalKind, ...parts: string[]): string {
  return uuidv5([kind, ...parts].join(':'), ORBIT_NAMESPACE);
}

/** The timer is a single row with one fixed ID. */
export const TIMER_ID = naturalId('timer');

/** Columns to set when creating a record. Pass `id` for natural-key records. */
export function createFields(clock: Clock, id: string = newId()) {
  const now = clock().toISOString();
  return { id, createdAt: now, updatedAt: now, deletedAt: null };
}

/** Columns to set on every update. */
export function updateFields(clock: Clock) {
  return { updatedAt: clock().toISOString() };
}

/** Columns to set when soft-deleting; also bumps `updated_at` so the delete syncs. */
export function deleteFields(clock: Clock) {
  const now = clock().toISOString();
  return { deletedAt: now, updatedAt: now };
}

/** The filter every query adds to leave out soft-deleted rows. */
export function notDeleted(table: { deletedAt: SQLiteColumn }) {
  return isNull(table.deletedAt);
}
