import { integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

/** Columns every synced table shares. Timestamps are ISO 8601 UTC text. */
const shared = () => ({
  id: text('id').primaryKey(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  deletedAt: text('deleted_at'),
});

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

/** Each synced table's own columns (besides the shared ones), one factory per table so builders are never reused. */
export const columns = {
  areas: () => ({
    ...shared(),
    name: text('name').notNull(),
    color: text('color').notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
  }),
  goals: () => ({
    ...shared(),
    title: text('title').notNull(),
    description: text('description').notNull().default(''),
    startDate: text('start_date'),
    endDate: text('end_date'),
    status: text('status', { enum: GOAL_STATUSES }).notNull().default('active'),
    sortOrder: integer('sort_order').notNull().default(0),
    color: text('color'),
  }),
  measures: () => ({
    ...shared(),
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
  }),
  projects: () => ({
    ...shared(),
    title: text('title').notNull(),
    description: text('description').notNull().default(''),
    areaId: text('area_id'),
    goalId: text('goal_id'),
    status: text('status', { enum: PROJECT_STATUSES }).notNull().default('active'),
    importance: integer('importance').notNull().default(3),
    deadline: text('deadline'),
    /** Colour slot key (`pc0`..`pc7`); null for projects from before colours existed. */
    color: text('color'),
    completedAt: text('completed_at'),
  }),
  tasks: () => ({
    ...shared(),
    projectId: text('project_id'),
    goalId: text('goal_id'),
    title: text('title').notNull(),
    notes: text('notes').notNull().default(''),
    dueDate: text('due_date'),
    importance: integer('importance'),
    isNextStep: integer('is_next_step', { mode: 'boolean' }).notNull().default(false),
    status: text('status', { enum: TASK_STATUSES }).notNull().default('open'),
    completedAt: text('completed_at'),
  }),
  habits: () => ({
    ...shared(),
    title: text('title').notNull(),
    projectId: text('project_id'),
    goalId: text('goal_id'),
    scheduleType: text('schedule_type', { enum: SCHEDULE_TYPES }).notNull().default('daily'),
    /** JSON array of weekday numbers (1 = Monday ... 7 = Sunday), for `weekdays`. */
    weekdays: text('weekdays', { mode: 'json' }).$type<number[]>(),
    timesPerWeek: integer('times_per_week'),
    reminderTime: text('reminder_time'),
    active: integer('active', { mode: 'boolean' }).notNull().default(true),
  }),
  logEntries: () => ({
    ...shared(),
    projectId: text('project_id'),
    goalId: text('goal_id'),
    taskId: text('task_id'),
    habitId: text('habit_id'),
    occurredAt: text('occurred_at').notNull(),
    durationMinutes: integer('duration_minutes'),
    note: text('note').notNull().default(''),
    source: text('source', { enum: LOG_SOURCES }).notNull().default('manual'),
  }),
  timers: () => ({
    ...shared(),
    projectId: text('project_id'),
    taskId: text('task_id'),
    habitId: text('habit_id'),
    /** Start of the current stretch (a resumed session starts a new one). */
    startedAt: text('started_at').notNull(),
    /** The session's time limit in worked minutes; null for no limit. */
    plannedMinutes: integer('planned_minutes'),
    /** Set while the session is paused; null while it runs. */
    pausedAt: text('paused_at'),
    /** Exact time of the earlier stretches of this session, in seconds (not their rounded entries). */
    workedSeconds: integer('worked_seconds').notNull().default(0),
    /** The log entry of the last logged stretch. */
    lastEntryId: text('last_entry_id'),
  }),
  reviewMeasureSnapshots: () => ({
    ...shared(),
    weeklyReviewId: text('weekly_review_id').notNull(),
    measureId: text('measure_id').notNull(),
    progress: real('progress').notNull(),
  }),
  habitChecks: () => ({
    ...shared(),
    habitId: text('habit_id').notNull(),
    date: text('date').notNull(),
    logEntryId: text('log_entry_id'),
  }),
  notes: () => ({
    ...shared(),
    targetType: text('target_type', { enum: NOTE_TARGET_TYPES }).notNull(),
    targetId: text('target_id').notNull(),
    weekStart: text('week_start').notNull(),
    note: text('note').notNull().default(''),
  }),
  weeklyReviews: () => ({
    ...shared(),
    weekStart: text('week_start').notNull(),
    score: integer('score'),
    reflection: text('reflection').notNull().default(''),
    planNextWeek: text('plan_next_week').notNull().default(''),
    completedAt: text('completed_at'),
  }),
};

export const areas = sqliteTable('areas', columns.areas());

export const goals = sqliteTable('goals', columns.goals());

export const measures = sqliteTable('measures', columns.measures());

export const projects = sqliteTable('projects', columns.projects());

export const tasks = sqliteTable('tasks', columns.tasks());

export const habits = sqliteTable('habits', columns.habits());

export const habitChecks = sqliteTable('habit_checks', columns.habitChecks(), (t) => [uniqueIndex('habit_checks_habit_date').on(t.habitId, t.date)]);

export const logEntries = sqliteTable('log_entries', columns.logEntries());

export const timers = sqliteTable('timers', columns.timers());

export const notes = sqliteTable('notes', columns.notes(), (t) => [uniqueIndex('notes_target_week').on(t.targetType, t.targetId, t.weekStart)]);

export const weeklyReviews = sqliteTable('weekly_reviews', columns.weeklyReviews(), (t) => [uniqueIndex('weekly_reviews_week_start').on(t.weekStart)]);

export const reviewMeasureSnapshots = sqliteTable('review_measure_snapshots', columns.reviewMeasureSnapshots());

/** Local only, never synced: no shared columns. */
export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

export type Area = typeof areas.$inferSelect;
export type NewArea = typeof areas.$inferInsert;

export type Goal = typeof goals.$inferSelect;
export type Measure = typeof measures.$inferSelect;

/** Every synced table by its SQL name (all but the local `settings`). */
export const SYNCED_TABLES = {
  areas: areas,
  goals: goals,
  measures: measures,
  projects: projects,
  tasks: tasks,
  habits: habits,
  log_entries: logEntries,
  timers: timers,
  review_measure_snapshots: reviewMeasureSnapshots,
  habit_checks: habitChecks,
  notes: notes,
  weekly_reviews: weeklyReviews,
} as const;

export type SyncedTableName = keyof typeof SYNCED_TABLES;
