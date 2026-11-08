import type { SqlDriver } from '../../src/platform/db/driver.ts';
import { HttpError } from './errors.ts';

/** What a phone asks about when a reminder is due: a habit on a date, a task or a project. */
export type ReminderTarget = { kind: 'habit'; id: string; date: string } | { kind: 'task'; id: string } | { kind: 'project'; id: string };

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Reads the request body; anything else than a habit with a date, a task or a project is a 400. */
export function parseReminderTarget(body: unknown): ReminderTarget {
  const value = (typeof body === 'object' && body !== null ? body : {}) as Record<string, unknown>;
  const id = typeof value.id === 'string' && value.id !== '' ? value.id : null;
  if (id !== null) {
    if (value.kind === 'habit' && typeof value.date === 'string' && DATE.test(value.date)) return { kind: 'habit', id, date: value.date };
    if (value.kind === 'task' || value.kind === 'project') return { kind: value.kind, id };
  }
  throw new HttpError(400, 'Expected { kind: "habit", id, date } or { kind: "task" | "project", id }');
}

async function first(driver: SqlDriver, sql: string, params: unknown[]): Promise<unknown[] | undefined> {
  return (await driver.query(sql, params, 'get')).rows[0];
}

/**
 * Whether the reminder is still needed, from the rows the server holds (see sync-server, "Reminder check"). An id the
 * server does not know is needed: the reminder may be for something not yet synced.
 */
export async function reminderNeeded(driver: SqlDriver, target: ReminderTarget): Promise<boolean> {
  if (target.kind === 'habit') {
    const habit = await first(driver, 'SELECT active, deleted_at FROM habits WHERE id = ?', [target.id]);
    if (habit && (habit[1] !== null || Number(habit[0]) === 0)) return false;
    const check = await first(driver, 'SELECT 1 FROM habit_checks WHERE habit_id = ? AND date = ? AND deleted_at IS NULL', [
      target.id,
      target.date,
    ]);
    return check === undefined;
  }
  const table = target.kind === 'task' ? 'tasks' : 'projects';
  const open = target.kind === 'task' ? 'open' : 'active';
  const row = await first(driver, `SELECT status, deleted_at FROM ${table} WHERE id = ?`, [target.id]);
  return row === undefined || (row[1] === null && row[0] === open);
}
