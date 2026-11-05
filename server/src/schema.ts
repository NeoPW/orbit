import { index, integer, sqliteTable } from 'drizzle-orm/sqlite-core';
import { columns } from '../../src/core/db/schema.ts';

/**
 * The server's tables: the app's columns plus `server_seq`, the change number
 * pulls page by. Only primary keys are unique (natural-key IDs already make
 * duplicates one row), and there are no foreign keys. Used for migrations.
 */
const serverSeq = () => ({ serverSeq: integer('server_seq').notNull() });

export const areas = sqliteTable('areas', { ...columns.areas(), ...serverSeq() }, (t) => [index('areas_server_seq').on(t.serverSeq)]);
export const goals = sqliteTable('goals', { ...columns.goals(), ...serverSeq() }, (t) => [index('goals_server_seq').on(t.serverSeq)]);
export const measures = sqliteTable('measures', { ...columns.measures(), ...serverSeq() }, (t) => [index('measures_server_seq').on(t.serverSeq)]);
export const projects = sqliteTable('projects', { ...columns.projects(), ...serverSeq() }, (t) => [index('projects_server_seq').on(t.serverSeq)]);
export const tasks = sqliteTable('tasks', { ...columns.tasks(), ...serverSeq() }, (t) => [index('tasks_server_seq').on(t.serverSeq)]);
export const habits = sqliteTable('habits', { ...columns.habits(), ...serverSeq() }, (t) => [index('habits_server_seq').on(t.serverSeq)]);
export const habitChecks = sqliteTable('habit_checks', { ...columns.habitChecks(), ...serverSeq() }, (t) => [index('habit_checks_server_seq').on(t.serverSeq)]);
export const logEntries = sqliteTable('log_entries', { ...columns.logEntries(), ...serverSeq() }, (t) => [index('log_entries_server_seq').on(t.serverSeq)]);
export const timers = sqliteTable('timers', { ...columns.timers(), ...serverSeq() }, (t) => [index('timers_server_seq').on(t.serverSeq)]);
export const notes = sqliteTable('notes', { ...columns.notes(), ...serverSeq() }, (t) => [index('notes_server_seq').on(t.serverSeq)]);
export const weeklyReviews = sqliteTable('weekly_reviews', { ...columns.weeklyReviews(), ...serverSeq() }, (t) => [index('weekly_reviews_server_seq').on(t.serverSeq)]);
export const reviewMeasureSnapshots = sqliteTable('review_measure_snapshots', { ...columns.reviewMeasureSnapshots(), ...serverSeq() }, (t) => [index('review_measure_snapshots_server_seq').on(t.serverSeq)]);

/** The change counter: one row (`id` 1) holding the last assigned `server_seq`. */
export const syncState = sqliteTable('sync_state', {
  id: integer('id').primaryKey(),
  seq: integer('seq').notNull(),
});
