import { and, desc, eq, isNull } from 'drizzle-orm';
import type { Db } from '../../../core/db/drizzle.ts';
import { createFields, deleteFields, newId, notDeleted, type Clock } from '../../../core/db/records.ts';
import { habitChecks, habits, logEntries, projects, tasks, type LogSource } from '../../../core/db/schema.ts';
import { workOnGoal, type GoalWork, type WorkLinks } from '../domain/work-log.ts';

export type LogEntry = typeof logEntries.$inferSelect;

export interface LogEntryInput {
  projectId: string | null;
  goalId: string | null;
  taskId: string | null;
  /** The habit a focus session ran for. */
  habitId?: string | null;
  /** ISO instant. */
  occurredAt: string;
  durationMinutes: number | null;
  note: string;
  source: LogSource;
}

/** The query that inserts a log entry, for callers that write it in a batch with other rows. */
export function insertLogEntryQuery(db: Db, clock: Clock, input: LogEntryInput, id: string = newId()) {
  return db.insert(logEntries).values({ ...createFields(clock, id), ...input });
}

/** The query that soft-deletes a log entry. */
export function deleteLogEntryQuery(db: Db, clock: Clock, id: string) {
  return db.update(logEntries).set(deleteFields(clock)).where(eq(logEntries.id, id));
}

/** A task's current project and goal (also when the task is done or deleted, so a running timer keeps its links). */
export async function taskLinks(db: Db, taskId: string): Promise<{ projectId: string | null; goalId: string | null }> {
  const [task] = await db.select({ projectId: tasks.projectId, goalId: tasks.goalId }).from(tasks).where(eq(tasks.id, taskId));
  return { projectId: task?.projectId ?? null, goalId: task?.goalId ?? null };
}

/** What a manual entry is logged on: a project, or a task (which brings its project or goal). */
export type LogTarget = { projectId: string } | { taskId: string } | { habitId: string };

/** A habit's project and goal (also when it is inactive, so a running timer keeps its links). */
export async function habitLinks(db: Db, habitId: string): Promise<{ projectId: string | null; goalId: string | null }> {
  const [habit] = await db.select({ projectId: habits.projectId, goalId: habits.goalId }).from(habits).where(eq(habits.id, habitId));
  return { projectId: habit?.projectId ?? null, goalId: habit?.goalId ?? null };
}

/** The project and goal a target belongs to. */
export async function targetLinks(db: Db, target: LogTarget): Promise<{ projectId: string | null; goalId: string | null }> {
  if ('taskId' in target) return taskLinks(db, target.taskId);
  if ('habitId' in target) return habitLinks(db, target.habitId);
  return { projectId: target.projectId, goalId: null };
}

export interface ManualEntryInput {
  target: LogTarget;
  /** Already validated, see `parseDuration`. */
  durationMinutes: number | null;
  note: string;
  /** When the work ended; the current time when left out. */
  occurredAt?: Date;
}

/** Saves a manual log entry at the current time and returns its ID. */
export async function addManualEntry(db: Db, clock: Clock, input: ManualEntryInput): Promise<string> {
  const links = await targetLinks(db, input.target);
  const id = newId();
  await insertLogEntryQuery(
    db,
    clock,
    {
      projectId: links.projectId,
      goalId: links.goalId,
      taskId: 'taskId' in input.target ? input.target.taskId : null,
      habitId: 'habitId' in input.target ? input.target.habitId : null,
      occurredAt: (input.occurredAt ?? clock()).toISOString(),
      durationMinutes: input.durationMinutes,
      note: input.note.trim(),
      source: 'manual',
    },
    id,
  );
  return id;
}

/** Entries of a project, newest first. */
export function listEntriesForProject(db: Db, projectId: string): Promise<LogEntry[]> {
  return db
    .select()
    .from(logEntries)
    .where(and(eq(logEntries.projectId, projectId), notDeleted(logEntries)))
    .orderBy(desc(logEntries.occurredAt));
}

/** Entries of a task, newest first. */
export function listEntriesForTask(db: Db, taskId: string): Promise<LogEntry[]> {
  return db
    .select()
    .from(logEntries)
    .where(and(eq(logEntries.taskId, taskId), notDeleted(logEntries)))
    .orderBy(desc(logEntries.occurredAt));
}

/** All entries, for the "recently used first" ordering of Log work. */
export function listAllEntries(db: Db): Promise<LogEntry[]> {
  return db.select().from(logEntries).where(notDeleted(logEntries));
}

/** Work on a goal by the current links of projects and tasks; `week` is the UTC range of the local week. */
export async function listWorkOnGoal(db: Db, goalId: string, week: { from: string; to: string }): Promise<GoalWork<LogEntry>> {
  const [entries, projectRows, taskRows] = await Promise.all([
    listAllEntries(db),
    db.select({ id: projects.id, goalId: projects.goalId }).from(projects).where(notDeleted(projects)),
    db.select({ id: tasks.id, projectId: tasks.projectId, goalId: tasks.goalId }).from(tasks),
  ]);
  const links: WorkLinks = {
    projectGoals: new Map(projectRows.map((p) => [p.id, p.goalId])),
    tasks: new Map(taskRows.map((t) => [t.id, { projectId: t.projectId, goalId: t.goalId }])),
  };
  return workOnGoal(entries, goalId, links, week);
}

/** Soft-deletes the entry and, when a habit check created it, that check, in one batch. */
export async function deleteLogEntry(db: Db, clock: Clock, id: string): Promise<void> {
  await db.batch([
    deleteLogEntryQuery(db, clock, id),
    db
      .update(habitChecks)
      .set(deleteFields(clock))
      .where(and(eq(habitChecks.logEntryId, id), notDeleted(habitChecks))),
  ]);
}

export interface LogTargets {
  projects: { id: string; title: string }[];
  /** Open tasks that belong to no project. */
  tasks: { id: string; title: string }[];
}

/** What Log work offers: active projects and open tasks outside projects. */
export async function listLogTargets(db: Db): Promise<LogTargets> {
  const [projectRows, taskRows] = await Promise.all([
    db
      .select({ id: projects.id, title: projects.title })
      .from(projects)
      .where(and(eq(projects.status, 'active'), notDeleted(projects))),
    db
      .select({ id: tasks.id, title: tasks.title })
      .from(tasks)
      .where(and(isNull(tasks.projectId), eq(tasks.status, 'open'), notDeleted(tasks))),
  ]);
  return { projects: projectRows, tasks: taskRows };
}
