import { integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

/** Columns every synced table shares. Timestamps are ISO 8601 UTC text. */
const shared = {
  id: text('id').primaryKey(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  deletedAt: text('deleted_at'),
};

export const GOAL_STATUSES = ['active', 'completed', 'archived'] as const;
export const MEASURE_TYPES = ['numeric', 'boolean', 'habit'] as const;
export const PROJECT_STATUSES = ['active', 'backlog', 'paused', 'completed'] as const;
export const TASK_STATUSES = ['open', 'done'] as const;
export const SCHEDULE_TYPES = ['daily', 'weekdays', 'times_per_week'] as const;
export const LOG_SOURCES = ['manual', 'habit', 'task', 'timer'] as const;
export const NOTE_TARGET_TYPES = ['project', 'goal'] as const;

export type GoalStatus = (typeof GOAL_STATUSES)[number];
export type MeasureType = (typeof MEASURE_TYPES)[number];
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];
export type TaskStatus = (typeof TASK_STATUSES)[number];
export type ScheduleType = (typeof SCHEDULE_TYPES)[number];
export type LogSource = (typeof LOG_SOURCES)[number];
export type NoteTargetType = (typeof NOTE_TARGET_TYPES)[number];

export const areas = sqliteTable('areas', {
  ...shared,
  name: text('name').notNull(),
  color: text('color').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const goals = sqliteTable('goals', {
  ...shared,
  title: text('title').notNull(),
  description: text('description').notNull().default(''),
  startDate: text('start_date'),
  endDate: text('end_date'),
  status: text('status', { enum: GOAL_STATUSES }).notNull().default('active'),
  sortOrder: integer('sort_order').notNull().default(0),
  color: text('color'),
});

export const measures = sqliteTable('measures', {
  ...shared,
  goalId: text('goal_id').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull().default(''),
  measureType: text('measure_type', { enum: MEASURE_TYPES }).notNull(),
  startValue: real('start_value'),
  targetValue: real('target_value'),
  currentValue: real('current_value'),
  unit: text('unit'),
  step: real('step').notNull().default(1),
  habitId: text('habit_id'),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const projects = sqliteTable('projects', {
  ...shared,
  title: text('title').notNull(),
  description: text('description').notNull().default(''),
  areaId: text('area_id'),
  goalId: text('goal_id'),
  status: text('status', { enum: PROJECT_STATUSES }).notNull().default('active'),
  importance: integer('importance').notNull().default(3),
  deadline: text('deadline'),
  completedAt: text('completed_at'),
});

export const tasks = sqliteTable('tasks', {
  ...shared,
  projectId: text('project_id'),
  goalId: text('goal_id'),
  title: text('title').notNull(),
  notes: text('notes').notNull().default(''),
  dueDate: text('due_date'),
  importance: integer('importance'),
  isNextStep: integer('is_next_step', { mode: 'boolean' }).notNull().default(false),
  status: text('status', { enum: TASK_STATUSES }).notNull().default('open'),
  completedAt: text('completed_at'),
});

export const habits = sqliteTable('habits', {
  ...shared,
  title: text('title').notNull(),
  projectId: text('project_id'),
  goalId: text('goal_id'),
  scheduleType: text('schedule_type', { enum: SCHEDULE_TYPES }).notNull().default('daily'),
  /** JSON array of weekday numbers (1 = Monday ... 7 = Sunday), for `weekdays`. */
  weekdays: text('weekdays', { mode: 'json' }).$type<number[]>(),
  timesPerWeek: integer('times_per_week'),
  reminderTime: text('reminder_time'),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
});

export const habitChecks = sqliteTable(
  'habit_checks',
  {
    ...shared,
    habitId: text('habit_id').notNull(),
    date: text('date').notNull(),
    logEntryId: text('log_entry_id'),
  },
  (t) => [uniqueIndex('habit_checks_habit_date').on(t.habitId, t.date)],
);

export const logEntries = sqliteTable('log_entries', {
  ...shared,
  projectId: text('project_id'),
  goalId: text('goal_id'),
  taskId: text('task_id'),
  occurredAt: text('occurred_at').notNull(),
  durationMinutes: integer('duration_minutes'),
  note: text('note').notNull().default(''),
  source: text('source', { enum: LOG_SOURCES }).notNull().default('manual'),
});

export const timers = sqliteTable('timers', {
  ...shared,
  projectId: text('project_id'),
  taskId: text('task_id'),
  startedAt: text('started_at').notNull(),
  plannedMinutes: integer('planned_minutes'),
});

export const notes = sqliteTable(
  'notes',
  {
    ...shared,
    targetType: text('target_type', { enum: NOTE_TARGET_TYPES }).notNull(),
    targetId: text('target_id').notNull(),
    weekStart: text('week_start').notNull(),
    note: text('note').notNull().default(''),
  },
  (t) => [uniqueIndex('notes_target_week').on(t.targetType, t.targetId, t.weekStart)],
);

export const weeklyReviews = sqliteTable(
  'weekly_reviews',
  {
    ...shared,
    weekStart: text('week_start').notNull(),
    score: integer('score'),
    reflection: text('reflection').notNull().default(''),
    planNextWeek: text('plan_next_week').notNull().default(''),
    completedAt: text('completed_at'),
  },
  (t) => [uniqueIndex('weekly_reviews_week_start').on(t.weekStart)],
);

export const reviewMeasureSnapshots = sqliteTable('review_measure_snapshots', {
  ...shared,
  weeklyReviewId: text('weekly_review_id').notNull(),
  measureId: text('measure_id').notNull(),
  progress: real('progress').notNull(),
});

/** Local only, never synced: no shared columns. */
export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

export type Area = typeof areas.$inferSelect;
export type NewArea = typeof areas.$inferInsert;
